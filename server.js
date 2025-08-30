const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { loadTable, scoreTransport } = require('./scoring');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 60_000, max: 60 }));

// Database and scoring imports
const { db, getBalance } = require('./db');
const { nanoid } = require('nanoid');

// Demo auth: single seeded user (replace in prod)
const DEMO_USER_ID = 'u_demo';

// Session management (simple in-memory for demo - use Redis in production)
const sessions = new Map();

// Static files
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load transport scoring table on startup
loadTable().then(() => console.log('✅ transport scoring table loaded'));

// Create demo user if it doesn't exist
async function createDemoUser() {
  try {
    const demoEmail = 'demo@suscoin.com';
    const demoPassword = 'demo123';
    const passwordHash = await bcrypt.hash(demoPassword, 12);
    
    db.get('SELECT id FROM users WHERE email = ?', [demoEmail], (err, row) => {
      if (err) {
        console.error('Error checking demo user:', err);
        return;
      }
      
      if (!row) {
        db.run(
          'INSERT INTO users (id, name, email, password_hash, occupation) VALUES (?, ?, ?, ?, ?)',
          [DEMO_USER_ID, 'Demo User', demoEmail, passwordHash, 'professional'],
          function(err) {
            if (err) {
              console.error('Error creating demo user:', err);
            } else {
              console.log('✅ Demo user created (email: demo@suscoin.com, password: demo123)');
              
              // Create initial wallet entry for demo user
              db.run(
                'INSERT INTO wallet_ledger (id, user_id, delta, reason) VALUES (?, ?, ?, ?)',
                [nanoid(), DEMO_USER_ID, 100, 'demo_welcome_bonus'],
                function(err) {
                  if (err) {
                    console.error('Error creating demo welcome bonus:', err);
                  }
                }
              );
            }
          }
        );
      } else {
        console.log('✅ Demo user already exists');
      }
    });
  } catch (error) {
    console.error('Error in createDemoUser:', error);
  }
}

createDemoUser();

// API Endpoints

// Create activity (transport v1)
app.post('/api/activity', requireAuth, (req, res) => {
  const { type, mode, distanceKm, evidenceUrl } = req.body || {};
  if (type !== 'transport') return res.status(400).json({ error: 'unsupported type' });
  if (!mode || !Number.isFinite(distanceKm)) return res.status(400).json({ error: 'mode & distanceKm required' });

  const result = scoreTransport({ mode, distanceKm: Number(distanceKm) });

  const id = nanoid();
  db.serialize(()=>{
    db.run(`INSERT INTO activities(id,user_id,type,mode,distance_km,co2e_saved_kg,score,coins,evidence_url,status)
            VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [id, req.user.userId, 'transport', mode, result.distanceKm, result.co2eSavedKg, result.score, result.coins, evidenceUrl || null, 'verified']
    );
    if (result.coins > 0){
      db.run(`INSERT INTO wallet_ledger(id,user_id,delta,reason) VALUES(?,?,?,?)`,
        [nanoid(), req.user.userId, result.coins, `activity:${id}`]
      );
    }
  });

  res.json({ success:true, activityId:id, ...result });
});

// Wallet summary
app.get('/api/wallet', requireAuth, async (req,res)=>{
  const bal = await getBalance(req.user.userId);
  db.all(`SELECT * FROM wallet_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 50`, [req.user.userId],
    (e,rows)=> res.json({ balance: bal, ledger: rows || [] })
  );
});

// List partner catalog (demo)
app.get('/api/partners', (req,res)=>{
  db.all(`SELECT id,name,catalog_json FROM partners`, [], (e,rows)=>{
    if (e) return res.status(500).json({error:String(e)});
    const partners = (rows||[]).map(r=> ({ id:r.id, name:r.name, catalog: JSON.parse(r.catalog_json) }));
    res.json({ partners });
  });
});

// Redeem an item
app.post('/api/redeem', requireAuth, async (req,res)=>{
  const { partnerId, itemId } = req.body || {};
  if(!partnerId || !itemId) return res.status(400).json({error:'partnerId & itemId required'});

  db.get(`SELECT catalog_json FROM partners WHERE id=?`, [partnerId], async (e,row)=>{
    if (e || !row) return res.status(404).json({error:'partner not found'});
    const catalog = JSON.parse(row.catalog_json);
    const item = catalog.find(i=> i.id === itemId);
    if (!item) return res.status(404).json({error:'item not found'});

    const bal = await getBalance(req.user.userId);
    if (bal < item.price_coins) return res.status(400).json({error:'insufficient balance'});

    const rid = nanoid();
    db.serialize(()=>{
      db.run(`INSERT INTO redemptions(id,user_id,partner_id,item_id,coins,status)
              VALUES(?,?,?,?,?,'used')`,
        [rid, req.user.userId, partnerId, itemId, item.price_coins]
      );
      db.run(`INSERT INTO wallet_ledger(id,user_id,delta,reason) VALUES(?,?,?,?)`,
        [nanoid(), req.user.userId, -item.price_coins, `redeem:${rid}`]
      );
    });

    res.json({ success:true, redemptionId: rid, item });
  });
});

// Mock data for real-time counters
let liveData = {
  co2Saved: 1247.3,
  activeWorkers: 892,
  rewardsRedeemed: 156,
  lastUpdate: new Date()
};

// Mock user data
const mockUser = {
  name: "Sarah Johnson",
  avatar: "S",
  totalCO2Saved: 156.7,
  monthlyCO2Saved: 23.4,
  monthlyCredits: 156,
  monthlyGoal: 200,
  walletBalance: 234,
  totalEarned: 456,
  totalRedeemed: 222,
  pendingBalance: 45,
  transportScore: 89,
  transportCO2: 67.3,
  waterScore: 45,
  waterCO2: 23.1,
  wasteScore: 67,
  wasteCO2: 34.2,
  electricityScore: 34,
  electricityCO2: 32.1,
  recentActivity: [
    { icon: "🚴", description: "Bike delivery completed", time: "2 hours ago", credits: 5, co2: 0.8 },
    { icon: "🚌", description: "Public transport used", time: "1 day ago", credits: 3, co2: 0.4 },
    { icon: "♻️", description: "Recycling logged", time: "2 days ago", credits: 2, co2: 0.2 },
    { icon: "💧", description: "Water saving action", time: "3 days ago", credits: 1, co2: 0.1 }
  ],
  transactions: [
    { icon: "🚴", description: "Bike delivery", date: "Today", type: "earned", amount: 5, co2: 0.8 },
    { icon: "🎁", description: "Coffee redeemed", date: "Yesterday", type: "redeemed", amount: 50, co2: 0 },
    { icon: "🚌", description: "Bus journey", date: "2 days ago", type: "earned", amount: 3, co2: 0.4 },
    { icon: "♻️", description: "Recycling", date: "3 days ago", type: "earned", amount: 2, co2: 0.2 }
  ],
  monthlyBreakdown: [
    { month: "December 2024", activities: 23, credits: 156, co2: 23.4 },
    { month: "November 2024", activities: 19, credits: 134, co2: 18.7 },
    { month: "October 2024", activities: 21, credits: 145, co2: 20.1 }
  ],
  redemptionHistory: [
    { icon: "☕", reward: "Free Coffee", date: "Yesterday", cost: 50, status: "Redeemed" },
    { icon: "🚇", reward: "Bus Pass", date: "1 week ago", cost: 200, status: "Used" },
    { icon: "🌱", reward: "Plant a Tree", date: "2 weeks ago", cost: 300, status: "Planted" }
  ]
};

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial data
  socket.emit('liveData', liveData);
  
  // Update data every 5 seconds
  const interval = setInterval(() => {
    // Simulate real-time updates
    liveData.co2Saved += Math.random() * 2;
    liveData.activeWorkers += Math.floor(Math.random() * 3) - 1;
    liveData.rewardsRedeemed += Math.floor(Math.random() * 2);
    liveData.lastUpdate = new Date();
    
    socket.emit('liveData', liveData);
  }, 5000);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
  
  // Handle demo QR scan
  socket.on('demoScan', () => {
    socket.emit('demoReward', {
      credits: 5,
      badge: '🌱 First Green Action',
      message: 'Welcome to susCoin! You\'ve earned your first credits.'
    });
  });
  
  // Handle reward redemption
  socket.on('redeemReward', (redemption) => {
    // In a real app, you'd validate and process the redemption
    console.log('Reward redemption:', redemption);
    socket.emit('redemptionUpdate', {
      newBalance: mockUser.walletBalance - redemption.cost,
      success: true
    });
  });
  
  // Handle user data updates
  socket.on('userDataUpdate', (data) => {
    // In a real app, you'd update the user's data
    console.log('User data update:', data);
    socket.emit('userData', mockUser);
  });
  
  // Handle leaderboard filter changes
  socket.on('leaderboardFilter', (filter) => {
    console.log('Leaderboard filter changed:', filter);
    // In a real app, you'd fetch filtered data here
  });
  
  // Handle analytics events
  socket.on('analytics', (event) => {
    console.log('Analytics event:', event);
    // In a real app, you'd send this to your analytics service
  });
});



// Authentication middleware for protected routes
function requireAuth(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    // Check if it's an API request
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    // For page requests, redirect to login
    return res.redirect('/login');
  }
  req.user = user;
  next();
}

// Public routes (no authentication required)
app.get('/', (req, res) => {
  const user = getCurrentUser(req);
  res.render('home', {
    title: 'susCoin - Turn gig work into citywide carbon wins',
    liveData: liveData,
    user: user
  });
});

app.get('/login', (req, res) => {
  // If user is already logged in, redirect to dashboard
  const user = getCurrentUser(req);
  if (user) {
    return res.redirect('/dashboard');
  }
  res.render('login', {
    title: 'Login - susCoin'
  });
});

app.get('/signup', (req, res) => {
  // If user is already logged in, redirect to dashboard
  const user = getCurrentUser(req);
  if (user) {
    return res.redirect('/dashboard');
  }
  res.render('signup', {
    title: 'Sign Up - susCoin'
  });
});

// Protected routes (authentication required)
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', {
    title: 'susCoin Dashboard - Your Climate Impact',
    user: req.user
  });
});

// User wallet
app.get('/wallet', requireAuth, (req, res) => {
  res.render('wallet', {
    title: 'susCoin Wallet - Your Balance & Transactions',
    user: req.user
  });
});

// Redemption page
app.get('/redeem', requireAuth, (req, res) => {
  res.render('redeem', {
    title: 'susCoin Redeem - Use Your Credits',
    user: req.user
  });
});

// Carbon calculator
app.get('/calculator', requireAuth, (req, res) => {
  res.render('calculator', {
    title: 'susCoin Carbon Calculator - Calculate Your Impact',
    user: req.user
  });
});

// Leaderboard page (placeholder)
app.get('/leaderboard', (req, res) => {
  res.render('error', {
    title: 'Leaderboard - Coming Soon',
    message: 'Leaderboard feature is coming soon!'
  });
});

// Score calculation page
app.get('/score-calculation', requireAuth, (req, res) => {
  res.render('score-calculation', {
    title: 'susCoin Score Calculation - Calculate Your Transport Impact',
    user: req.user
  });
});

// Connect Opal page (placeholder)
app.get('/connect-opal', (req, res) => {
  res.render('error', {
    title: 'Connect Opal Card - Coming Soon',
    message: 'Opal card integration is coming soon!'
  });
});

// Connect Mastercard page (placeholder)
app.get('/connect-mastercard', (req, res) => {
  res.render('error', {
    title: 'Connect Mastercard - Coming Soon',
    message: 'Mastercard integration is coming soon!'
  });
});

// Tips page (placeholder)
app.get('/tips', (req, res) => {
  res.render('error', {
    title: 'Monthly Goals & Tips - Coming Soon',
    message: 'Personalized tips and goals are coming soon!'
  });
});

app.get('/api/live-data', (req, res) => {
  res.json(liveData);
});



app.post('/api/demo-scan', (req, res) => {
  res.json({
    success: true,
    credits: 5,
    badge: '🌱 First Green Action',
    message: 'Welcome to susCoin!'
  });
});

// Authentication routes
app.post('/api/signup', async (req, res) => {
  const { name, email, occupation, password, newsletter } = req.body;
  
  if (!name || !email || !occupation || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'All required fields must be provided' 
    });
  }

  if (!['student', 'professional'].includes(occupation)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid occupation. Must be either "student" or "professional"' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long' 
    });
  }

  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Database error occurred' 
        });
      }

      if (row) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email already exists' 
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = nanoid();
      db.run(
        'INSERT INTO users (id, name, email, password_hash, occupation) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, passwordHash, occupation],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Error creating user account' 
            });
          }

          // Create initial wallet entry
          db.run(
            'INSERT INTO wallet_ledger (id, user_id, delta, reason) VALUES (?, ?, ?, ?)',
            [nanoid(), userId, 50, 'welcome_bonus'],
            function(err) {
              if (err) {
                console.error('Error creating welcome bonus:', err);
              }
              
              res.json({ 
                success: true, 
                message: 'Account created successfully! Welcome to susCoin!',
                userId: userId
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }

  try {
    db.get(
      'SELECT id, name, email, password_hash, occupation FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Database error occurred' 
          });
        }

        if (!user) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid email or password' 
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid email or password' 
          });
        }

        // Update last login
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        // Create session
        const sessionId = nanoid();
        const sessionData = {
          userId: user.id,
          email: user.email,
          name: user.name,
          occupation: user.occupation,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)) // 30 days or 1 day
        };
        sessions.set(sessionId, sessionData);

        // Set session cookie
        res.cookie('sessionId', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
          sameSite: 'strict'
        });

        res.json({ 
          success: true, 
          message: 'Login successful!',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            occupation: user.occupation
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
});

app.post('/api/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }
  
  res.clearCookie('sessionId');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Middleware to get current user
function getCurrentUser(req) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return null;
  }
  
  const session = sessions.get(sessionId);
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}



app.post('/api/pilot-request', (req, res) => {
  const { name, email, organization, message } = req.body;
  console.log('Pilot request:', { name, email, organization, message });
  res.json({ success: true, message: 'We\'ll be in touch soon!' });
});

// API endpoint for transport score calculation
app.post('/api/calculate-transport-score', requireAuth, (req, res) => {
  const { transportMode, distance } = req.body;
  
  if (!transportMode || !distance) {
    return res.status(400).json({ 
      success: false, 
      message: 'Transport mode and distance are required' 
    });
  }
  
  if (distance < 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Distance cannot be negative' 
    });
  }
  
  try {
    // Use centralized scoring logic
    const result = scoreTransport({ mode: transportMode, distanceKm: distance });
    
    // Check if the score is 0 (transport mode not viable for this distance)
    if (result.score === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `${transportMode} is not viable for ${result.distanceKm} km. This transport mode cannot cover such a distance.`,
        transportMode,
        distance: result.distanceKm,
        score: 0,
        credits: 0,
        co2Saved: 0
      });
    }
    
    // Prepare response message
    let message = 'Score calculated successfully';
    if (distance > 2500) {
      message = `Score calculated for 2500 km (maximum distance). Scores remain the same for distances beyond 2500 km.`;
    }
    
    res.json({
      success: true,
      transportMode,
      distance: result.distanceKm,
      originalDistance: distance,
      score: result.score.toFixed(2),
      credits: result.coins,
      co2Saved: result.co2eSavedKg,
      message,
      dataSource: `Centralized scoring system`,
      distanceCapped: distance > 2500
    });
    
  } catch (error) {
    console.error('Error calculating transport score:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error calculating transport score' 
    });
  }
});

// API endpoint to get available transport modes and distance ranges
app.get('/api/transport-info', (req, res) => {
  try {
    // Get available transport modes from the centralized scoring system
    const transportModes = Object.keys(require('./scoring').factors_g_per_km);
    
    res.json({
      success: true,
      transportModes,
      distanceRange: {
        min: 0,
        max: 2500,
        step: 5 // Based on CSV step size
      },
      message: 'Transport info retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting transport info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving transport information' 
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Page Not Found',
    message: 'The page you\'re looking for doesn\'t exist.' 
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🌍 susCoin server running on http://localhost:${PORT}`);
  console.log(`📊 WebSocket server ready for real-time updates`);
});

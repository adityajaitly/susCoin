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
const { db, getBalance, getUserPreferences } = require('./db');
const { nanoid } = require('nanoid');

// Demo auth: single seeded user (replace in prod)
const DEMO_USER_ID = 'u_demo';

// In-memory user storage (replace with database in production)
const users = new Map();

// Session management (simple in-memory for demo - use Redis in production)
const sessions = new Map();

// Initialize with some demo users
users.set('demo@suscoin.com', {
  id: 'u_demo',
  name: 'Demo User',
  email: 'demo@suscoin.com',
  password: 'demo123', // In production, use hashed passwords
  occupation: 'professional',
  createdAt: new Date(),
  wallet: 100
});

users.set('admin@suscoin.com', {
  id: 'u_admin',
  name: 'Admin User',
  email: 'admin@suscoin.com',
  password: 'admin123',
  occupation: 'professional',
  createdAt: new Date(),
  wallet: 500,
  isAdmin: true
});

// Static files
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load transport scoring table on startup
loadTable().then(() => console.log('✅ transport scoring table loaded'));

// Demo users are now created in memory at startup
console.log('✅ Demo users loaded in memory');

// API Endpoints

// Create activity (transport v1)
app.post('/api/activity', (req, res) => {
  const { type, mode, distanceKm, evidenceUrl } = req.body || {};
  if (type !== 'transport') return res.status(400).json({ error: 'unsupported type' });
  if (!mode || !Number.isFinite(distanceKm)) return res.status(400).json({ error: 'mode & distanceKm required' });

  const result = scoreTransport({ mode, distanceKm: Number(distanceKm) });

  // Use demo user ID for demo purposes
  const demoUserId = 'u_pitch_demo';

  const id = nanoid();
  db.serialize(()=>{
    db.run(`INSERT INTO activities(id,user_id,type,mode,distance_km,co2e_saved_kg,score,coins,evidence_url,status)
            VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [id, demoUserId, 'transport', mode, result.distanceKm, result.co2eSavedKg, result.score, result.coins, evidenceUrl || null, 'verified']
    );
    if (result.coins > 0){
      db.run(`INSERT INTO wallet_ledger(id,user_id,delta,reason) VALUES(?,?,?,?)`,
        [nanoid(), demoUserId, result.coins, `activity:${id}`]
      );
    }
  });

  res.json({ success:true, activityId:id, ...result });
});

// Wallet summary
app.get('/api/wallet', async (req,res)=>{
  // Use demo user ID for demo purposes
  const demoUserId = 'u_pitch_demo';
  const bal = await getBalance(demoUserId);
  db.all(`SELECT * FROM wallet_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 50`, [demoUserId],
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
app.post('/api/redeem', async (req,res)=>{
  const { partnerId, itemId } = req.body || {};
  if(!partnerId || !itemId) return res.status(400).json({error:'partnerId & itemId required'});

  db.get(`SELECT catalog_json FROM partners WHERE id=?`, [partnerId], async (e,row)=>{
    if (e || !row) return res.status(404).json({error:'partner not found'});
    const catalog = JSON.parse(row.catalog_json);
    const item = catalog.find(i=> i.id === itemId);
    if (!item) return res.status(404).json({error:'item not found'});

    // Use demo user ID for demo purposes
    const demoUserId = 'u_pitch_demo';
    const bal = await getBalance(demoUserId);
    if (bal < item.price_coins) return res.status(400).json({error:'insufficient balance'});

    const rid = nanoid();
    db.serialize(()=>{
      db.run(`INSERT INTO redemptions(id,user_id,partner_id,item_id,coins,status)
              VALUES(?,?,?,?,?,'used')`,
        [rid, demoUserId, partnerId, itemId, item.price_coins]
      );
      db.run(`INSERT INTO wallet_ledger(id,user_id,delta,reason) VALUES(?,?,?,?)`,
        [nanoid(), demoUserId, -item.price_coins, `redeem:${rid}`]
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

app.get('/auth', (req, res) => {
  // If user is already logged in, redirect to dashboard
  const user = getCurrentUser(req);
  if (user) {
    return res.redirect('/dashboard');
  }
  res.render('auth', {
    title: 'susCoin - Sign In or Create Profile'
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

// Personalized dashboards based on user type
app.get('/dashboard-student', (req, res) => {
  res.render('dashboard-student', {
    title: 'Student Dashboard - susCoin'
  });
});

app.get('/dashboard-professional', (req, res) => {
  res.render('dashboard-professional', {
    title: 'Professional Dashboard - susCoin'
  });
});

// Dashboard page (no authentication required for demo)
app.get('/dashboard', (req, res) => {
  // Create demo user data for dashboard
  const demoUser = {
    name: 'Pitch Demo User',
    avatar: 'P',
    totalCO2Saved: 45.2,
    monthlyCO2Saved: 12.8,
    monthlyCredits: 156,
    monthlyGoal: 200,
    // Top Impact Areas
    transportScore: 85,
    transportCO2: 18.5,
    waterScore: 72,
    waterCO2: 12.3,
    wasteScore: 68,
    wasteCO2: 8.9,
    electricityScore: 91,
    electricityCO2: 5.5,
    // Recent Activity
    recentActivity: [
      {
        icon: '🚶',
        description: 'Walking to Campus',
        time: '2 hours ago',
        credits: 25,
        co2: 2.5
      },
      {
        icon: '🚌',
        description: 'Public Transport',
        time: '1 day ago',
        credits: 15,
        co2: 1.8
      },
      {
        icon: '🌱',
        description: 'Welcome Bonus',
        time: '3 days ago',
        credits: 50,
        co2: 0
      },
      {
        icon: '🍕',
        description: 'Food Voucher Redeemed',
        time: '1 week ago',
        credits: 100,
        co2: 0
      }
    ]
  };
  
  res.render('dashboard', {
    title: 'susCoin Dashboard - Your Climate Impact',
    user: demoUser
  });
});

// User wallet
app.get('/wallet', (req, res) => {
  const demoUser = {
    name: 'Pitch Demo User',
    avatar: 'P',
    walletBalance: 440,
    totalEarned: 540,
    totalRedeemed: 100,
    pendingBalance: 0,
    transactions: [
      {
        icon: '🚶',
        title: 'Walking to Campus',
        time: '2 hours ago',
        amount: '25',
        type: 'earned',
        co2: 2.5
      },
      {
        icon: '🚌',
        title: 'Public Transport',
        time: '1 day ago',
        amount: '15',
        type: 'earned',
        co2: 1.8
      },
      {
        icon: '🌱',
        title: 'Welcome Bonus',
        time: '3 days ago',
        amount: '500',
        type: 'earned',
        co2: 0
      },
      {
        icon: '🍕',
        title: 'Food Voucher',
        time: '1 week ago',
        amount: '100',
        type: 'spent',
        co2: 0
      }
    ]
  };
  
  res.render('wallet', {
    title: 'susCoin Wallet - Your Balance & Transactions',
    user: demoUser
  });
});

// Redemption page
app.get('/redeem', (req, res) => {
  const demoUser = {
    name: 'Pitch Demo User',
    avatar: 'P',
    balance: 440
  };
  
  res.render('redeem', {
    title: 'susCoin Redeem - Use Your Credits',
    user: demoUser
  });
});

app.get('/connect-mastercard', (req, res) => {
  const demoUser = {
    name: 'Pitch Demo User',
    avatar: 'P',
    balance: 440
  };
  
  res.render('connect-mastercard', {
    title: 'susCoin Cash Out - Connect Mastercard',
    user: demoUser
  });
});

// Score calculation page (main calculator)
app.get('/score-calculation', (req, res) => {
  const demoUser = {
    name: 'Pitch Demo User',
    avatar: 'P'
  };
  
  res.render('score-calculation', {
    title: 'susCoin Score Calculation - Calculate Your Transport Impact',
    user: demoUser
  });
});

// Leaderboard page (placeholder)
app.get('/leaderboard', (req, res) => {
  res.render('error', {
    title: 'Leaderboard - Coming Soon',
    message: 'Leaderboard feature is coming soon!'
  });
});


// Carbon calculator
app.get('/calculator', (req, res) => {
  res.render('calculator', {
    title: 'susCoin Carbon Calculator - Calculate Your Impact',
    user: req.user
  });
});

// Connect Opal Card page
app.get('/connect-opal', (req, res) => {
  res.render('connect-opal', {
    title: 'Connect Opal Card - susCoin'
  });
});

// API endpoint to handle Opal card connection
app.post('/api/connect-opal', (req, res) => {
  const { cardNumber, securityCode, cardholderName, autoSync } = req.body;
  
  // Validate input
  if (!cardNumber || cardNumber.length !== 16) {
    return res.status(400).json({ error: 'Invalid card number' });
  }
  
  if (!securityCode || securityCode.length !== 4) {
    return res.status(400).json({ error: 'Invalid security code' });
  }
  
  if (!cardholderName || cardholderName.trim() === '') {
    return res.status(400).json({ error: 'Cardholder name is required' });
  }
  
  // In a real implementation, you would:
  // 1. Validate the card with Opal's API
  // 2. Store the connection securely
  // 3. Set up automatic syncing
  
  // For demo purposes, we'll simulate success
  const user = getCurrentUser(req);
  if (user) {
    // Update user with Opal connection info
    user.opalConnected = true;
    user.opalCardNumber = cardNumber.substring(12); // Store only last 4 digits
    user.opalAutoSync = autoSync;
    user.opalConnectedAt = new Date().toISOString();
  }
  
  res.json({ 
    success: true, 
    message: 'Opal card connected successfully',
    cardNumber: cardNumber.substring(12) // Return only last 4 digits
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
  const { firstName, lastName, email, password, city, gigType, status, ageGroup, livingSituation } = req.body;
  
  console.log('Signup request:', { firstName, lastName, email, city, gigType, status, ageGroup, livingSituation });
  
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'First name, last name, email, and password are required' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 6 characters long' 
    });
  }

  try {
    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    const userId = nanoid();
    const newUser = {
      id: userId,
      name: `${firstName} ${lastName}`,
      email: email,
      password: password, // In production, hash this
      city: city || 'Unknown',
      gigType: gigType || 'general',
      status: status || 'professional',
      ageGroup: ageGroup || '18-24',
      livingSituation: livingSituation || 'other',
      occupation: status === 'student' ? 'student' : 'professional',
      createdAt: new Date(),
      wallet: 50, // Welcome bonus
      isAdmin: false
    };

    // Store user in memory
    users.set(email, newUser);
    
    console.log('User created successfully:', { email, userId, status });
    console.log('Total users:', users.size);

    res.json({ 
      success: true, 
      message: 'Account created successfully! Welcome to susCoin!',
      userId: userId,
      user: {
        id: userId,
        name: newUser.name,
        email: email,
        city: city,
        gigType: gigType,
        status: status,
        ageGroup: ageGroup,
        livingSituation: livingSituation
      }
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
  
  console.log('Login request:', { email, rememberMe });
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }

  try {
    // Check if user exists in memory
    const user = users.get(email);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Verify password (simple comparison for demo)
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    users.set(email, user);
    
    console.log('User logged in successfully:', { email, userId: user.id });

    // Create session
    const sessionId = nanoid();
    const session = {
      userId: user.id,
      email: user.email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)) // 30 days or 1 day
    };
    
    sessions.set(sessionId, session);

    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    });

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        occupation: user.occupation,
        city: user.city,
        gigType: user.gigType,
        wallet: user.wallet
      }
    });
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
app.post('/api/calculate-transport-score', (req, res) => {
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

// API endpoint to get personalized recommendations based on user preferences
app.get('/api/personalized-recommendations', async (req, res) => {
  try {
    // Use demo user ID for demo purposes
    const demoUserId = 'u_pitch_demo';
    const preferences = await getUserPreferences(demoUserId);
    
    // Generate personalized recommendations based on preferences
    const recommendations = generatePersonalizedRecommendations(preferences);
    
    res.json({
      success: true,
      recommendations,
      preferences,
      message: 'Personalized recommendations generated successfully'
    });
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating personalized recommendations' 
    });
  }
});

// Function to generate personalized recommendations
function generatePersonalizedRecommendations(preferences) {
  const recommendations = {
    activities: [],
    rewards: [],
    tips: []
  };

  // Activity recommendations based on preferences
  if (preferences.primaryTransport === 'car') {
    recommendations.activities.push({
      type: 'transport',
      title: 'Try Public Transport',
      description: 'Switch to public transport for your daily commute to earn credits',
      potentialCredits: 15,
      difficulty: 'medium'
    });
  }

  if (preferences.budgetPriority === 'utilities') {
    recommendations.activities.push({
      type: 'energy',
      title: 'Energy Saving Challenge',
      description: 'Reduce your electricity usage by 10% this month',
      potentialCredits: 20,
      difficulty: 'easy'
    });
  }

  if (preferences.occupation === 'student') {
    recommendations.activities.push({
      type: 'transport',
      title: 'Campus Walking Challenge',
      description: 'Walk to all your classes this week instead of using transport',
      potentialCredits: 25,
      difficulty: 'easy'
    });
  }

  // Reward recommendations based on preferences
  if (preferences.preferredRewards && preferences.preferredRewards.includes('food_vouchers')) {
    recommendations.rewards.push({
      type: 'food',
      title: 'Campus Food Vouchers',
      description: 'Get 20% off at university cafeterias',
      cost: 100,
      category: 'food'
    });
  }

  if (preferences.preferredRewards && preferences.preferredRewards.includes('utility_bills')) {
    recommendations.rewards.push({
      type: 'utility',
      title: 'Electricity Bill Rebate',
      description: 'Get $10 off your next electricity bill',
      cost: 200,
      category: 'utilities'
    });
  }

  if (preferences.preferredRewards && preferences.preferredRewards.includes('transport')) {
    recommendations.rewards.push({
      type: 'transport',
      title: 'Public Transport Pass',
      description: 'Free week of public transport',
      cost: 150,
      category: 'transport'
    });
  }

  // Tips based on environmental interest
  if (preferences.environmentalInterest === 'very_interested') {
    recommendations.tips.push({
      title: 'Join Environmental Groups',
      description: 'Connect with local environmental organizations for community events',
      category: 'community'
    });
  } else if (preferences.environmentalInterest === 'somewhat_interested') {
    recommendations.tips.push({
      title: 'Start Small',
      description: 'Begin with simple actions like turning off lights when not in use',
      category: 'beginner'
    });
  }

  return recommendations;
}

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

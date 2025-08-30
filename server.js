const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

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
app.use(express.json());
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

// Routes
app.get('/', (req, res) => {
  res.render('home', {
    title: 'susCoin - Turn gig work into citywide carbon wins',
    liveData: liveData
  });
});

// User dashboard
app.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    title: 'susCoin Dashboard - Your Climate Impact',
    user: mockUser
  });
});

// User wallet
app.get('/wallet', (req, res) => {
  res.render('wallet', {
    title: 'susCoin Wallet - Your Balance & Transactions',
    user: mockUser
  });
});

// Redemption page
app.get('/redeem', (req, res) => {
  res.render('redeem', {
    title: 'susCoin Redeem - Use Your Credits',
    user: mockUser
  });
});

// Carbon calculator
app.get('/calculator', (req, res) => {
  res.render('calculator', {
    title: 'susCoin Carbon Calculator - Calculate Your Impact',
    user: mockUser
  });
});

// Leaderboard page (placeholder)
app.get('/leaderboard', (req, res) => {
  res.render('error', {
    title: 'Leaderboard - Coming Soon',
    message: 'Leaderboard feature is coming soon!'
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

app.post('/api/signup', (req, res) => {
  const { email, type } = req.body;
  console.log('Signup request:', { email, type });
  res.json({ success: true, message: 'Welcome to susCoin!' });
});

app.post('/api/pilot-request', (req, res) => {
  const { name, email, organization, message } = req.body;
  console.log('Pilot request:', { name, email, organization, message });
  res.json({ success: true, message: 'We\'ll be in touch soon!' });
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

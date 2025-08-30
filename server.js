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

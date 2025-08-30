# susCoin

**susCoin:** a city rewards layer that turns verified low-carbon actions into redeemable coins.

**how it works:** record → verify → reward → redeem; dashboards show CO₂e avoided & local spend.

**why it matters:** shrinks carbon footprints while boosting the local economy.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd susCoin

# Install dependencies and start development server
npm i
npm run dev
```

The app will be available at `http://localhost:3000`

## 🛠️ Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build Tailwind CSS for production
- `npm run build:css` - Build CSS with watch mode

### Project Structure
```
susCoin/
├── src/
│   └── input.css          # Tailwind CSS input file
├── views/
│   ├── home.ejs           # Main homepage template
│   └── error.ejs          # Error page template
├── public/
│   └── styles/
│       └── output.css     # Generated Tailwind CSS
├── server.js              # Express server
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
└── README.md              # This file
```

## 🎨 Design System

### Color Palette
The app uses a custom "tech-meets-climate" color palette:

**Light Theme:**
- Background: `#F6F8FA`
- Primary: `#065F46` (emerald-800)
- Secondary: `#1D4ED8` (blue-700)
- Accent: `#A3E635` (lime-400)

**Dark Theme:**
- Background: `#0F172A`
- Primary: `#22C55E`
- Secondary: `#60A5FA`
- Accent: `#BEF264`

### Components
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.btn-accent` - Accent/gamification buttons
- `.card` - Content containers
- `.badge-*` - Status and achievement badges

## 🌟 Features

### Homepage Sections
1. **Hero Section** - Main value proposition with live counters
2. **Live Impact Map** - Interactive map with real-time data
3. **Leaderboard** - City, suburb, and gig type rankings
4. **How It Works** - 3-step process explanation
5. **Rewards Strip** - Partner rewards carousel
6. **Diversity & Equity** - Equity index and breakdowns
7. **Impact Calculator** - Interactive impact simulation
8. **Tech & Trust** - Technology and privacy information
9. **Social Proof** - Testimonials and partner logos
10. **Conversion Blocks** - Signup forms for workers and cities

### Real-time Features
- Live counters for CO₂ saved, active workers, rewards redeemed
- WebSocket updates every 5 seconds
- Interactive demo QR scan with confetti animation
- Real-time leaderboard filtering

### Interactive Elements
- Theme toggle (light/dark mode)
- Interactive impact calculator
- Map filters and visualizations
- Form submissions with toast notifications
- Social sharing functionality

## 🔧 Technology Stack

- **Backend**: Node.js + Express
- **Frontend**: EJS templates + Tailwind CSS
- **Real-time**: Socket.IO
- **Maps**: Leaflet.js
- **Animations**: Canvas Confetti
- **Styling**: Custom susCoin color palette

## 📊 Analytics Events

The app tracks the following events:
- `page_view` - Page visits
- `cta_click` - Call-to-action clicks
- `demo_scan` - Demo QR code scans
- `leaderboard_filter` - Leaderboard filter changes
- `map_filter` - Map filter changes
- `signup_start` - Signup form submissions
- `pilot_request_submit` - Pilot request submissions

## 🎮 Gamification Elements

- **Badges**: Achievement badges for sustainable actions
- **Credits**: Micro-credits earned for eco-friendly work
- **Leaderboards**: City, suburb, and gig type competitions
- **Streaks**: 7-day streak bonuses
- **Rewards**: Partner discounts and perks

## 🌍 Climate Impact

### Carbon Calculations
- Bike delivery: ~0.024 kg CO₂ saved per delivery
- Tree equivalent: ~0.05 trees per kg CO₂
- Congestion avoided: ~0.156 hours per delivery

### Equity Features
- Extra multipliers for low-income areas
- Equity index tracking
- Small business partnerships
- Underserved community focus

## 🔐 Privacy & Security

- Differential privacy implementation
- Opt-in data collection only
- No precise location storage
- End-to-end encryption
- Append-only hash receipts
- Edge QR attestation

## 🚀 Deployment

### Environment Variables
```bash
PORT=3000  # Server port (default: 3000)
NODE_ENV=production  # Environment mode
```

### Production Build
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Why "susCoin"?**
Because sustainability ("sus") should be as rewarding as earning coins.

*Making climate action fun, transparent, and inclusive for everyone.* 🌍✨

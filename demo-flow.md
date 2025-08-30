# 🎯 susCoin Demo Flow - 3 Minutes

## 🚀 **Demo Setup**
1. **Start the server**: `npm run dev`
2. **Seed the database**: `npm run seed` (already done)
3. **Open browser**: Navigate to `http://localhost:3000`

---

## 📱 **Demo Flow**

### **Step 1: Calculate Transport Score (1 minute)**
- **Navigate to**: `/score-calculation` or click "Score Calculation" in nav
- **Input**: 
  - Transport Mode: `bike`
  - Distance: `5.2` km
- **Click**: "Calculate Score"
- **Result**: 
  - Score: 9.36/10
  - Credits: 9 susCoins
  - CO₂e avoided: 0.86 kg
- **Click**: "Log This Action" button
- **Toast**: "✅ +9 susCoins, 0.86 kg CO₂e avoided"

### **Step 2: View Wallet (30 seconds)**
- **Navigate to**: `/wallet` or click "Wallet" in nav
- **Show**: 
  - Balance: 9 susCoins
  - Ledger entry: "+9 coins from bike activity"
- **Point out**: Real-time balance update

### **Step 3: Add More Coins (30 seconds)**
- **Go back to**: Score calculation
- **Input**: 
  - Transport Mode: `bike`
  - Distance: `10` km
- **Click**: "Log This Action"
- **Result**: +19 susCoins, total balance: 28

### **Step 4: Redeem Reward (30 seconds)**
- **Navigate to**: `/redeem` or click "Redeem" in nav
- **Show**: Partner catalog (GreenBite Café)
- **Select**: "Organic Coffee" (15 coins)
- **Click**: "Redeem"
- **Result**: 
  - Redemption successful
  - Balance decreased to 13 coins
  - Ledger shows negative entry

### **Step 5: Show Live Counter (30 seconds)**
- **Navigate to**: Dashboard or home page
- **Point out**: 
  - Real-time community impact
- - Total CO₂e avoided
- - Live user activity
- - WebSocket updates

---

## 🎬 **Key Talking Points**

### **What to Highlight:**
1. **Seamless Integration**: Score → Log → Wallet → Redeem
2. **Real-time Updates**: WebSocket-powered live counters
3. **Anti-cheat Measures**: Distance validation, mode sanity checks
4. **Complete Loop**: From sustainable action to real reward
5. **Professional UI**: Clean, modern interface with Tailwind CSS

### **Technical Features:**
- **Centralized Scoring**: CSV-based transport scoring system
- **Database Persistence**: SQLite with proper foreign keys
- **API-First Design**: RESTful endpoints for all operations
- **Real-time Updates**: Socket.IO for live community data
- **Anti-cheat Protection**: Distance and mode validation

### **Business Value:**
- **Gamification**: Turn sustainability into rewards
- **Local Economy**: Partner with local businesses
- **Transparency**: Clear scoring and CO₂ calculations
- **Scalability**: Ready for city-wide deployment

---

## 🚨 **Demo Tips**

### **Before Demo:**
- ✅ Ensure `npm run seed` has been run
- ✅ Server is running (`npm run dev`)
- ✅ Database is clean and ready
- ✅ All APIs are responding

### **During Demo:**
- 🎯 **Keep it under 3 minutes**
- 🎯 **Show the complete user journey**
- 🎯 **Highlight real-time features**
- 🎯 **Demonstrate anti-cheat measures**
- 🎯 **End with live community counter**

### **If Something Goes Wrong:**
- 🔄 **Refresh the page** if UI glitches
- 🔄 **Check server logs** for API errors
- 🔄 **Verify database** with `npm run seed`
- 🔄 **Restart server** if needed

---

## 🎉 **Demo Success Criteria**

✅ **User can calculate transport scores**  
✅ **Activity logging works seamlessly**  
✅ **Wallet balance updates in real-time**  
✅ **Reward redemption is successful**  
✅ **Live community counter is visible**  
✅ **Anti-cheat measures are demonstrated**  
✅ **Complete user journey is shown**  

---

**🎯 Ready to demo! The system is fully functional and ready to showcase.**

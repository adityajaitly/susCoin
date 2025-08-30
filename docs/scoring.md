# 📊 susCoin Scoring System

## 🎯 **What Gets Rewarded**

### **Transport Activities (Per Trip)**
- **Bike rides**, **bus trips**, **train journeys**, **walking**
- **Real-time scoring** based on distance and mode
- **Immediate coin rewards** for sustainable choices

### **Utilities (Monthly Delta vs Baseline)**
- **Electricity consumption** reduction
- **Water usage** optimization  
- **Gas/heating** efficiency improvements
- **Comparison against** household/city averages

### **Solar Generation (Monthly)**
- **Solar panel output** verification
- **Grid contribution** measurement
- **Carbon offset** calculations

---

## 🧮 **Transport Scoring Formula**

### **Distance Banding**
```
band(distance) = nearest_5km(min(distance, 2500))
```
- **5km increments** for consistent scoring
- **2500km cap** - scores remain constant beyond this distance
- **Realistic limits** prevent gaming

### **Score Calculation**
```
score = table[mode][band] (0–10 from CSV)
```
- **CSV-based scoring** from `transport_scores_0to2500km_step5.csv`
- **Mode-specific scores** for each distance band
- **0-10 scale** relative to transport efficiency

### **Coin Rewards**
```
coins = round(score * (band/5) * COIN_PER_BAND)
```
- **Proportional to distance** and efficiency
- **Configurable economy** with `COIN_PER_BAND` multiplier
- **Fair distribution** based on actual impact

### **CO₂ Emissions Saved**
```
co2e_saved_kg = max((EF_car - EF_mode) * band / 1000, 0)
```
- **Baseline comparison** against car (solo/taxi)
- **Mode-specific factors** from peer-reviewed sources
- **Real carbon impact** in kilograms

---

## 🚦 **Anti-Cheat Thresholds**

### **Distance Limits by Mode**
| Transport Mode | Min Distance | Max Distance | Rationale |
|----------------|--------------|--------------|-----------|
| **Walking** | 0 km | **25 km** | Human endurance limit |
| **Bike** | 0 km | **100 km** | Realistic cycling range |
| **E-bike** | 0 km | **60 km** | Battery capacity |
| **Bus (city)** | 0 km | **2500 km** | Urban network limits |
| **Train (city)** | 0 km | **1500 km** | Metro operational range |
| **Plane (domestic)** | **250 km** | 2500 km | Minimum viable flight |
| **Plane (international)** | **1000 km** | 2500 km | International standards |

### **Speed Validation**
- **Walking**: ≤ 6 km/h (human pace)
- **Bike**: ≤ 30 km/h (realistic cycling)
- **Bus**: ≤ 80 km/h (urban speed limits)
- **Train**: ≤ 200 km/h (high-speed rail)
- **Plane**: ≥ 400 km/h (minimum takeoff speed)

---

## 📚 **Emission Factor Sources**

### **Transport Emission Factors (gCO₂e/pax-km)**
| Mode | Factor | Source | Notes |
|------|--------|--------|-------|
| Car (solo/taxi) | 171 | EPA/ICCT | Baseline comparison |
| Bus (city) | 96 | UITP | Urban transit average |
| Train (city) | 41 | UIC | Metro systems |
| Bike | 0 | Direct measurement | Zero emissions |
| Walking | 0 | Direct measurement | Zero emissions |
| Plane (domestic) | 255 | ICAO | Short-haul average |
| Plane (international) | 195 | ICAO | Long-haul average |

### **Data Quality**
- **Peer-reviewed sources** for accuracy
- **Regular updates** as technology improves
- **Transparent methodology** for verification
- **City-specific factors** available (future)

---

## 🔄 **Scoring Updates**

### **Real-time Calculation**
- **Immediate scoring** upon activity submission
- **Live updates** to user wallet
- **Community impact** tracking

### **Historical Data**
- **Score evolution** over time
- **Performance trends** by mode
- **Seasonal adjustments** (future)

---

## 📈 **Scaling & Economics**

### **Coin Distribution**
- **Configurable supply** with `COIN_PER_BAND`
- **Inflation control** through activity caps
- **Market dynamics** based on demand

### **Partner Integration**
- **Local business** partnerships
- **Reward catalog** management
- **Redemption tracking**

---

## 🎯 **For Judges & Stakeholders**

### **Transparency**
- **Open-source scoring** algorithms
- **Verifiable calculations** with real data
- **Audit trail** for all transactions

### **Credibility**
- **Academic sources** for emission factors
- **Real-world validation** of thresholds
- **Anti-cheat measures** prevent gaming

### **Scalability**
- **City-wide deployment** ready
- **Multi-modal transport** support
- **Extensible architecture** for new activities

---

**📊 This scoring system provides a fair, transparent, and scientifically-grounded approach to rewarding sustainable behavior while maintaining system integrity.**

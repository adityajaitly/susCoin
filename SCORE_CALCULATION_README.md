# 🚇 susCoin Transport Score Calculation

## Overview

The Transport Score Calculation feature allows users to calculate their carbon credits based on transport choices and distance traveled. This system integrates with the `transport_scores_0to2500km_step5.csv` file to provide accurate scoring based on real transport data.

## Features

### 🧮 Score Calculator
- **Transport Mode Selection**: Choose from 17 different transport modes including walking, cycling, public transport, cars, and planes
- **Distance Input**: Enter any positive distance with 0.1 km precision (distances beyond 2500 km are automatically capped)
- **Real-time Calculation**: Get instant results with detailed breakdowns
- **CSV Integration**: Uses actual transport score data from the uploaded CSV file
- **Smart Distance Handling**: Automatically caps distances at 2500 km where scores remain constant

### 📊 Results Display
- **Transport Score**: The calculated score based on mode and distance
- **Credits Earned**: susCoins earned for the journey
- **CO2 Saved**: Environmental impact in kilograms
- **Calculation Details**: Complete breakdown of the calculation
- **Data Source**: Shows which CSV entry was used for the calculation
- **Distance Capping Notice**: Alerts when distances beyond 2500 km are automatically capped

### 🔗 API Endpoints

#### Calculate Transport Score
```
POST /api/calculate-transport-score
Content-Type: application/json

{
  "transportMode": "walking",
  "distance": 10
}
```

**Response:**
```json
{
  "success": true,
  "transportMode": "walking",
  "distance": 10,
  "originalDistance": 10,
  "score": "2.94",
  "credits": 3,
  "co2Saved": "1.47",
  "message": "Score calculated successfully",
  "dataSource": "CSV data for 10 km",
  "distanceCapped": false
}
```

#### Get Transport Information
```
GET /api/transport-info
```

**Response:**
```json
{
  "success": true,
  "transportModes": ["walking", "bike", "e-bike", ...],
  "distanceRange": {
    "min": 0,
    "max": 2500,
    "step": 5
  },
  "totalEntries": 501,
  "message": "Transport info retrieved successfully"
}
```

## Transport Modes Available

### 🌱 High Score (8-10)
- **Walking** (0-25km): Best for short trips
- **Cycling** (0-55km): Excellent for medium distances
- **E-Bike** (0-55km): Electric-assisted cycling
- **E-Scooter** (0-25km): Electric scooter rides

### 🟡 Medium Score (5-8)
- **City Bus**: Urban public transport
- **Tram/Light Rail**: Local rail transport
- **Metro/Urban Rail**: Underground/subway systems
- **Carpool (3+)**: Shared car journeys
- **Ferry**: Water transport

### 🔴 Low Score (1-5)
- **Car (Solo/Taxi)**: Single-occupant vehicles
- **Plane (Domestic)**: Short-haul flights
- **Plane (International)**: Long-haul flights

## How It Works

1. **CSV Data Loading**: On server startup, the system loads transport scores from `transport_scores_0to2500km_step5.csv`
2. **Distance Matching**: When calculating scores, the system finds the closest distance match in the CSV data
3. **Score Retrieval**: Retrieves the appropriate score for the selected transport mode and distance
4. **Credit Calculation**: Converts the score to susCoins using the formula: `score × distance × 0.1`
5. **CO2 Calculation**: Estimates CO2 savings using: `score × distance × 0.05`

## Error Handling & Smart Features

### 🚫 Invalid Transport Mode & Distance Combinations
When a transport mode cannot cover a given distance (score = 0 in CSV), the system returns a clear error message:
```json
{
  "success": false,
  "message": "walking is not viable for 100 km. This transport mode cannot cover such a distance.",
  "transportMode": "walking",
  "distance": 100,
  "score": 0,
  "credits": 0,
  "co2Saved": 0
}
```

### 📏 Distance Capping
For distances beyond 2500 km, the system automatically caps the calculation at 2500 km since transport scores remain constant beyond this point:

**Input:** 3000 km → **Effective calculation:** 2500 km
```json
{
  "success": true,
  "distance": 2500,
  "originalDistance": 3000,
  "message": "Score calculated for 2500 km (maximum distance). Scores remain the same for distances beyond 2500 km.",
  "distanceCapped": true
}
```

## Distance Ranges

- **0-25 km**: Optimal for walking and cycling
- **25-55 km**: Good for e-bikes and public transport
- **55-2500 km**: Suitable for buses, trains, and other long-distance options
- **250+ km**: Plane travel becomes available for international routes

## Integration with Opal Card

The system is designed to integrate with Opal card data for automatic score calculation:

### 🚀 Future Features
- **Automatic Journey Detection**: Read travel data from Opal cards
- **Real-time Scoring**: Calculate scores as journeys happen
- **Journey History**: Track all transport activities
- **Monthly Summaries**: Generate impact reports
- **Wallet Integration**: Automatically add credits to user accounts

### 📱 How It Will Work
1. User links their Opal card to susCoin
2. App reads travel data automatically
3. Scores calculated in real-time
4. Credits added to user wallet
5. Environmental impact tracked over time

## Technical Implementation

### Backend
- **CSV Parser**: Uses `csv-parser` package to read transport data
- **Data Storage**: Loads CSV data into memory for fast access
- **API Endpoints**: RESTful endpoints for score calculation and data retrieval
- **Error Handling**: Comprehensive validation and error responses

### Frontend
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: WebSocket integration for live data
- **Form Validation**: Client-side validation for user inputs
- **Loading States**: Visual feedback during calculations

### Data Flow
1. User selects transport mode and enters distance
2. Frontend sends POST request to `/api/calculate-transport-score`
3. Backend finds closest distance match in CSV data
4. Score retrieved and calculations performed
5. Results returned to frontend for display

## File Structure

```
susCoin/
├── transport_scores_0to2500km_step5.csv    # Transport score data
├── views/
│   └── score-calculation.ejs               # Score calculation page
├── server.js                               # Backend API endpoints
└── SCORE_CALCULATION_README.md            # This documentation
```

## Getting Started

1. **Install Dependencies**: `npm install csv-parser`
2. **Start Server**: `npm start`
3. **Access Page**: Navigate to `/score-calculation`
4. **Test API**: Use the provided endpoints for integration

## Usage Examples

### Calculate Walking Score
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"transportMode":"walking","distance":5}' \
  http://localhost:3000/api/calculate-transport-score
```

### Calculate Bike Score
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"transportMode":"bike","distance":20}' \
  http://localhost:3000/api/calculate-transport-score
```

### Test Distance Capping (Beyond 2500 km)
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"transportMode":"bus (city)","distance":3000}' \
  http://localhost:3000/api/calculate-transport-score
```

### Test Invalid Transport Mode & Distance
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"transportMode":"walking","distance":100}' \
  http://localhost:3000/api/calculate-transport-score
```

### Get Available Transport Modes
```bash
curl http://localhost:3000/api/transport-info
```

## Future Enhancements

- **Machine Learning**: Predict scores for distances not in CSV
- **Real-time Updates**: Live score updates based on current conditions
- **User Preferences**: Personalized scoring based on user behavior
- **Social Features**: Share scores and compare with friends
- **Gamification**: Achievements and badges for sustainable transport

## Support

For questions or issues with the Transport Score Calculation feature, please refer to the main susCoin documentation or contact the development team.

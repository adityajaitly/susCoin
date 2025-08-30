// scoring.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// approximate gCO2e per pax-km (update with your sources in docs)
const factors_g_per_km = {
  'car (solo/taxi)': 171,
  'rideshare pooled': 120,
  'bus (city)': 96,
  'bus (coach)': 27,
  'train (city)': 41,
  'train (intercity)': 29,
  'tram/metro': 28,
  'ferry': 115,
  'bike': 0, 'walking': 0,
  'e-bike': 5, 'e-scooter': 10,
  'plane (domestic)': 255,
  'plane (intl)': 195
};

// baseline to compare against:
const BASELINE_MODE = 'car (solo/taxi)';

// load table once
const table = [];
const csvPath = path.join(__dirname, 'transport_scores_0to2500km_step5.csv');

function loadTable(){
  return new Promise((resolve, reject)=>{
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', row => table.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
}

// distance → nearest 5km band, capped to 2500
function band(distanceKm){
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  const capped = Math.min(distanceKm, 2500);
  return Math.round(capped / 5) * 5;
}

const COIN_PER_BAND = 1; // tweakable economy knob

function scoreTransport({ mode, distanceKm }){
  // thresholds that match your brief
  if (['plane (domestic)','plane (intl)'].includes(mode) && distanceKm < 250) return { score:0, coins:0, co2eSavedKg:0, distanceKm };
  if (mode === 'walking' && distanceKm > 25) return { score:0, coins:0, co2eSavedKg:0, distanceKm:25 };
  if (['metro/urban rail', 'intercity rail'].includes(mode) && distanceKm > 1500) distanceKm = 1500;

  const b = band(distanceKm);
  const row = table.find(r => Number(r.distance_km) === b);
  if (!row) return { score: 0, coins: 0, co2eSavedKg: 0, distanceKm: b };

  const score = Number(row[mode]) || 0;              // 0–10 relative score
  const bands = b / 5;
  const coins = Math.round(score * bands * COIN_PER_BAND);

  const fMode = factors_g_per_km[mode] ?? factors_g_per_km['bike'];
  const fBaseline = factors_g_per_km[BASELINE_MODE];
  const saved_g = Math.max((fBaseline - fMode), 0) * b;
  const co2eSavedKg = Math.round((saved_g/1000) * 100) / 100;

  return { score, coins, co2eSavedKg, distanceKm: b };
}

module.exports = { loadTable, scoreTransport, factors_g_per_km, BASELINE_MODE };

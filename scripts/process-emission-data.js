const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../ageis-state-territory-inventories-2020-emission-data-tables.xlsx'));

// Australian state/territory coordinates and mapping
const stateMapping = {
    'NSW': { name: 'New South Wales', lat: -33.8688, lng: 151.2093 },
    'QLD': { name: 'Queensland', lat: -27.4698, lng: 153.0251 },
    'VIC': { name: 'Victoria', lat: -37.8136, lng: 144.9631 },
    'WA': { name: 'Western Australia', lat: -31.9505, lng: 115.8605 },
    'SA': { name: 'South Australia', lat: -34.9285, lng: 138.6007 },
    'NT': { name: 'Northern Territory', lat: -12.4634, lng: 130.8456 },
    'TAS': { name: 'Tasmania', lat: -42.8821, lng: 147.3272 },
    'ACT': { name: 'Australian Capital Territory', lat: -35.2809, lng: 149.1300 }
};

const processedData = [];

// Process each state/territory sheet
Object.keys(stateMapping).forEach(stateCode => {
    if (workbook.SheetNames.includes(stateCode)) {
        const worksheet = workbook.Sheets[stateCode];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find the total emissions row (row 8 contains "Total (net emissions)")
        let totalEmissions = 0;
        
        // Based on the debug output, 2020 is in column 30 (index 30)
        const year2020Index = 30;
        
        // Find total emissions for 2020
        if (data.length > 8) {
            const totalRow = data[8];
            if (totalRow && totalRow[0] === 'Total (net emissions)' && totalRow[year2020Index]) {
                totalEmissions = parseFloat(totalRow[year2020Index]) || 0;
            }
        }
        
        if (totalEmissions > 0) {
            const stateInfo = stateMapping[stateCode];
            const intensity = Math.min(totalEmissions / 200000, 1); // Normalize to 0-1 scale
            
            processedData.push({
                state: stateInfo.name,
                stateCode: stateCode,
                emissions: totalEmissions,
                year: 2020,
                lat: stateInfo.lat,
                lng: stateInfo.lng,
                intensity: intensity,
                emissionsFormatted: `${(totalEmissions / 1000).toFixed(1)} Mt CO2-e`
            });
        }
    }
});

console.log('Processed emission data:');
processedData.forEach(item => {
    console.log(`${item.state}: ${item.emissionsFormatted} (intensity: ${item.intensity.toFixed(3)})`);
});

// Save processed data
const outputPath = path.join(__dirname, '../public/data/emission-heatmap.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));

console.log(`\nProcessed ${processedData.length} data points`);
console.log(`Data saved to: ${outputPath}`);

// Also create a heatmap data format for Leaflet
const heatmapData = processedData.map(item => [
    item.lat,
    item.lng,
    item.intensity
]);

const heatmapOutputPath = path.join(__dirname, '../public/data/heatmap-points.json');
fs.writeFileSync(heatmapOutputPath, JSON.stringify(heatmapData, null, 2));

console.log(`Heatmap points saved to: ${heatmapOutputPath}`);

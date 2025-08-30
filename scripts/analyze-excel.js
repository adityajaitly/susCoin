const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../ageis-state-territory-inventories-2020-emission-data-tables.xlsx'));

console.log('Available sheets:', workbook.SheetNames);

// Analyze each sheet
workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n=== Sheet ${index + 1}: ${sheetName} ===`);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`Total rows: ${data.length}`);
    
    // Show first 10 rows
    console.log('First 10 rows:');
    data.slice(0, 10).forEach((row, i) => {
        console.log(`Row ${i}:`, row);
    });
    
    // Show column headers if they exist
    if (data.length > 0) {
        console.log('\nColumn headers (first row):', data[0]);
    }
});

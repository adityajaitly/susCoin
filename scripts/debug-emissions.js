const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../ageis-state-territory-inventories-2020-emission-data-tables.xlsx'));

console.log('Available sheets:', workbook.SheetNames);

// Focus on NSW sheet for debugging
const nswSheet = workbook.Sheets['NSW'];
const nswData = XLSX.utils.sheet_to_json(nswSheet, { header: 1 });

console.log('\n=== NSW Sheet Analysis ===');
console.log(`Total rows: ${nswData.length}`);

// Show rows around the expected data
console.log('\nRow 6 (headers):', nswData[6]);
console.log('Row 7:', nswData[7]);
console.log('Row 8 (total emissions):', nswData[8]);
console.log('Row 9:', nswData[9]);

// Find the 2020 column
if (nswData.length > 6) {
    const headerRow = nswData[6];
    const year2020Index = headerRow.findIndex(cell => cell === 2020);
    console.log(`\n2020 column index: ${year2020Index}`);
    
    if (year2020Index > 0) {
        console.log(`2020 column value: ${nswData[8][year2020Index]}`);
        console.log(`Type: ${typeof nswData[8][year2020Index]}`);
    }
}

// Check all numeric values in row 8
if (nswData.length > 8) {
    const totalRow = nswData[8];
    console.log('\nAll numeric values in total row:');
    totalRow.forEach((cell, index) => {
        if (typeof cell === 'number' && !isNaN(cell)) {
            console.log(`Column ${index}: ${cell}`);
        }
    });
}

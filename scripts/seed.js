// scripts/seed.js
const { db } = require('../db');
const { nanoid } = require('nanoid');

db.serialize(()=>{
  console.log('🗑️ Clearing existing data...');
  // Delete in correct order to respect foreign key constraints
  db.run(`DELETE FROM redemptions`);
  db.run(`DELETE FROM wallet_ledger`);
  db.run(`DELETE FROM activities`);
  db.run(`DELETE FROM partners`);
  db.run(`DELETE FROM users`);

  console.log('👤 Creating demo user...');
  db.run(`INSERT INTO users(id,name,email) VALUES('u_demo','Demo User','demo@suscoin.app')`);

  console.log('🏪 Creating partner...');
  const partnerId = 'p_greenbite';
  const catalog = [
    { id:'sandwich', title:'GreenBite Sandwich', price_coins: 40 },
    { id:'coffee',   title:'Organic Coffee',     price_coins: 15 },
    { id:'fuel5',    title:'$5 fuel credit',     price_coins: 60 }
  ];
  
  db.run(`INSERT INTO partners(id,name,catalog_json) VALUES(?,?,?)`,
    [partnerId, 'GreenBite Café', JSON.stringify(catalog)],
    function(err) {
      if (err) {
        console.error('❌ Error inserting partner:', err.message);
      } else {
        console.log('✅ Partner created with ID:', this.lastID);
        
        // Verify the data was inserted
        db.get(`SELECT * FROM partners WHERE id = ?`, [partnerId], (err, row) => {
          if (err) {
            console.error('❌ Error verifying partner:', err.message);
          } else if (row) {
            console.log('✅ Partner verified:', row.name);
            console.log('✅ seed complete');
            process.exit(0);
          } else {
            console.error('❌ Partner not found after insertion');
            process.exit(1);
          }
        });
      }
    }
  );
});

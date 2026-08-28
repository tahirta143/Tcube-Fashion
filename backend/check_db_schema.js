const { initializeDatabase, query } = require('./src/config/db');

async function verify() {
  try {
    await initializeDatabase();
    const [columns] = await query('SHOW COLUMNS FROM orders');
    console.log('\n--- VERIFYING ORDERS TABLE COLUMNS ---');
    columns.forEach(col => {
      console.log(`Column: ${col.Field} | Type: ${col.Type}`);
    });
    console.log('-------------------------------------\n');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();

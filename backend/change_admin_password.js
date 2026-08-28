const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  const newPassword = process.argv[2];
  if (!newPassword) {
    console.error('Usage: node change_admin_password.js <new_password>');
    process.exit(1);
  }

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'tcube_fashions';

  console.log('Connecting to database...');
  const connection = await mysql.createConnection({ host, user, password, database });

  console.log('Hashing new password with bcrypt...');
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  console.log('Updating admin password in "users" table...');
  const [result] = await connection.query(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'admin@tcube.com']
  );

  if (result.affectedRows === 0) {
    console.log('Admin user not found. Seeding a new Admin user account...');
    await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['TCUBE Admin', 'admin@tcube.com', hashedPassword, 'admin']
    );
    console.log('Admin user seeded successfully with email "admin@tcube.com" and your new password.');
  } else {
    console.log('Admin password successfully updated in the database!');
  }

  await connection.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Error changing admin password:', err);
  process.exit(1);
});

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let pool;

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
  const database = process.env.DB_NAME || 'tcube_fashions';

  let lastError;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      // Create temporary connection to ensure DB exists
      const tempConn = await mysql.createConnection({ host, port, user, password });

      // --- Corruption Recovery ---
      // errno 1932 means InnoDB tablespace files are missing/corrupt.
      // We cannot DROP DATABASE because MySQL may fail with errno 41 ("Directory not empty")
      // when orphaned .ibd files exist. Instead, drop each table individually
      // after disabling foreign key checks.
      try {
        const probeConn = await mysql.createConnection({ host, port, user, password, database });
        await probeConn.query('SELECT 1 FROM categories LIMIT 1');
        await probeConn.end();
      } catch (probeErr) {
        if (probeErr.errno === 1932) {
          console.warn('⚠️  InnoDB tablespace corruption detected (errno 1932). Dropping all tables to rebuild...');
          const repairConn = await mysql.createConnection({ host, port, user, password, database });
          try {
            await repairConn.query('SET FOREIGN_KEY_CHECKS = 0;');
            // Drop in reverse dependency order
            const tablesToDrop = [
              'reviews', 'order_items', 'orders', 'coupons',
              'banners', 'products', 'categories', 'users'
            ];
            for (const tbl of tablesToDrop) {
              await repairConn.query(`DROP TABLE IF EXISTS \`${tbl}\`;`);
            }
            await repairConn.query('SET FOREIGN_KEY_CHECKS = 1;');
            console.warn('✅  All tables dropped. They will be recreated fresh by migrations.');
          } finally {
            await repairConn.end();
          }
        }
      }

      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      await tempConn.end();

      // Create connection pool with DB selected
      pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Run migrations
      await runMigrations();
      return;
    } catch (error) {
      lastError = error;
      console.warn(`Database connection attempt ${attempt}/10 failed: ${error.message}`);
      if (attempt < 10) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  throw lastError;
}

async function runMigrations() {
  try {
    // 1. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        phone VARCHAR(50) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2. Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        discount_price DECIMAL(10, 2) DEFAULT NULL,
        category VARCHAR(100) NOT NULL,
        sizes VARCHAR(255),
        colors VARCHAR(255),
        images TEXT,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 3. Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_name VARCHAR(255) NOT NULL,
        shipping_email VARCHAR(255) NOT NULL,
        shipping_address TEXT NOT NULL,
        shipping_city VARCHAR(100) NOT NULL,
        shipping_postal_code VARCHAR(20) NOT NULL,
        shipping_phone VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        transaction_id VARCHAR(100) DEFAULT NULL,
        sender_account VARCHAR(100) DEFAULT NULL,
        order_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 4. Order Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        size VARCHAR(50) DEFAULT NULL,
        color VARCHAR(50) DEFAULT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 5. Categories Table
    // NOTE: Self-referencing FK (parent_id) is added via ALTER below.
    // Defining it inline on CREATE can trigger InnoDB circular-ref issues on some MySQL versions.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        parent_id INT DEFAULT NULL,
        banner_url TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Add self-referencing FK on categories safely (only if not already present)
    const [catFkRows] = await pool.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'categories'
        AND REFERENCED_TABLE_NAME = 'categories'
      LIMIT 1;
    `);
    if (catFkRows.length === 0) {
      await pool.query(`
        ALTER TABLE categories
        ADD CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
      `);
    }

    // Seed default categories
    const defaultCategories = [
      { name: 'Women', slug: 'women', banner_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop' },
      { name: 'Men', slug: 'men', banner_url: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=600&auto=format&fit=crop' },
      { name: 'Kids', slug: 'kids', banner_url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=600&auto=format&fit=crop' },
      { name: 'Accessories', slug: 'accessories', banner_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop' },
      { name: 'Shoes', slug: 'shoes', banner_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop' }
    ];
    for (const cat of defaultCategories) {
      const [existingCat] = await pool.query('SELECT * FROM categories WHERE slug = ?', [cat.slug]);
      if (existingCat.length === 0) {
        await pool.query('INSERT INTO categories (name, slug, banner_url) VALUES (?, ?, ?)', [cat.name, cat.slug, cat.banner_url]);
      } else if (!existingCat[0].banner_url) {
        await pool.query('UPDATE categories SET banner_url = ? WHERE id = ?', [cat.banner_url, existingCat[0].id]);
      }
    }

    // 6. Coupons Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        discount_type VARCHAR(50) NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        expiry_date DATETIME NOT NULL,
        usage_limit INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 7. Banners Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) DEFAULT NULL,
        subtitle VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        image_url TEXT NOT NULL,
        link_url VARCHAR(255) DEFAULT NULL,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 8. Reviews Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Safe Alter: Add category_id to products
    const [prodCategoryCol] = await pool.query("SHOW COLUMNS FROM products LIKE 'category_id'");
    if (prodCategoryCol.length === 0) {
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN category_id INT DEFAULT NULL,
        ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      `);
    }

    // Safe Alter: Add video_url to products
    const [prodVideoCol] = await pool.query("SHOW COLUMNS FROM products LIKE 'video_url'");
    if (prodVideoCol.length === 0) {
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN video_url VARCHAR(255) DEFAULT NULL
      `);
    }

    // Safe Alter: Add coupon and tracking details to orders
    const [couponCol] = await pool.query("SHOW COLUMNS FROM orders LIKE 'coupon_code'");
    if (couponCol.length === 0) {
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN coupon_code VARCHAR(100) DEFAULT NULL,
        ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00
      `);
    }
    const [trackingCol] = await pool.query("SHOW COLUMNS FROM orders LIKE 'tracking_number'");
    if (trackingCol.length === 0) {
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN tracking_number VARCHAR(255) DEFAULT NULL
      `);
    }

    // Safe Alter: Add payment gateway details to orders
    const [intentCol] = await pool.query("SHOW COLUMNS FROM orders LIKE 'payment_intent_id'");
    if (intentCol.length === 0) {
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN payment_intent_id VARCHAR(255) DEFAULT NULL,
        ADD COLUMN payment_gateway VARCHAR(100) DEFAULT NULL,
        ADD COLUMN gateway_response TEXT DEFAULT NULL
      `);
    }

    // Safe Alter: Add description to banners
    const [bannerDescCol] = await pool.query("SHOW COLUMNS FROM banners LIKE 'description'");
    if (bannerDescCol.length === 0) {
      await pool.query(`
        ALTER TABLE banners 
        ADD COLUMN description TEXT DEFAULT NULL
      `);
    }

    // Safe Alter: Add video_url to banners
    const [bannerVideoCol] = await pool.query("SHOW COLUMNS FROM banners LIKE 'video_url'");
    if (bannerVideoCol.length === 0) {
      await pool.query(`
        ALTER TABLE banners 
        ADD COLUMN video_url TEXT DEFAULT NULL
      `);
      console.log('Successfully added video_url column to banners table');
    }

    // Safe Alter: Make image_url nullable in banners
    try {
      await pool.query(`
        ALTER TABLE banners MODIFY COLUMN image_url TEXT DEFAULT NULL
      `);
    } catch (err) {
      console.warn('Could not alter image_url in banners table:', err.message);
    }

    // Seed default editorial banner
    const [existingEditorial] = await pool.query("SELECT * FROM banners WHERE type = 'editorial'");
    if (existingEditorial.length === 0) {
      await pool.query(`
        INSERT INTO banners (title, subtitle, description, image_url, link_url, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'The Art of Small-Batch Tailoring',
        'The Heritage',
        'Our capsule garments are created in limited quantities to focus on pristine stitch densities and reduce material excess. Each linen jacket and organic cotton set represents hours of meticulous work, utilizing exclusively natural flax and organic cotton crops sourced from ethical fields.',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop',
        '/shop',
        'editorial'
      ]);
      console.log('Default editorial story banner seeded.');
    }

    // Seed default Admin user if not exists
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@tcube.com']);
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['TCUBE Admin', 'admin@tcube.com', hashedPassword, 'admin']
      );
      console.log('Admin user seeded (admin@tcube.com / adminpassword)');
    }

    // Database migration completed successfully.

    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}

const query = async (sql, params) => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return pool.query(sql, params);
};

module.exports = {
  initializeDatabase,
  query,
  getPool: () => pool
};

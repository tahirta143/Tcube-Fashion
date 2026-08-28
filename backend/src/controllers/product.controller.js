const db = require('../config/db');

// Get all products with filtering, search, and sorting
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, size, color, search, sort } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Filter by Category
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category.toLowerCase());
    }

    // Filter by Price Range
    if (minPrice) {
      sql += ' AND (CASE WHEN discount_price IS NOT NULL THEN discount_price ELSE price END) >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      sql += ' AND (CASE WHEN discount_price IS NOT NULL THEN discount_price ELSE price END) <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Filter by Size (using LIKE since sizes are CSV strings)
    if (size) {
      sql += ' AND sizes LIKE ?';
      params.push(`%${size}%`);
    }

    // Filter by Color (using LIKE since colors are CSV strings)
    if (color) {
      sql += ' AND colors LIKE ?';
      params.push(`%${color}%`);
    }

    // Search query
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    // Sorting
    if (sort) {
      if (sort === 'price-asc') {
        sql += ' ORDER BY (CASE WHEN discount_price IS NOT NULL THEN discount_price ELSE price END) ASC';
      } else if (sort === 'price-desc') {
        sql += ' ORDER BY (CASE WHEN discount_price IS NOT NULL THEN discount_price ELSE price END) DESC';
      } else if (sort === 'newest') {
        sql += ' ORDER BY created_at DESC';
      } else {
        sql += ' ORDER BY id DESC'; // Default popular/featured
      }
    } else {
      sql += ' ORDER BY id DESC';
    }

    const [products] = await db.query(sql, params);
    res.status(200).json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product details by ID
const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(products[0]);
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create product (Admin only)
const createProduct = async (req, res) => {
  const { name, description, price, discount_price, category, sizes, colors, images, video_url, stock } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ message: 'Name, price and category are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO products (name, description, price, discount_price, category, sizes, colors, images, video_url, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || '',
        parseFloat(price),
        discount_price ? parseFloat(discount_price) : null,
        category.toLowerCase(),
        sizes || '',
        colors || '',
        images || '/images/placeholder.jpg',
        video_url || null,
        stock ? parseInt(stock) : 0
      ]
    );

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, discount_price, category, sizes, colors, images, video_url, stock } = req.body;

  try {
    // Check if exists
    const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const current = existing[0];

    await db.query(
      `UPDATE products
       SET name = ?, description = ?, price = ?, discount_price = ?, category = ?, sizes = ?, colors = ?, images = ?, video_url = ?, stock = ?
       WHERE id = ?`,
      [
        name || current.name,
        description !== undefined ? description : current.description,
        price !== undefined ? parseFloat(price) : current.price,
        discount_price !== undefined ? (discount_price ? parseFloat(discount_price) : null) : current.discount_price,
        category ? category.toLowerCase() : current.category,
        sizes !== undefined ? sizes : current.sizes,
        colors !== undefined ? colors : current.colors,
        images !== undefined ? images : current.images,
        video_url !== undefined ? video_url : current.video_url,
        stock !== undefined ? parseInt(stock) : current.stock,
        id
      ]
    );

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk create products (Admin only)
const bulkCreateProducts = async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'Products array is required and must not be empty' });
  }

  const connection = await db.getPool().getConnection();
  try {
    await connection.beginTransaction();

    for (const prod of products) {
      const { name, description, price, discount_price, category, sizes, colors, images, stock } = prod;
      if (!name || !price || !category) {
        throw new Error('Name, price and category are required for all products');
      }

      await connection.query(
        `INSERT INTO products (name, description, price, discount_price, category, sizes, colors, images, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description || '',
          parseFloat(price),
          discount_price ? parseFloat(discount_price) : null,
          category.toLowerCase(),
          sizes || '',
          colors || '',
          images || '/images/placeholder.jpg',
          stock ? parseInt(stock) : 0
        ]
      );
    }

    await connection.commit();
    connection.release();
    res.status(201).json({ message: `${products.length} products uploaded successfully` });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Bulk upload products error:', error);
    res.status(400).json({ message: error.message || 'Server error during bulk upload' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts
};

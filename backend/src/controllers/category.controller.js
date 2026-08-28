const db = require('../config/db');

// Get all categories (with subcategories nested or flat)
const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create category (Admin only)
const createCategory = async (req, res) => {
  const { name, slug, parent_id, banner_url } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ message: 'Name and slug are required' });
  }

  try {
    // Check if category name/slug already exists
    const [existing] = await db.query('SELECT * FROM categories WHERE slug = ? OR name = ?', [slug, name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category name or slug already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO categories (name, slug, parent_id, banner_url) VALUES (?, ?, ?, ?)',
      [name, slug.toLowerCase(), parent_id || null, banner_url || null]
    );

    res.status(201).json({
      message: 'Category created successfully',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update category (Admin only)
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, parent_id, banner_url } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const current = existing[0];
    const newName = name || current.name;
    const newSlug = slug ? slug.toLowerCase() : current.slug;
    const newParentId = parent_id !== undefined ? parent_id : current.parent_id;
    const newBannerUrl = banner_url !== undefined ? banner_url : current.banner_url;

    // Check slug clash if changed
    if (newSlug !== current.slug) {
      const [clash] = await db.query('SELECT * FROM categories WHERE slug = ?', [newSlug]);
      if (clash.length > 0) {
        return res.status(400).json({ message: 'Category slug already exists' });
      }
    }

    await db.query(
      'UPDATE categories SET name = ?, slug = ?, parent_id = ?, banner_url = ? WHERE id = ?',
      [newName, newSlug, newParentId || null, newBannerUrl || null, id]
    );

    res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete category (Admin only)
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};

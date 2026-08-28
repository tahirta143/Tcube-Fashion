const db = require('../config/db');

// Get all approved reviews for a product (Public)
const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? AND r.status = 'approved' 
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a review (Protected User)
const createReview = async (req, res) => {
  const { product_id, rating, comment } = req.body;

  if (!product_id || !rating) {
    return res.status(400).json({ message: 'Product ID and rating are required' });
  }

  const numericRating = parseInt(rating);
  if (numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if user already reviewed this product
    const [existing] = await db.query(
      'SELECT * FROM reviews WHERE product_id = ? AND user_id = ?',
      [product_id, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const [result] = await db.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment, status) VALUES (?, ?, ?, ?, ?)',
      [product_id, req.user.id, numericRating, comment || '', 'pending'] // Default status is pending
    );

    res.status(201).json({
      message: 'Review submitted. It will appear once approved by an administrator.',
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all pending reviews (Admin only)
const getPendingReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email, p.name as product_name, p.images as product_images
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       JOIN products p ON r.product_id = p.id
       WHERE r.status = 'pending' 
       ORDER BY r.created_at DESC`
    );
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve a review (Admin only)
const approveReview = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await db.query("UPDATE reviews SET status = 'approved' WHERE id = ?", [id]);
    res.status(200).json({ message: 'Review approved successfully' });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete/Reject a review (Admin only)
const deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  getPendingReviews,
  approveReview,
  deleteReview
};

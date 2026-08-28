const db = require('../config/db');

// List all coupons (Admin only)
const getCoupons = async (req, res) => {
  try {
    const [coupons] = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.status(200).json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a coupon (Admin only)
const createCoupon = async (req, res) => {
  const { code, discount_type, discount_value, expiry_date, usage_limit } = req.body;

  if (!code || !discount_type || discount_value === undefined || !expiry_date) {
    return res.status(400).json({ message: 'Code, discount type, value, and expiry date are required' });
  }

  try {
    const uppercaseCode = code.toUpperCase().trim();

    // Check if code exists
    const [existing] = await db.query('SELECT * FROM coupons WHERE code = ?', [uppercaseCode]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO coupons (code, discount_type, discount_value, expiry_date, usage_limit) VALUES (?, ?, ?, ?, ?)',
      [uppercaseCode, discount_type, parseFloat(discount_value), expiry_date, usage_limit ? parseInt(usage_limit) : null]
    );

    res.status(201).json({
      message: 'Coupon created successfully',
      couponId: result.insertId
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a coupon (Admin only)
const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, discount_type, discount_value, expiry_date, usage_limit } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const current = existing[0];
    const newCode = code ? code.toUpperCase().trim() : current.code;
    const newDiscountType = discount_type || current.discount_type;
    const newDiscountValue = discount_value !== undefined ? parseFloat(discount_value) : current.discount_value;
    const newExpiryDate = expiry_date || current.expiry_date;
    const newUsageLimit = usage_limit !== undefined ? (usage_limit ? parseInt(usage_limit) : null) : current.usage_limit;

    if (newCode !== current.code) {
      const [clash] = await db.query('SELECT * FROM coupons WHERE code = ?', [newCode]);
      if (clash.length > 0) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
    }

    await db.query(
      'UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, expiry_date = ?, usage_limit = ? WHERE id = ?',
      [newCode, newDiscountType, newDiscountValue, newExpiryDate, newUsageLimit, id]
    );

    res.status(200).json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a coupon (Admin only)
const deleteCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    await db.query('DELETE FROM coupons WHERE id = ?', [id]);
    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate a coupon (Public)
const validateCoupon = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Coupon code is required' });
  }

  try {
    const uppercaseCode = code.toUpperCase().trim();
    const [coupons] = await db.query('SELECT * FROM coupons WHERE code = ?', [uppercaseCode]);

    if (coupons.length === 0) {
      return res.status(404).json({ message: 'Coupon code not found or invalid' });
    }

    const coupon = coupons[0];

    // Check expiry
    const expiry = new Date(coupon.expiry_date);
    const now = new Date();
    if (expiry < now) {
      return res.status(400).json({ message: 'Coupon code has expired' });
    }

    // Check usage limits
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'Coupon code usage limit has been reached' });
    }

    res.status(200).json({
      message: 'Coupon code validated successfully',
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value)
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};

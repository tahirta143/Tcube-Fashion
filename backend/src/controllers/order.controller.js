const db = require('../config/db');

// Place a new order
const createOrder = async (req, res) => {
  const {
    items,
    totalAmount,
    shippingName,
    shippingEmail,
    shippingAddress,
    shippingCity,
    shippingPostalCode,
    shippingPhone,
    paymentMethod,
    transactionId,
    senderAccount,
    couponCode
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in order' });
  }

  const connection = await db.getPool().getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // 1. Check stock for all products
    for (const item of items) {
      const [products] = await connection.query('SELECT stock, name FROM products WHERE id = ? FOR UPDATE', [item.productId]);
      if (products.length === 0) {
        throw new Error(`Product not found: ID ${item.productId}`);
      }
      const product = products[0];
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Ordered: ${item.quantity}`);
      }
    }

    // 2. Validate Coupon and calculate discount (if provided)
    let couponDiscount = 0;
    let validCouponCode = null;
    if (couponCode) {
      const [coupons] = await connection.query('SELECT * FROM coupons WHERE code = ?', [couponCode.toUpperCase().trim()]);
      if (coupons.length > 0) {
        const coupon = coupons[0];
        const expiry = new Date(coupon.expiry_date);
        const now = new Date();
        const usageOk = coupon.usage_limit === null || coupon.used_count < coupon.usage_limit;
        if (expiry >= now && usageOk) {
          validCouponCode = coupon.code;
          if (coupon.discount_type === 'percentage') {
            const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
            couponDiscount = subtotal * (parseFloat(coupon.discount_value) / 100);
          } else {
            couponDiscount = parseFloat(coupon.discount_value);
          }
          // Increment coupon used count
          await connection.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
        }
      }
    }

    // 3. Insert order
    const paymentStatus = paymentMethod === 'stripe' ? 'paid' : 'pending'; // Stripe mock is paid instantly
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, shipping_name, shipping_email, shipping_address, shipping_city, shipping_postal_code, shipping_phone, payment_method, payment_status, transaction_id, sender_account, order_status, coupon_code, discount_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        req.user.id,
        totalAmount,
        shippingName,
        shippingEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingPhone,
        paymentMethod,
        paymentStatus,
        transactionId || null,
        senderAccount || null,
        validCouponCode,
        couponDiscount
      ]
    );

    const orderId = orderResult.insertId;

    // 4. Insert order items & update product stock
    for (const item of items) {
      // Insert item
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.price, item.size || null, item.color || null]
      );

      // Reduce product stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: orderId
    });
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    connection.release();

    console.error('Create order error:', error);
    res.status(400).json({ message: error.message || 'Failed to place order' });
  }
};

// Get current user's orders
const getMyOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single order details
const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Access control: User must be owner or admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    // Get order items with product details
    const [items] = await db.query(
      `SELECT oi.*, p.name as product_name, p.images as product_images
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    order.items = items;
    res.status(200).json(order);
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order delivery/payment status (Admin only)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus, trackingNumber } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const current = existing[0];
    const newOrderStatus = orderStatus || current.order_status;
    const newPaymentStatus = paymentStatus || current.payment_status;
    const newTrackingNumber = trackingNumber !== undefined ? trackingNumber : current.tracking_number;

    // If order is changed to cancelled, restore the stock
    if (orderStatus === 'cancelled' && current.order_status !== 'cancelled') {
      const [items] = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        await db.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    await db.query(
      'UPDATE orders SET order_status = ?, payment_status = ?, tracking_number = ? WHERE id = ?',
      [newOrderStatus, newPaymentStatus, newTrackingNumber, id]
    );

    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel an order (User or Admin)
const cancelOrder = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getPool().getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch order
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (orders.length === 0) {
      throw new Error('Order not found');
    }
    const order = orders[0];

    // 2. Access control: User must be owner or admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // 3. Status check: Only pending orders can be cancelled (Admins can cancel anything except already cancelled)
    if (order.order_status === 'cancelled') {
      throw new Error('Order is already cancelled');
    }
    if (order.order_status !== 'pending' && req.user.role !== 'admin') {
      throw new Error('Only pending orders can be cancelled');
    }

    // 4. Return stock
    const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 5. Update order status to 'cancelled'
    await connection.query(
      "UPDATE orders SET order_status = 'cancelled', payment_status = ? WHERE id = ?",
      [order.payment_status === 'paid' ? 'refund_pending' : order.payment_status, id]
    );

    await connection.commit();
    connection.release();

    res.status(200).json({ message: 'Order cancelled successfully and stock returned' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Cancel order error:', error);
    res.status(400).json({ message: error.message || 'Server error' });
  }
};

// Get sales and analytics reports (Admin only)
const getOrderReports = async (req, res) => {
  try {
    // 1. Daily Reports (last 7 days)
    const [daily] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as label, 
        COUNT(id) as order_count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE payment_status = 'paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY label
      ORDER BY label ASC
    `);

    // 2. Weekly Reports (last 4 weeks)
    const [weekly] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%X-W%V') as label, 
        COUNT(id) as order_count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE payment_status = 'paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
      GROUP BY label
      ORDER BY label ASC
    `);

    // 3. Monthly Reports (last 12 months)
    const [monthly] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as label, 
        COUNT(id) as order_count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE payment_status = 'paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY label
      ORDER BY label ASC
    `);

    // 4. Yearly Reports
    const [yearly] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y') as label, 
        COUNT(id) as order_count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE payment_status = 'paid'
      GROUP BY label
      ORDER BY label ASC
    `);

    // 5. Top selling garments
    const [topProducts] = await db.query(`
      SELECT 
        p.id as id,
        p.name as name,
        p.images as images,
        p.category as category,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
      GROUP BY p.id, p.name, p.images, p.category
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.status(200).json({
      daily,
      weekly,
      monthly,
      yearly,
      topProducts
    });
  } catch (error) {
    console.error('Get order reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an order (User can only delete cancelled orders; Admin can delete any order)
const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = existing[0];

    // Access control: User must be owner or admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this order' });
    }

    // Status check: User can only delete cancelled orders
    if (order.order_status !== 'cancelled' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Only cancelled orders can be removed from history' });
    }

    await db.query('DELETE FROM orders WHERE id = ?', [id]);

    res.status(200).json({ message: 'Order removed from history successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderReports,
  cancelOrder,
  deleteOrder
};

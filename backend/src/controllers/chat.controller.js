const db = require('../config/db');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || process.env.GROK_MODEL || 'llama-3.3-70b-versatile';

const STORE_INFO = `
TCUBE Fashions is a luxury minimalist fashion label for women, men, kids, accessories, and shoes.
Support email: support@tcube.com
Collections: Women's Minimalist, Men's Tailored, Kids Organic, Luxury Accessories, Suede & Leather Shoes.
Shipping: standard delivery 3-7 business days. Returns accepted within 14 days for unworn items with tags.
Customers can track orders in their dashboard after logging in.
`;

const buildCustomerPrompt = (context) => `You are "Aria", the friendly AI shopping assistant for TCUBE Fashions - a women's, men's, and kids luxury fashion boutique.

${STORE_INFO}

Your role is CUSTOMER SUPPORT ONLY. Help shoppers with:
- Product discovery, sizing, colors, and styling for women, men, and kids
- Cart, checkout, shipping, returns, and order tracking guidance
- Account login and dashboard help
- Gift ideas and outfit suggestions

STRICT RULES - you MUST follow these:
- NEVER explain admin panel features, inventory management, bulk uploads, coupon creation, banner editing, or store backend operations
- NEVER share other customers' data, admin credentials, or internal business metrics
- If asked about admin or store-management tasks, politely reply: "I can only help with shopping and customer support. For store management, please use the Admin dashboard."
- Keep answers warm, concise, and elegant - match the luxury brand tone
- Use PKR/Rs pricing when discussing prices if context includes them

${context ? `Customer context:\n${context}` : ''}`;

const buildAdminPrompt = (context) => `You are "Nova", the AI operations assistant for TCUBE Fashions admin dashboard.

${STORE_INFO}

You are assisting a verified STORE ADMIN. You can help with everything related to running the store:
- Products: add, edit, delete, bulk upload, categories, pricing, stock
- Orders: view all orders, update order_status (pending, processing, shipped, delivered, cancelled), payment_status, tracking numbers
- Categories, coupons, banners, and homepage content
- Customer reviews: approve or reject pending reviews
- Reports, sales insights, and dashboard navigation
- User management overview

Admin dashboard sections: Products, Orders, Categories, Coupons, Banners, Reviews, Reports.
Order statuses: pending, processing, shipped, delivered, cancelled.
Payment statuses: pending, paid, failed, refunded.
Review statuses: pending, approved, rejected.

Give actionable, step-by-step guidance. Be professional and efficient.

${context ? `Live store data:\n${context}` : ''}`;

async function fetchStoreContext(user) {
  const parts = [];

  try {
    const [categories] = await db.query(
      'SELECT name, slug FROM categories ORDER BY name LIMIT 20'
    );
    if (categories.length) {
      parts.push(`Categories: ${categories.map((c) => c.name).join(', ')}`);
    }

    const [products] = await db.query(
      'SELECT name, category, price, discount_price FROM products ORDER BY created_at DESC LIMIT 15'
    );
    if (products.length) {
      const list = products
        .map((p) => {
          const price = p.discount_price || p.price;
          return `${p.name} (${p.category}) - Rs ${price}`;
        })
        .join('; ');
      parts.push(`Recent products: ${list}`);
    }
  } catch (err) {
    console.error('Chat context fetch (catalog) error:', err.message);
  }

  if (!user) return parts.join('\n');

  if (user.role === 'admin') {
    try {
      const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) AS totalProducts FROM products');
      const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
      const [[{ pendingOrders }]] = await db.query(
        "SELECT COUNT(*) AS pendingOrders FROM orders WHERE order_status = 'pending'"
      );
      const [[{ pendingReviews }]] = await db.query(
        "SELECT COUNT(*) AS pendingReviews FROM reviews WHERE status = 'pending'"
      );
      const [recentOrders] = await db.query(
        `SELECT id, shipping_name, total_amount, order_status, payment_status, created_at
         FROM orders ORDER BY created_at DESC LIMIT 5`
      );

      parts.push(
        `Admin stats: ${totalProducts} products, ${totalOrders} total orders, ${pendingOrders} pending orders, ${pendingReviews} pending reviews.`
      );

      if (recentOrders.length) {
        const orders = recentOrders
          .map(
            (o) =>
              `#${o.id} ${o.shipping_name} Rs ${o.total_amount} [${o.order_status}/${o.payment_status}]`
          )
          .join('; ');
        parts.push(`Recent orders: ${orders}`);
      }
    } catch (err) {
      console.error('Chat context fetch (admin) error:', err.message);
    }
  } else {
    try {
      const [orders] = await db.query(
        `SELECT id, total_amount, order_status, payment_status, created_at
         FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
        [user.id]
      );

      if (orders.length) {
        const list = orders
          .map((o) => `Order #${o.id}: Rs ${o.total_amount}, status ${o.order_status}, payment ${o.payment_status}`)
          .join('; ');
        parts.push(`Customer ${user.name}'s recent orders: ${list}`);
      } else {
        parts.push(`Customer ${user.name} has no orders yet.`);
      }
    } catch (err) {
      console.error('Chat context fetch (customer) error:', err.message);
    }
  }

  return parts.join('\n');
}

async function fetchAdminMetrics() {
  try {
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ pendingOrders }]] = await db.query(
      "SELECT COUNT(*) AS pendingOrders FROM orders WHERE order_status = 'pending'"
    );
    const [[{ deliveredOrders }]] = await db.query(
      "SELECT COUNT(*) AS deliveredOrders FROM orders WHERE order_status = 'delivered'"
    );
    const [[{ todayOrders, todayRevenue }]] = await db.query(
      `SELECT COUNT(*) AS todayOrders, COALESCE(SUM(total_amount), 0) AS todayRevenue
       FROM orders WHERE DATE(created_at) = CURDATE()`
    );
    const [todayOrderList] = await db.query(
      `SELECT id, shipping_name, total_amount, order_status, payment_status
       FROM orders WHERE DATE(created_at) = CURDATE()
       ORDER BY created_at DESC LIMIT 5`
    );
    const [recentOrders] = await db.query(
      `SELECT id, shipping_name, total_amount, order_status, payment_status
       FROM orders ORDER BY created_at DESC LIMIT 5`
    );

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      todayOrders,
      todayRevenue,
      todayOrderList,
      recentOrders
    };
  } catch (err) {
    console.error('Chat fallback metrics error:', err.message);
    return null;
  }
}

function formatOrderList(orders) {
  if (!orders || orders.length === 0) return '';

  return orders
    .map(
      (o) =>
        `#${o.id} ${o.shipping_name}: Rs ${o.total_amount} (${o.order_status}/${o.payment_status})`
    )
    .join('; ');
}

function buildFallbackReply({ isAdmin, user, message, context, adminMetrics }) {
  const text = message.toLowerCase();
  const asksToday = text.includes('today') || text.includes('aaj');
  const asksCount =
    text.includes('how much') ||
    text.includes('how many') ||
    text.includes('count') ||
    text.includes('total');
  const asksDetails =
    text.includes('detail') ||
    text.includes('list') ||
    text.includes('show') ||
    text.includes('recent');

  if (isAdmin) {
    if (text.includes('order')) {
      if (!adminMetrics) {
        return 'I could not read the order data right now. Please try again in a moment.';
      }

      if (asksToday) {
        const todayOrders = Number(adminMetrics.todayOrders || 0);
        const todayRevenue = Number(adminMetrics.todayRevenue || 0).toFixed(2);
        const list = formatOrderList(adminMetrics.todayOrderList);
        return todayOrders > 0
          ? `Today you have ${todayOrders} order${todayOrders === 1 ? '' : 's'} totaling Rs ${todayRevenue}. ${list}`
          : 'Today you have 0 orders.';
      }

      if (asksDetails) {
        const list = formatOrderList(adminMetrics.recentOrders);
        return list
          ? `Recent orders: ${list}`
          : 'There are no orders yet.';
      }

      if (asksCount) {
        return `You have ${adminMetrics.totalOrders} total orders: ${adminMetrics.pendingOrders} pending and ${adminMetrics.deliveredOrders} delivered.`;
      }

      return `You have ${adminMetrics.totalOrders} total orders. ${adminMetrics.pendingOrders} are pending.`;
    }

    if (text.includes('product') || text.includes('stock') || text.includes('price')) {
      if (asksCount && context) {
        const match = context.match(/Admin stats: (\d+) products/);
        if (match) return `You have ${match[1]} products in the store.`;
      }

      return 'For products, go to Admin dashboard > Products. You can add a new item, edit price or stock, update categories, and manage product images there.';
    }

    if (text.includes('coupon') || text.includes('banner') || text.includes('review')) {
      return 'You can manage coupons, banners, and reviews from their matching Admin dashboard sections. For reviews, approve or reject pending submissions after checking the content.';
    }

    return 'I can help with products, orders, categories, coupons, banners, reviews, reports, and dashboard navigation. Ask for a count, list, or status and I will answer directly.';
  }

  if (text.includes('shipping') || text.includes('delivery')) {
    return 'Standard delivery for TCUBE Fashions is 3-7 business days. After logging in, customers can track orders from their dashboard.';
  }

  if (text.includes('return') || text.includes('refund')) {
    return 'Returns are accepted within 14 days for unworn items with tags. For help with a specific order, log in and check your dashboard or contact support@tcube.com.';
  }

  if (text.includes('size') || text.includes('fit')) {
    return 'For sizing, choose your usual size for a tailored fit. If you are between sizes, size up for outerwear and size down only for relaxed-fit pieces.';
  }

  if (text.includes('order') || text.includes('track')) {
    return user
      ? 'You can track your orders from your customer dashboard.'
      : 'Please log in to track your order from your customer dashboard.';
  }

  return 'Welcome to TCUBE Fashions. I can help you with women, men, kids, accessories, shoes, sizing, styling, shipping, returns, and order tracking.';
}

const sendChatMessage = async (req, res) => {
  try {
    const { messages, page } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const sanitized = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }));

    if (sanitized.length === 0 || sanitized[sanitized.length - 1].role !== 'user') {
      return res.status(400).json({ message: 'Last message must be from the user' });
    }

    const isAdmin = req.user?.role === 'admin';
    const context = await fetchStoreContext(req.user);
    const lastUserMessage = sanitized[sanitized.length - 1].content;
    const adminMetrics = isAdmin ? await fetchAdminMetrics() : null;
    const fallbackReply = buildFallbackReply({
      isAdmin,
      user: req.user,
      message: lastUserMessage,
      context,
      adminMetrics
    });

    const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    const isPlaceholderKey =
      !apiKey ||
      apiKey === 'your_groq_api_key_here' ||
      apiKey === 'your_grok_api_key_here';

    if (isPlaceholderKey) {
      console.warn('Chat AI provider is not configured. Returning local assistant fallback.');
      return res.status(200).json({
        reply: fallbackReply,
        mode: isAdmin ? 'admin' : 'customer',
        fallback: true
      });
    }

    let pageContext = '';
    if (page) {
      pageContext = `Current page: ${page}`;
    }

    const systemPrompt = isAdmin
      ? buildAdminPrompt([context, pageContext].filter(Boolean).join('\n'))
      : buildCustomerPrompt(
          [context, pageContext, req.user ? `Logged-in customer: ${req.user.name}` : 'Guest shopper']
            .filter(Boolean)
            .join('\n')
        );

    const groqMessages = [{ role: 'system', content: systemPrompt }, ...sanitized];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_completion_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return res.status(200).json({
        reply: fallbackReply,
        mode: isAdmin ? 'admin' : 'customer',
        fallback: true
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(200).json({
        reply: fallbackReply,
        mode: isAdmin ? 'admin' : 'customer',
        fallback: true
      });
    }

    res.status(200).json({
      reply,
      mode: isAdmin ? 'admin' : 'customer'
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ message: 'Failed to process chat message' });
  }
};

module.exports = { sendChatMessage };

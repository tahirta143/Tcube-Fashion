const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes = require('./src/routes/order.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const categoryRoutes = require('./src/routes/category.routes');
const couponRoutes = require('./src/routes/coupon.routes');
const bannerRoutes = require('./src/routes/banner.routes');
const reviewRoutes = require('./src/routes/review.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const chatRoutes = require('./src/routes/chat.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for dev testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve placeholder images for initial products (fallback folder if needed)
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'TCUBE Fashions API is running smoothly' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected server error occurred'
  });
});

// Initialize DB and start Server
async function startServer() {
  try {
    console.log('Connecting to MySQL database and running migrations...');
    await initializeDatabase();
    console.log('Database connected and schemas verified.');
  } catch (error) {
    console.error('\n================================================================');
    console.error('WARNING: Database connection failed!');
    console.error('Please ensure MySQL is running on localhost:3306 and check your .env config.');
    console.error(`Error details: ${error.message}`);
    console.error('================================================================\n');
  }

  const server = app.listen(PORT, () => {
    console.log(`Server is running in development mode on port ${PORT}`);
  });

  // Set timeout options to 10 minutes to allow slow/large uploads
  server.timeout = 10 * 60 * 1000;
  server.keepAliveTimeout = 10 * 60 * 1000;
  server.headersTimeout = (10 * 60 * 1000) + 2000;
}

startServer();

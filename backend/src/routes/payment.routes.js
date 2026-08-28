const express = require('express');
const router = express.Router();
const { createPaymentIntent, handlePaymentWebhook } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/webhook', handlePaymentWebhook);

module.exports = router;

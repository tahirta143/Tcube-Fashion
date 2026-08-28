const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  getPendingReviews,
  approveReview,
  deleteReview
} = require('../controllers/review.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/product/:productId', getProductReviews);
router.post('/', protect, createReview);
router.get('/pending', protect, adminOnly, getPendingReviews);
router.put('/:id/approve', protect, adminOnly, approveReview);
router.delete('/:id', protect, adminOnly, deleteReview);

module.exports = router;

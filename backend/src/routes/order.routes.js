const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderReports,
  cancelOrder,
  deleteOrder
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/reports', protect, adminOnly, getOrderReports);
router.get('/all', protect, adminOnly, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id', protect, adminOnly, updateOrderStatus);
router.delete('/:id', protect, deleteOrder);

module.exports = router;

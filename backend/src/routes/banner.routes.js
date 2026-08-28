const express = require('express');
const router = express.Router();
const { getBanners, createBanner, deleteBanner, updateBanner } = require('../controllers/banner.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/', getBanners);
router.post('/', protect, adminOnly, createBanner);
router.put('/:id', protect, adminOnly, updateBanner);
router.delete('/:id', protect, adminOnly, deleteBanner);

module.exports = router;

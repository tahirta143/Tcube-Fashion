const express = require('express');
const router = express.Router();
const { sendChatMessage } = require('../controllers/chat.controller');
const { optionalAuth } = require('../middleware/optionalAuth.middleware');

router.post('/', optionalAuth, sendChatMessage);

module.exports = router;

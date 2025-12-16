const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/user_login_signup');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', protect, getMe);

module.exports = router;

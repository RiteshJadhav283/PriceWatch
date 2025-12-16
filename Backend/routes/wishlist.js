const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } = require('../controllers/wishlist_controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/wishlist - Get user's wishlist
router.get('/', getWishlist);

// POST /api/wishlist - Add product to wishlist
router.post('/', addToWishlist);

// DELETE /api/wishlist/:itemId - Remove product from wishlist
router.delete('/:itemId', removeFromWishlist);

// POST /api/wishlist/check - Check if product is in wishlist
router.post('/check', checkWishlist);

module.exports = router;

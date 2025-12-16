const express = require('express');
const router = express.Router();
const { searchProducts, getCachedSearches, getProductSellers, getPriceHistory } = require('../controllers/product_controller');

// Public routes
router.get('/search', searchProducts);
router.get('/cached', getCachedSearches);

// Level 2: Get direct seller links for a specific product
router.get('/:id/sellers', getProductSellers);

// Price history endpoint
router.get('/:id/price-history', getPriceHistory);

module.exports = router;

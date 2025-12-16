const mongoose = require('mongoose');

// Separate collection for storing sellers per product
// This allows each product to have its own cached sellers with independent TTL
const productSellersSchema = new mongoose.Schema({
    // Google Product ID - unique identifier
    productId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Product info (cached for display)
    productTitle: {
        type: String,
        default: ''
    },

    // Sellers list from SearchAPI
    sellers: [{
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            default: 0
        },
        link: {
            type: String,
            default: ''
        },
        // Additional seller info
        delivery: String,
        rating: Number,
        reviews: Number
    }],

    // Cache metadata
    lastFetched: {
        type: Date,
        default: Date.now
    },

    // Auto-delete after 6 hours (seller data changes more frequently)
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 21600 // 6 hours in seconds (6 * 60 * 60)
    }
});

// Index for efficient querying and TTL
productSellersSchema.index({ productId: 1 });
productSellersSchema.index({ createdAt: 1 }, { expireAfterSeconds: 21600 });

const ProductSellers = mongoose.model('ProductSellers', productSellersSchema);

module.exports = ProductSellers;

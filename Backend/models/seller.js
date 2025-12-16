const mongoose = require('mongoose');

// Persistent Seller model for price history tracking
const sellerSchema = new mongoose.Schema({
    // Seller name as displayed by the API
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Normalized platform/domain (e.g., "amazon.in", "flipkart.com")
    platform: {
        type: String,
        default: ''
    },

    // When we first saw this seller
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient lookups
sellerSchema.index({ name: 1 });

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;

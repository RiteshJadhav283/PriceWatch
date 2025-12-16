const mongoose = require('mongoose');

// Persistent Product model for price history tracking
// This is separate from ProductSearch (which is TTL-cached)
const productSchema = new mongoose.Schema({
    // Google Product ID - unique identifier from SearchAPI
    googleProductId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Product details
    title: {
        type: String,
        required: true
    },

    thumbnail: {
        type: String,
        default: ''
    },

    productLink: {
        type: String,
        default: ''
    },

    // When we first saw this product
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient lookups
productSchema.index({ googleProductId: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

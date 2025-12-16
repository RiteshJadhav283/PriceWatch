const mongoose = require('mongoose');

// Append-only Price History model
// Every price fetched is stored with an exact timestamp - NEVER updated or overwritten
const priceHistorySchema = new mongoose.Schema({
    // Reference to Product
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },

    // Reference to Seller (nullable for single-seller products)
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        default: null
    },

    // Seller name (denormalized for quick display without joins)
    sellerName: {
        type: String,
        default: ''
    },

    // Price at this point in time
    price: {
        type: Number,
        required: true
    },

    // Currency code
    currency: {
        type: String,
        default: 'INR'
    },

    // Exact timestamp when this price was recorded
    recordedAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Compound index for efficient history queries
priceHistorySchema.index({ productId: 1, recordedAt: -1 });
priceHistorySchema.index({ productId: 1, sellerId: 1, recordedAt: -1 });

const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);

module.exports = PriceHistory;

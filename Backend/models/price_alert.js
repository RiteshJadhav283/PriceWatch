const mongoose = require('mongoose');

// Price Alert model - stores notification history for price drops
const priceAlertSchema = new mongoose.Schema({
    // User who receives the alert
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Product information
    productId: {
        type: String,
        required: true
    },

    productTitle: {
        type: String,
        required: true
    },

    thumbnail: {
        type: String,
        default: ''
    },

    seller: {
        type: String,
        default: ''
    },

    // Price change details
    oldPrice: {
        type: Number,
        required: true
    },

    newPrice: {
        type: Number,
        required: true
    },

    percentageDrop: {
        type: Number,
        required: true
    },

    currency: {
        type: String,
        default: 'INR'
    },

    // Alert status
    read: {
        type: Boolean,
        default: false
    },

    // When the alert was created
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient queries
priceAlertSchema.index({ userId: 1, createdAt: -1 });

const PriceAlert = mongoose.model('PriceAlert', priceAlertSchema);

module.exports = PriceAlert;

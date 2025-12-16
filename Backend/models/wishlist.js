const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        default: null
    },
    title: {
        type: String,
        required: true
    },
    price: String,
    extractedPrice: Number,
    thumbnail: String,
    seller: String,
    link: String,
    productLink: String,
    rating: Number,
    reviews: Number,
    delivery: String,
    sellers: [{
        name: String,
        price: Number,
        link: String,
        delivery: String,
        logo: String,
        rating: Number,
        reviews: Number
    }],
    // Price tracking fields
    previousPrice: {
        type: Number,
        default: null
    },
    lastCheckedAt: {
        type: Date,
        default: null
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [wishlistItemSchema]
}, { timestamps: true });

// Create index for faster lookups on items
wishlistSchema.index({ 'items.productId': 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);

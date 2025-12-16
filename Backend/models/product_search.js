const mongoose = require('mongoose');

const productSearchSchema = new mongoose.Schema({
    // Search query (normalized to lowercase for consistent caching)
    searchQuery: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },

    // Search metadata from API
    searchMetadata: {
        id: String,
        status: String,
        createdAt: String,
        requestTimeTaken: Number,
        parsingTimeTaken: Number,
        totalTimeTaken: Number,
        requestUrl: String,
        htmlUrl: String,
        jsonUrl: String
    },

    // Search parameters
    searchParameters: {
        engine: String,
        q: String,
        location: String,
        locationUsed: String,
        googleDomain: String,
        hl: String,
        gl: String
    },

    // Search information
    searchInformation: {
        queryDisplayed: String
    },

    // Filters array - store as mixed type to handle dynamic structure
    filters: [{
        type: { type: String },
        options: [{
            text: String,
            shoprs: String
        }]
    }],

    // Shopping results - the main product data
    shoppingResults: [{
        position: Number,
        productId: String,
        prds: String,
        title: String,
        link: String,           // Direct seller link (if available)
        productLink: String,    // Google Shopping comparison link
        offers: String,
        offersLink: String,
        price: String,
        extractedPrice: Number,
        originalPrice: String,
        extractedOriginalPrice: Number,
        rating: Number,
        reviews: Number,
        delivery: String,
        deliveryReturn: String,
        seller: String,
        thumbnail: String,
        productToken: String,
        installment: {
            downPayment: String,
            extractedDownPayment: Number,
            costPerMonth: String,
            extractedCostPerMonth: Number
        }
    }],

    // All filters token for pagination
    allFiltersToken: String,

    // Level 2: Direct seller links (Reliance Digital, Amazon, Flipkart, etc.)
    sellers: [{
        name: String,        // e.g. "Reliance Digital"
        price: Number,       // e.g. 62953
        link: String,        // The direct buy link
        updatedAt: { type: Date, default: Date.now }
    }],

    // Timestamp for when sellers were last scraped (for 6-hour cache)
    lastScraped: {
        type: Date,
        default: null
    },

    // Timestamp for TTL (auto-delete after 12 hours)
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 43200 // 12 hours in seconds (12 * 60 * 60)
    }
});

// Create compound index for efficient querying
productSearchSchema.index({ searchQuery: 1, createdAt: -1 });

const ProductSearch = mongoose.model('ProductSearch', productSearchSchema);

module.exports = ProductSearch;

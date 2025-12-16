const axios = require('axios');
const ProductSearch = require('../models/product_search');
const ProductSellers = require('../models/product_sellers');

// Price History models (persistent, append-only)
const Product = require('../models/product');
const Seller = require('../models/seller');
const PriceHistory = require('../models/price_history');

// SearchAPI configuration
const SEARCHAPI_BASE_URL = 'https://www.searchapi.io/api/v1/search';

// Helper function to extract platform from seller name
const extractPlatform = (sellerName) => {
    if (!sellerName) return '';
    const lower = sellerName.toLowerCase().trim();

    // Known platform mappings
    const platforms = {
        'amazon': 'amazon.in',
        'amazon.in': 'amazon.in',
        'flipkart': 'flipkart.com',
        'flipkart.com': 'flipkart.com',
        'croma': 'croma.com',
        'reliance digital': 'reliancedigital.in',
        'vijay sales': 'vijaysales.com',
        'tata cliq': 'tatacliq.com',
        'jiomart': 'jiomart.com'
    };

    for (const [key, platform] of Object.entries(platforms)) {
        if (lower.includes(key)) return platform;
    }

    return lower;
};

// Helper function to record price history for products in search results
// Only records ONCE PER DAY per product-seller combination to avoid data bloat
const recordPriceHistory = async (shoppingResults) => {
    if (!shoppingResults || shoppingResults.length === 0) return;

    const now = new Date();

    // Calculate start and end of today (midnight to midnight)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let recordedCount = 0;
    let skippedCount = 0;

    for (const item of shoppingResults) {
        try {
            // Skip items without a valid productId or price
            if (!item.productId || item.productId === 'undefined' || !item.extractedPrice) {
                continue;
            }

            // 1. Upsert Product (create if not exists)
            let product = await Product.findOneAndUpdate(
                { googleProductId: item.productId },
                {
                    $setOnInsert: {
                        googleProductId: item.productId,
                        title: item.title,
                        thumbnail: item.thumbnail,
                        productLink: item.productLink || '',
                        createdAt: now
                    }
                },
                { upsert: true, new: true }
            );

            // 2. Upsert Seller (if seller name exists)
            let seller = null;
            if (item.seller) {
                seller = await Seller.findOneAndUpdate(
                    { name: item.seller },
                    {
                        $setOnInsert: {
                            name: item.seller,
                            platform: extractPlatform(item.seller),
                            createdAt: now
                        }
                    },
                    { upsert: true, new: true }
                );
            }

            // 3. Check if we already recorded a price TODAY for this product-seller
            const existingTodayEntry = await PriceHistory.findOne({
                productId: product._id,
                sellerId: seller ? seller._id : null,
                recordedAt: { $gte: todayStart, $lte: todayEnd }
            });

            if (existingTodayEntry) {
                // Already recorded today, skip
                skippedCount++;
                continue;
            }

            // 4. APPEND price history entry (only once per day)
            await PriceHistory.create({
                productId: product._id,
                sellerId: seller ? seller._id : null,
                sellerName: item.seller || '',
                price: item.extractedPrice,
                currency: 'INR',
                recordedAt: now
            });

            recordedCount++;

        } catch (err) {
            // Log but don't fail the entire search for price history errors
            console.error(`⚠️ Price history error for ${item.productId}:`, err.message);
        }
    }

    if (recordedCount > 0) {
        console.log(`📊 Recorded price history for ${recordedCount} products (${skippedCount} already recorded today)`);
    } else if (skippedCount > 0) {
        console.log(`📊 Skipped ${skippedCount} products (already recorded today)`);
    }
};

// Helper function to generate seller URLs based on seller name and product title
// Used when the API doesn't provide a direct link
const generateSellerLink = (sellerName, productTitle) => {
    if (!sellerName || !productTitle) return null;

    const encodedTitle = encodeURIComponent(productTitle);
    const sellerLower = sellerName.toLowerCase().trim();

    // Map of known sellers to their search URLs
    const sellerUrls = {
        'amazon.in': `https://www.amazon.in/s?k=${encodedTitle}`,
        'amazon': `https://www.amazon.in/s?k=${encodedTitle}`,
        'flipkart': `https://www.flipkart.com/search?q=${encodedTitle}`,
        'flipkart.com': `https://www.flipkart.com/search?q=${encodedTitle}`,
        'croma': `https://www.croma.com/searchB?q=${encodedTitle}`,
        'croma.com': `https://www.croma.com/searchB?q=${encodedTitle}`,
        'reliance digital': `https://www.reliancedigital.in/search?q=${encodedTitle}`,
        'vijay sales': `https://www.vijaysales.com/search/${encodedTitle}`,
        'tata cliq': `https://www.tatacliq.com/search/?searchCategory=all&text=${encodedTitle}`,
        'jiomart': `https://www.jiomart.com/search/${encodedTitle}`,
        'apple': `https://www.apple.com/in/search/${encodedTitle}?src=serp`,
        'samsung': `https://www.samsung.com/in/search/?searchvalue=${encodedTitle}`,
        'tradeindia': `https://www.tradeindia.com/search.html?search_query=${encodedTitle}`,
        'tradeindia.com': `https://www.tradeindia.com/search.html?search_query=${encodedTitle}`,
        'indiamart': `https://www.indiamart.com/search/${encodedTitle}`,
        'indiamart.com': `https://www.indiamart.com/search/${encodedTitle}`,
        'paytm mall': `https://paytmmall.com/shop/search?q=${encodedTitle}`,
        'shopclues': `https://www.shopclues.com/search?q=${encodedTitle}`,
        'snapdeal': `https://www.snapdeal.com/search?keyword=${encodedTitle}`,
    };

    // Try exact match first
    if (sellerUrls[sellerLower]) {
        return sellerUrls[sellerLower];
    }

    // Try partial match
    for (const [key, url] of Object.entries(sellerUrls)) {
        if (sellerLower.includes(key) || key.includes(sellerLower)) {
            return url;
        }
    }

    // Fallback: If seller looks like a domain (contains .com, .in, .co, etc.), try to construct a URL
    const domainMatch = sellerLower.match(/([a-z0-9-]+\.(com|in|co\.in|org|net))/i);
    if (domainMatch) {
        const domain = domainMatch[1];
        // Try to go directly to the seller's website with a Google site search
        return `https://www.google.com/search?q=site:${domain}+${encodedTitle}`;
    }

    // Final fallback: Use Google search with seller name and product
    return `https://www.google.com/search?q=${encodeURIComponent(sellerName)}+${encodedTitle}`;
};

// Helper function to transform API response to our schema format
const transformApiResponse = (data, query) => {
    return {
        searchQuery: query.toLowerCase().trim(),
        searchMetadata: {
            id: data.search_metadata?.id,
            status: data.search_metadata?.status,
            createdAt: data.search_metadata?.created_at,
            requestTimeTaken: data.search_metadata?.request_time_taken,
            parsingTimeTaken: data.search_metadata?.parsing_time_taken,
            totalTimeTaken: data.search_metadata?.total_time_taken,
            requestUrl: data.search_metadata?.request_url,
            htmlUrl: data.search_metadata?.html_url,
            jsonUrl: data.search_metadata?.json_url
        },
        searchParameters: {
            engine: data.search_parameters?.engine,
            q: data.search_parameters?.q,
            location: data.search_parameters?.location,
            locationUsed: data.search_parameters?.location_used,
            googleDomain: data.search_parameters?.google_domain,
            hl: data.search_parameters?.hl,
            gl: data.search_parameters?.gl
        },
        searchInformation: {
            queryDisplayed: data.search_information?.query_displayed
        },
        filters: data.filters?.map(filter => ({
            type: filter.type,
            options: filter.options?.map(opt => ({
                text: opt.text,
                shoprs: opt.shoprs
            }))
        })) || [],
        shoppingResults: data.shopping_results?.map(item => ({
            position: item.position,
            productId: item.product_id,
            prds: item.prds,
            title: item.title,
            link: item.link,                    // Direct seller link (if available)
            productLink: item.product_link,     // Google Shopping comparison link
            offers: item.offers,
            offersLink: item.offers_link,
            price: item.price,
            extractedPrice: item.extracted_price,
            originalPrice: item.original_price,
            extractedOriginalPrice: item.extracted_original_price,
            rating: item.rating,
            reviews: item.reviews,
            delivery: item.delivery,
            deliveryReturn: item.delivery_return,
            seller: item.seller,
            thumbnail: item.thumbnail,
            productToken: item.product_token,
            installment: item.installment ? {
                downPayment: item.installment.down_payment,
                extractedDownPayment: item.installment.extracted_down_payment,
                costPerMonth: item.installment.cost_per_month,
                extractedCostPerMonth: item.installment.extracted_cost_per_month
            } : undefined
        })) || [],
        allFiltersToken: data.all_filters_token
    };
};

// @desc    Search products with caching
// @route   GET /api/products/search?q=PS5
// @access  Public
const searchProducts = async (req, res) => {
    try {
        const { q, location } = req.query;

        // Validate query
        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide a search query (q parameter)'
            });
        }

        const normalizedQuery = q.toLowerCase().trim();
        // Use provided location or default to India
        const searchLocation = location && location.trim() !== '' ? location.trim() : 'India';

        // Include location in cache key for location-specific results
        const cacheKey = `${normalizedQuery}|${searchLocation.toLowerCase()}`;

        // Check if we have cached results for this query+location
        const cachedResult = await ProductSearch.findOne({
            searchQuery: normalizedQuery,
            'searchParameters.location': searchLocation
        }).sort({ createdAt: -1 });

        if (cachedResult) {
            console.log(`📦 Cache HIT for query: "${normalizedQuery}" in ${searchLocation}`);

            // Record price history even from cache (prices in cache are still valid current prices)
            // This allows us to track price stability over time
            recordPriceHistory(cachedResult.shoppingResults).catch(err => {
                console.error('Price history recording failed:', err.message);
            });

            return res.status(200).json({
                success: true,
                cached: true,
                cacheAge: Math.round((Date.now() - cachedResult.createdAt.getTime()) / 1000 / 60) + ' minutes',
                data: cachedResult
            });
        }

        console.log(`🔍 Cache MISS for query: "${normalizedQuery}" in ${searchLocation} - Calling SearchAPI...`);

        // Call SearchAPI with dynamic location
        const apiResponse = await axios.get(SEARCHAPI_BASE_URL, {
            params: {
                api_key: process.env.SEARCHAPI_KEY,
                engine: 'google_shopping',
                gl: 'in',
                hl: 'en',
                location: searchLocation,
                q: q
            }
        });

        // Transform and save to MongoDB
        const transformedData = transformApiResponse(apiResponse.data, normalizedQuery);
        const savedSearch = await ProductSearch.create(transformedData);

        console.log(`✅ Saved search results for: "${normalizedQuery}"`);

        // Record price history for all products in search results (append-only)
        recordPriceHistory(savedSearch.shoppingResults).catch(err => {
            console.error('Price history recording failed:', err.message);
        });

        res.status(200).json({
            success: true,
            cached: false,
            data: savedSearch
        });

    } catch (error) {
        console.error('Search Error:', error.message);

        // Check if it's an API error
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: 'SearchAPI error',
                error: error.response.data
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during product search',
            error: error.message
        });
    }
};

// @desc    Get cached searches (for debugging/admin)
// @route   GET /api/products/cached
// @access  Public
const getCachedSearches = async (req, res) => {
    try {
        const cachedSearches = await ProductSearch.find()
            .select('searchQuery createdAt shoppingResults')
            .sort({ createdAt: -1 })
            .limit(20);

        const summary = cachedSearches.map(search => ({
            query: search.searchQuery,
            resultsCount: search.shoppingResults?.length || 0,
            cachedAt: search.createdAt,
            expiresIn: Math.round((search.createdAt.getTime() + 43200000 - Date.now()) / 1000 / 60) + ' minutes'
        }));

        res.status(200).json({
            success: true,
            count: summary.length,
            data: summary
        });

    } catch (error) {
        console.error('Get Cached Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @route   GET /api/products/:id/sellers
// @access  Public
// NOW USES SEPARATE ProductSellers COLLECTION FOR PER-PRODUCT CACHING
// ALSO ACCEPTS QUERY PARAMS FOR FALLBACK SELLER DATA (for single-seller products)
const getProductSellers = async (req, res) => {
    try {
        const googleProductId = req.params.id;

        // Get fallback seller info from query params (for single-seller products)
        const fallbackSeller = req.query.seller;
        const fallbackLink = req.query.link;
        const fallbackPrice = req.query.price ? parseFloat(req.query.price) : 0;
        const fallbackDelivery = req.query.delivery;
        const fallbackTitle = req.query.title; // Product title for generating search URLs

        // Input Validation - Handle missing/invalid IDs
        const invalidIds = [undefined, null, '', 'undefined', 'null'];

        // If no valid productId but we have fallback seller data, use that
        if (!googleProductId || invalidIds.includes(googleProductId)) {
            console.log('⚠️ No productId - checking for fallback seller data...');

            // Priority 1: Use direct link if provided
            if (fallbackLink && fallbackLink.trim() !== '') {
                console.log(`✅ Using direct fallback link: ${fallbackSeller || 'Direct Link'}`);
                return res.status(200).json({
                    success: true,
                    cached: false,
                    productId: null,
                    message: 'Single seller listing',
                    sellers: [{
                        name: fallbackSeller || 'View Deal',
                        price: fallbackPrice,
                        link: fallbackLink,
                        delivery: fallbackDelivery || ''
                    }]
                });
            }

            // Priority 2: Generate seller URL from seller name and product title
            if (fallbackSeller && fallbackTitle) {
                const generatedLink = generateSellerLink(fallbackSeller, fallbackTitle);
                if (generatedLink) {
                    console.log(`✅ Generated seller link for ${fallbackSeller}: ${generatedLink}`);
                    return res.status(200).json({
                        success: true,
                        cached: false,
                        productId: null,
                        message: 'Generated seller link',
                        sellers: [{
                            name: fallbackSeller,
                            price: fallbackPrice,
                            link: generatedLink,
                            delivery: fallbackDelivery || ''
                        }]
                    });
                }
            }

            // No fallback available
            console.log('❌ No seller link available');
            return res.status(200).json({
                success: true,
                cached: false,
                productId: null,
                message: 'No seller information available',
                sellers: []
            });
        }

        // Check if we have cached sellers for THIS SPECIFIC product
        const cachedSellers = await ProductSellers.findOne({ productId: googleProductId });

        if (cachedSellers) {
            const cacheAge = Math.round((Date.now() - cachedSellers.lastFetched.getTime()) / 1000 / 60);
            console.log(`⚡ Cache HIT for product: ${googleProductId} (${cacheAge} min old)`);

            return res.status(200).json({
                success: true,
                cached: true,
                cacheAge: `${cacheAge} minutes`,
                productId: googleProductId,
                sellers: cachedSellers.sellers
            });
        }

        // Cache MISS - fetch from API
        console.log(`🔍 Cache MISS for product: ${googleProductId} - Calling SearchAPI...`);

        // Call SearchAPI with google_product engine
        const apiResponse = await axios.get(SEARCHAPI_BASE_URL, {
            params: {
                api_key: process.env.SEARCHAPI_KEY,
                engine: 'google_product',
                product_id: googleProductId,
                gl: 'in',
                hl: 'en'
            }
        });

        // Extract sellers from response
        const offers = apiResponse.data?.offers || [];
        const productTitle = apiResponse.data?.product_results?.title || '';

        // Map to our schema format
        const sellersData = offers.map(offer => ({
            name: offer.merchant?.name || 'Unknown Seller',
            price: offer.extracted_price || 0,
            link: offer.link,
            delivery: offer.delivery || '',
            logo: offer.merchant?.logo || null,
            rating: offer.merchant?.rating,
            reviews: offer.merchant?.reviews
        }));

        // Save to ProductSellers collection (upsert - create or update)
        await ProductSellers.findOneAndUpdate(
            { productId: googleProductId },
            {
                productId: googleProductId,
                productTitle: productTitle,
                sellers: sellersData,
                lastFetched: new Date(),
                createdAt: new Date() // Reset TTL
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Fetched & cached ${sellersData.length} sellers for product: ${googleProductId}`);

        res.status(200).json({
            success: true,
            cached: false,
            productId: googleProductId,
            sellers: sellersData
        });

    } catch (error) {
        console.error('Get Sellers Error:', error.message);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: 'SearchAPI error',
                error: error.response.data
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while fetching sellers',
            error: error.message
        });
    }
};

// @desc    Get price history for a product
// @route   GET /api/products/:id/price-history?seller=<sellerId>
// @access  Public
const getPriceHistory = async (req, res) => {
    try {
        const googleProductId = req.params.id;
        const { seller: sellerIdFilter } = req.query;

        // Validate productId
        if (!googleProductId || googleProductId === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Find the product by Google Product ID
        const product = await Product.findOne({ googleProductId });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found. Price history is only available for products that have been searched.',
                productId: googleProductId
            });
        }

        // Build query for price history
        let query = { productId: product._id };

        // Filter by seller if provided
        if (sellerIdFilter) {
            query.sellerId = sellerIdFilter;
        }

        // Fetch price history sorted by date (oldest first for chart display)
        const priceHistory = await PriceHistory.find(query)
            .sort({ recordedAt: 1 })
            .lean();

        if (priceHistory.length === 0) {
            return res.status(200).json({
                success: true,
                productId: googleProductId,
                productTitle: product.title,
                firstSeen: product.createdAt,
                message: 'No price history available yet',
                history: []
            });
        }

        // Group history by seller for multi-line chart support
        const sellerGroups = {};
        for (const entry of priceHistory) {
            const sellerKey = entry.sellerId ? entry.sellerId.toString() : 'unknown';
            if (!sellerGroups[sellerKey]) {
                sellerGroups[sellerKey] = {
                    sellerId: entry.sellerId,
                    sellerName: entry.sellerName || 'Unknown Seller',
                    prices: []
                };
            }
            sellerGroups[sellerKey].prices.push({
                price: entry.price,
                currency: entry.currency,
                recordedAt: entry.recordedAt
            });
        }

        // Get list of all sellers for this product
        const sellers = Object.values(sellerGroups).map(group => ({
            sellerId: group.sellerId,
            sellerName: group.sellerName,
            dataPoints: group.prices.length,
            latestPrice: group.prices[group.prices.length - 1]?.price,
            lowestPrice: Math.min(...group.prices.map(p => p.price)),
            highestPrice: Math.max(...group.prices.map(p => p.price))
        }));

        res.status(200).json({
            success: true,
            productId: googleProductId,
            productTitle: product.title,
            thumbnail: product.thumbnail,
            firstSeen: product.createdAt,
            totalDataPoints: priceHistory.length,
            sellers: sellers,
            history: Object.values(sellerGroups)
        });

    } catch (error) {
        console.error('Get Price History Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching price history',
            error: error.message
        });
    }
};

module.exports = { searchProducts, getCachedSearches, getProductSellers, getPriceHistory };

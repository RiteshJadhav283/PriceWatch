const cron = require('node-cron');
const axios = require('axios');
const Wishlist = require('../models/wishlist');
const PriceAlert = require('../models/price_alert');
const { emitPriceDropAlert, emitPriceCheckStatus, getConnectedUsersCount } = require('./socket_handler');

// SearchAPI configuration
const SEARCHAPI_BASE_URL = 'https://www.searchapi.io/api/v1/search';

// Track if price check is running
let isRunning = false;
let lastRunTime = null;

/**
 * Initialize the scheduled price checker
 * @param {Server} io - Socket.io server instance
 */
const initializePriceChecker = (io) => {
    // Run every 2 hours: 0 */2 * * *
    // For testing, you can use '*/5 * * * *' (every 5 minutes)
    cron.schedule('0 */2 * * *', async () => {
        console.log('⏰ Scheduled price check triggered');
        await runPriceCheck(io);
    });

    console.log('✅ Price checker scheduled (every 2 hours)');
};

/**
 * Run the price check for all wishlist items
 * @param {Server} io - Socket.io server instance
 */
const runPriceCheck = async (io) => {
    if (isRunning) {
        console.log('⚠️ Price check already running, skipping...');
        return;
    }

    isRunning = true;
    lastRunTime = new Date();

    try {
        console.log('🔍 Starting price check for all wishlist items...');

        // Notify connected clients that check is starting
        emitPriceCheckStatus(io, {
            status: 'started',
            message: 'Checking prices for your wishlist items...',
            timestamp: lastRunTime
        });

        // Get all wishlists with items
        const wishlists = await Wishlist.find({ 'items.0': { $exists: true } })
            .populate('user', '_id');

        if (wishlists.length === 0) {
            console.log('📭 No wishlist items to check');
            isRunning = false;
            return;
        }

        // Collect unique productIds across all wishlists
        const productMap = new Map(); // productId -> { userIds, title, seller, oldPrice }

        for (const wishlist of wishlists) {
            for (const item of wishlist.items) {
                if (!item.productId || item.productId === 'null') continue;

                const key = `${item.productId}|${item.seller || ''}`;
                if (!productMap.has(key)) {
                    productMap.set(key, {
                        productId: item.productId,
                        title: item.title,
                        seller: item.seller,
                        thumbnail: item.thumbnail,
                        oldPrice: item.extractedPrice,
                        users: []
                    });
                }
                productMap.get(key).users.push({
                    userId: wishlist.user._id.toString(),
                    wishlistId: wishlist._id,
                    itemId: item._id
                });
            }
        }

        console.log(`📦 Checking prices for ${productMap.size} unique products...`);

        let alertsSent = 0;
        let productsChecked = 0;

        // Check prices for each unique product
        for (const [key, productInfo] of productMap) {
            try {
                // Search for current price
                const response = await axios.get(SEARCHAPI_BASE_URL, {
                    params: {
                        api_key: process.env.SEARCHAPI_KEY,
                        engine: 'google_shopping',
                        gl: 'in',
                        hl: 'en',
                        q: productInfo.title
                    }
                });

                const results = response.data?.shopping_results || [];

                // Find matching product by productId or seller
                const matchingProduct = results.find(r =>
                    r.product_id === productInfo.productId ||
                    (r.seller === productInfo.seller && r.title.includes(productInfo.title.substring(0, 30)))
                );

                if (matchingProduct && matchingProduct.extracted_price) {
                    const newPrice = matchingProduct.extracted_price;
                    const oldPrice = productInfo.oldPrice;

                    // Check for price drop (at least 1% drop to avoid noise)
                    if (oldPrice && newPrice < oldPrice) {
                        const percentageDrop = ((oldPrice - newPrice) / oldPrice) * 100;

                        if (percentageDrop >= 1) {
                            console.log(`💰 Price drop detected: ${productInfo.title} - ₹${oldPrice} → ₹${newPrice} (${percentageDrop.toFixed(1)}%)`);

                            // Notify each user who has this product
                            for (const userInfo of productInfo.users) {
                                // Create alert record
                                const alert = await PriceAlert.create({
                                    userId: userInfo.userId,
                                    productId: productInfo.productId,
                                    productTitle: productInfo.title,
                                    thumbnail: productInfo.thumbnail,
                                    seller: productInfo.seller,
                                    oldPrice: oldPrice,
                                    newPrice: newPrice,
                                    percentageDrop: percentageDrop,
                                    currency: 'INR'
                                });

                                // Send real-time notification
                                emitPriceDropAlert(io, userInfo.userId, {
                                    alertId: alert._id,
                                    productId: productInfo.productId,
                                    productTitle: productInfo.title,
                                    thumbnail: productInfo.thumbnail,
                                    seller: productInfo.seller,
                                    oldPrice: oldPrice,
                                    newPrice: newPrice,
                                    percentageDrop: percentageDrop.toFixed(1),
                                    currency: 'INR',
                                    timestamp: new Date()
                                });

                                alertsSent++;

                                // Update wishlist item price
                                await Wishlist.updateOne(
                                    { _id: userInfo.wishlistId, 'items._id': userInfo.itemId },
                                    {
                                        $set: {
                                            'items.$.extractedPrice': newPrice,
                                            'items.$.previousPrice': oldPrice,
                                            'items.$.lastCheckedAt': new Date()
                                        }
                                    }
                                );
                            }
                        }
                    }
                }

                productsChecked++;

                // Rate limiting - wait 500ms between API calls
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`⚠️ Error checking price for ${productInfo.title}:`, err.message);
            }
        }

        console.log(`✅ Price check complete: ${productsChecked} products checked, ${alertsSent} alerts sent`);

        // Notify clients that check is complete
        emitPriceCheckStatus(io, {
            status: 'completed',
            message: `Price check complete. ${alertsSent} price drops found.`,
            productsChecked,
            alertsSent,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('❌ Price check error:', error.message);
        emitPriceCheckStatus(io, {
            status: 'error',
            message: 'Price check failed',
            error: error.message
        });
    } finally {
        isRunning = false;
    }
};

/**
 * Manually trigger price check (for testing/admin)
 */
const triggerPriceCheck = async (io) => {
    await runPriceCheck(io);
};

/**
 * Get status of price checker
 */
const getPriceCheckerStatus = () => {
    return {
        isRunning,
        lastRunTime,
        connectedUsers: getConnectedUsersCount()
    };
};

module.exports = {
    initializePriceChecker,
    triggerPriceCheck,
    getPriceCheckerStatus
};

const Wishlist = require('../models/wishlist');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });

        res.status(200).json({
            success: true,
            items: wishlist ? wishlist.items : [],
            count: wishlist ? wishlist.items.length : 0
        });
    } catch (error) {
        console.error('Get Wishlist Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
    try {
        const { product } = req.body;

        if (!product || !product.title) {
            return res.status(400).json({
                success: false,
                message: 'Product data is required'
            });
        }

        let wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            // Create new wishlist for user
            wishlist = new Wishlist({
                user: req.user.id,
                items: []
            });
        }

        // Check if product already exists (by title + seller combination)
        const existingIndex = wishlist.items.findIndex(
            item => item.title === product.title && item.seller === product.seller
        );

        if (existingIndex !== -1) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        // Add product to wishlist
        wishlist.items.push({
            productId: product.productId || null,
            title: product.title,
            price: product.price,
            extractedPrice: product.extractedPrice,
            thumbnail: product.thumbnail,
            seller: product.seller,
            link: product.link,
            productLink: product.productLink,
            rating: product.rating,
            reviews: product.reviews,
            delivery: product.delivery,
            sellers: product.sellers || []
        });

        await wishlist.save();

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist',
            item: wishlist.items[wishlist.items.length - 1]
        });
    } catch (error) {
        console.error('Add to Wishlist Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:itemId
// @access  Private
const removeFromWishlist = async (req, res) => {
    try {
        const { itemId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        const itemIndex = wishlist.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in wishlist'
            });
        }

        wishlist.items.splice(itemIndex, 1);
        await wishlist.save();

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist'
        });
    } catch (error) {
        console.error('Remove from Wishlist Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Check if product is in wishlist
// @route   POST /api/wishlist/check
// @access  Private
const checkWishlist = async (req, res) => {
    try {
        const { title, seller } = req.body;

        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return res.status(200).json({
                success: true,
                inWishlist: false
            });
        }

        const exists = wishlist.items.some(
            item => item.title === title && item.seller === seller
        );

        res.status(200).json({
            success: true,
            inWishlist: exists
        });
    } catch (error) {
        console.error('Check Wishlist Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist };

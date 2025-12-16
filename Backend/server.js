const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.FRONTEND_URL
].filter(Boolean);

// Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Import socket handler and price checker
const { initializeSocketHandler } = require('./services/socket_handler');
const { initializePriceChecker, triggerPriceCheck, getPriceCheckerStatus } = require('./services/price_checker');

// CORS configuration - allow frontend
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Middleware to parse JSON
app.use(express.json());

// Import routes
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const wishlistRoutes = require('./routes/wishlist');
const notificationRoutes = require('./routes/notification');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check route
app.get('/', (req, res) => {
    const status = getPriceCheckerStatus();
    res.json({
        success: true,
        message: 'PriceWatch API is running!',
        priceChecker: status,
        endpoints: {
            signup: 'POST /api/users/signup',
            login: 'POST /api/users/login',
            getMe: 'GET /api/users/me (requires Bearer token)',
            searchProducts: 'GET /api/products/search?q=PS5',
            cachedSearches: 'GET /api/products/cached',
            priceHistory: 'GET /api/products/:id/price-history',
            triggerPriceCheck: 'POST /api/admin/trigger-price-check'
        }
    });
});

// Admin route to manually trigger price check (for testing)
app.post('/api/admin/trigger-price-check', async (req, res) => {
    try {
        const status = getPriceCheckerStatus();
        if (status.isRunning) {
            return res.status(409).json({
                success: false,
                message: 'Price check is already running'
            });
        }

        // Trigger async (don't wait for completion)
        triggerPriceCheck(io);

        res.json({
            success: true,
            message: 'Price check triggered'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to trigger price check',
            error: error.message
        });
    }
});

// Get price check status
app.get('/api/admin/price-check-status', (req, res) => {
    res.json({
        success: true,
        ...getPriceCheckerStatus()
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pricewatch';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');

        // Initialize Socket.io handler
        initializeSocketHandler(io);

        // Initialize scheduled price checker
        initializePriceChecker(io);

        // Start server (use 'server' instead of 'app' for Socket.io)
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log('🔌 WebSocket server ready');
            console.log('\n📍 Available endpoints:');
            console.log(`   POST http://localhost:${PORT}/api/users/signup`);
            console.log(`   POST http://localhost:${PORT}/api/users/login`);
            console.log(`   GET  http://localhost:${PORT}/api/users/me`);
            console.log(`   GET  http://localhost:${PORT}/api/products/search?q=PS5`);
            console.log(`   GET  http://localhost:${PORT}/api/products/:id/price-history`);
            console.log(`   POST http://localhost:${PORT}/api/admin/trigger-price-check`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    });

// Export io for use in other modules if needed
module.exports = { io };
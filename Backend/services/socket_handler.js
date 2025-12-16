const jwt = require('jsonwebtoken');

// Store active connections
const connectedUsers = new Map(); // userId -> Set of socket ids

/**
 * Initialize Socket.io handlers
 * @param {Server} io - Socket.io server instance
 */
const initializeSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Handle user joining their personal room
        socket.on('join-room', async (data) => {
            try {
                const { token } = data;

                if (!token) {
                    socket.emit('error', { message: 'No token provided' });
                    return;
                }

                // Verify JWT token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;

                // Join user-specific room
                socket.join(`user:${userId}`);

                // Track connected user
                if (!connectedUsers.has(userId)) {
                    connectedUsers.set(userId, new Set());
                }
                connectedUsers.get(userId).add(socket.id);

                // Store userId on socket for disconnect handling
                socket.userId = userId;

                console.log(`👤 User ${userId} joined room (${connectedUsers.get(userId).size} connections)`);

                socket.emit('joined', {
                    success: true,
                    message: 'Connected to price alerts',
                    userId: userId
                });

            } catch (error) {
                console.error('Socket auth error:', error.message);
                socket.emit('error', { message: 'Authentication failed' });
            }
        });

        // Handle user leaving room (logout)
        socket.on('leave-room', () => {
            if (socket.userId) {
                socket.leave(`user:${socket.userId}`);

                // Remove from tracking
                if (connectedUsers.has(socket.userId)) {
                    connectedUsers.get(socket.userId).delete(socket.id);
                    if (connectedUsers.get(socket.userId).size === 0) {
                        connectedUsers.delete(socket.userId);
                    }
                }

                console.log(`👋 User ${socket.userId} left room`);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            if (socket.userId) {
                if (connectedUsers.has(socket.userId)) {
                    connectedUsers.get(socket.userId).delete(socket.id);
                    if (connectedUsers.get(socket.userId).size === 0) {
                        connectedUsers.delete(socket.userId);
                    }
                }
                console.log(`🔌 Socket disconnected: ${socket.id} (User: ${socket.userId})`);
            } else {
                console.log(`🔌 Socket disconnected: ${socket.id}`);
            }
        });
    });

    console.log('✅ Socket.io handler initialized');
};

/**
 * Emit price drop alert to specific user
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - User ID to notify
 * @param {Object} alertData - Price drop alert data
 */
const emitPriceDropAlert = (io, userId, alertData) => {
    io.to(`user:${userId}`).emit('price-drop', alertData);
    console.log(`📢 Price drop alert sent to user ${userId}: ${alertData.productTitle}`);
};

/**
 * Emit price check status to all connected users
 * @param {Server} io - Socket.io server instance
 * @param {Object} status - Status data
 */
const emitPriceCheckStatus = (io, status) => {
    io.emit('price-check-status', status);
};

/**
 * Get count of connected users
 */
const getConnectedUsersCount = () => {
    return connectedUsers.size;
};

module.exports = {
    initializeSocketHandler,
    emitPriceDropAlert,
    emitPriceCheckStatus,
    getConnectedUsersCount
};

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Create context
const SocketContext = createContext(null);

/**
 * Socket Provider Component
 * Manages WebSocket connection and price drop notifications
 */
export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [priceCheckStatus, setPriceCheckStatus] = useState(null);

    // Connect to socket when user logs in
    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, skipping socket connection');
            return;
        }

        // Create socket connection
        const newSocket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('🔌 Socket connected');
            setIsConnected(true);

            // Join user's room with token
            newSocket.emit('join-room', { token });
        });

        newSocket.on('joined', (data) => {
            console.log('✅ Joined price alert room:', data);
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // Listen for price drop alerts
        newSocket.on('price-drop', (alertData) => {
            console.log('💰 Price drop alert received:', alertData);

            // Add to notifications
            setNotifications(prev => [
                {
                    id: alertData.alertId || Date.now(),
                    ...alertData,
                    shown: false
                },
                ...prev
            ]);
        });

        // Listen for price check status
        newSocket.on('price-check-status', (status) => {
            console.log('📊 Price check status:', status);
            setPriceCheckStatus(status);
        });

        setSocket(newSocket);

        return newSocket;
    }, []);

    // Disconnect socket
    const disconnect = useCallback(() => {
        if (socket) {
            socket.emit('leave-room');
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [socket]);

    // Mark notification as shown/read
    const markNotificationShown = useCallback((notificationId) => {
        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, shown: true } : n
            )
        );
    }, []);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Get unshown notifications (for toast display)
    const unshownNotifications = notifications.filter(n => !n.shown);

    // Auto-connect when token exists
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !socket) {
            connect();
        }

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const value = {
        socket,
        isConnected,
        notifications,
        unshownNotifications,
        priceCheckStatus,
        connect,
        disconnect,
        markNotificationShown,
        clearNotifications
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

/**
 * Hook to use socket context
 */
export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}

export default SocketContext;

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';

const API_URL = 'http://localhost:3000/api';

/**
 * Notification Bell + Dropdown Component
 * Shows price drop alerts with unread count badge
 */
function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Fetch on mount and periodically
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays}d ago`;
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification._id);
        }
        setIsOpen(false);
        navigate('/wishlist');
    };

    // Don't show if not logged in
    const token = localStorage.getItem('token');
    if (!token) return null;

    return (
        <div className="notification-dropdown-container" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h3>🔔 Price Alerts</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={markAllAsRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="dropdown-content">
                        {loading && (
                            <div className="dropdown-loading">
                                <div className="mini-spinner"></div>
                                <span>Loading...</span>
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div className="dropdown-empty">
                                <span className="empty-icon">🔕</span>
                                <p>No price alerts yet</p>
                                <p className="empty-hint">Add items to your wishlist to track prices</p>
                            </div>
                        )}

                        {!loading && notifications.length > 0 && (
                            <div className="notification-list">
                                {notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="notification-thumbnail">
                                            {notification.thumbnail ? (
                                                <img src={notification.thumbnail} alt="" />
                                            ) : (
                                                <span className="thumbnail-fallback">📦</span>
                                            )}
                                        </div>
                                        <div className="notification-details">
                                            <p className="notification-title">
                                                {notification.productTitle?.length > 35
                                                    ? notification.productTitle.substring(0, 35) + '...'
                                                    : notification.productTitle}
                                            </p>
                                            <div className="notification-price-change">
                                                <span className="old-price">
                                                    ₹{notification.oldPrice?.toLocaleString('en-IN')}
                                                </span>
                                                <span className="arrow">→</span>
                                                <span className="new-price">
                                                    ₹{notification.newPrice?.toLocaleString('en-IN')}
                                                </span>
                                                <span className="drop-badge">
                                                    -{notification.percentageDrop?.toFixed(0)}%
                                                </span>
                                            </div>
                                            <p className="notification-meta">
                                                {notification.seller} • {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.read && <span className="unread-dot"></span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationDropdown;

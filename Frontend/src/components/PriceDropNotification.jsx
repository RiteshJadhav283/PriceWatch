import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import './PriceDropNotification.css';

/**
 * Price Drop Notification Toast Component
 * Displays real-time price drop alerts
 */
function PriceDropNotification() {
    const { unshownNotifications, markNotificationShown } = useSocket();
    const [visibleNotifications, setVisibleNotifications] = useState([]);
    const navigate = useNavigate();

    // Show new notifications
    useEffect(() => {
        if (unshownNotifications.length > 0) {
            const newNotification = unshownNotifications[0];

            // Add to visible list
            setVisibleNotifications(prev => [
                { ...newNotification, visible: true },
                ...prev
            ]);

            // Mark as shown
            markNotificationShown(newNotification.id);

            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                dismissNotification(newNotification.id);
            }, 10000);
        }
    }, [unshownNotifications]);

    const dismissNotification = (id) => {
        setVisibleNotifications(prev =>
            prev.map(n =>
                n.id === id ? { ...n, visible: false } : n
            )
        );

        // Remove from DOM after animation
        setTimeout(() => {
            setVisibleNotifications(prev => prev.filter(n => n.id !== id));
        }, 300);
    };

    const handleClick = (notification) => {
        dismissNotification(notification.id);
        navigate('/wishlist');
    };

    if (visibleNotifications.length === 0) {
        return null;
    }

    return (
        <div className="price-drop-notifications">
            {visibleNotifications.map(notification => (
                <div
                    key={notification.id}
                    className={`notification-toast ${notification.visible ? 'visible' : 'hidden'}`}
                    onClick={() => handleClick(notification)}
                >
                    <div className="notification-icon">
                        <span>🔔</span>
                    </div>

                    <div className="notification-content">
                        <div className="notification-header">
                            <span className="notification-title">Price Drop!</span>
                            <span className="notification-percentage">
                                -{notification.percentageDrop}%
                            </span>
                        </div>

                        <p className="notification-product">
                            {notification.productTitle?.length > 40
                                ? notification.productTitle.substring(0, 40) + '...'
                                : notification.productTitle}
                        </p>

                        <div className="notification-prices">
                            <span className="old-price">
                                ₹{notification.oldPrice?.toLocaleString('en-IN')}
                            </span>
                            <span className="arrow">→</span>
                            <span className="new-price">
                                ₹{notification.newPrice?.toLocaleString('en-IN')}
                            </span>
                        </div>

                        <p className="notification-seller">
                            from {notification.seller || 'Seller'}
                        </p>
                    </div>

                    <button
                        className="notification-close"
                        onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

export default PriceDropNotification;

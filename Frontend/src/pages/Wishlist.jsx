import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '../components/NotificationDropdown';
import '../styles/Auth.css';
import '../styles/Products.css';
import '../styles/Wishlist.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Wishlist() {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_URL}/wishlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setWishlistItems(data.items || []);
            } else {
                setError(data.message || 'Failed to load wishlist');
            }
        } catch (err) {
            setError('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (itemId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/wishlist/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setWishlistItems(prev => prev.filter(item => item._id !== itemId));
            }
        } catch (err) {
            console.error('Error removing item:', err);
        }
    };

    const formatPrice = (price, extractedPrice) => {
        if (extractedPrice) return `₹${extractedPrice.toLocaleString('en-IN')}`;
        if (price) return price;
        return 'Price unavailable';
    };

    return (
        <div className="wishlist-page">
            {/* Header */}
            <header className="products-header">
                <div className="header-brand" onClick={() => navigate('/dashboard')}>
                    <img src="/logo/Logo.webp" alt="PriceWatch" className="brand-logo" />
                </div>

                <div className="header-actions">
                    <NotificationDropdown />
                    <button className="back-btn" onClick={() => navigate('/products')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Products
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="wishlist-content">
                <div className="wishlist-header">
                    <h1>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        My Wishlist
                    </h1>
                    <span className="wishlist-count">{wishlistItems.length} items</span>
                </div>

                {loading && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading your wishlist...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="empty-state">
                        <h2>Oops!</h2>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && wishlistItems.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">💔</div>
                        <h2>Your wishlist is empty</h2>
                        <p>Start adding products you love to keep track of them!</p>
                        <button className="cta-btn" onClick={() => navigate('/dashboard')}>
                            Browse Products
                        </button>
                    </div>
                )}

                {!loading && wishlistItems.length > 0 && (
                    <div className="wishlist-grid">
                        {wishlistItems.map((item) => (
                            <div key={item._id} className="wishlist-card">
                                <button
                                    className="remove-btn"
                                    onClick={() => removeFromWishlist(item._id)}
                                    title="Remove from wishlist"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>

                                <div className="wishlist-image">
                                    <img
                                        src={item.thumbnail}
                                        alt={item.title}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                                        }}
                                    />
                                </div>

                                <div className="wishlist-info">
                                    <h3 className="wishlist-title">{item.title}</h3>
                                    <p className="wishlist-price">{formatPrice(item.price, item.extractedPrice)}</p>
                                    <p className="wishlist-seller">
                                        <span>🏪</span> {item.seller || 'Unknown seller'}
                                    </p>
                                    {item.delivery && (
                                        <p className="wishlist-delivery">{item.delivery}</p>
                                    )}
                                </div>

                                {/* Sellers Section */}
                                {item.sellers && item.sellers.length > 0 && (
                                    <div className="wishlist-sellers">
                                        <h4 className="sellers-heading">Buy from ({item.sellers.length} sellers)</h4>
                                        <div className="sellers-list">
                                            {item.sellers.map((seller, idx) => (
                                                <a
                                                    key={idx}
                                                    href={seller.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="seller-link-card"
                                                >
                                                    {seller.logo ? (
                                                        <img src={seller.logo} alt={seller.name} className="seller-mini-logo" />
                                                    ) : (
                                                        <span className="seller-mini-fallback">{seller.name?.charAt(0).toUpperCase() || 'S'}</span>
                                                    )}
                                                    <div className="seller-link-info">
                                                        <span className="seller-link-name">{seller.name}</span>
                                                        <span className="seller-link-price">
                                                            {seller.price > 0 ? `₹${seller.price.toLocaleString('en-IN')}` : 'Price on site'}
                                                        </span>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="external-icon">
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                        <polyline points="15 3 21 3 21 9"></polyline>
                                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                                    </svg>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Fallback if no sellers stored */}
                                {(!item.sellers || item.sellers.length === 0) && (
                                    <div className="wishlist-actions">
                                        <a
                                            href={item.link || item.productLink || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="buy-btn"
                                        >
                                            Buy Now
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Wishlist;

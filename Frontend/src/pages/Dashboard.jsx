import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThreeBackground from '../components/ThreeBackground';
import NotificationDropdown from '../components/NotificationDropdown';
import AuthRequiredPopup from '../components/AuthRequiredPopup';
import '../styles/Dashboard.css';

function Dashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [user, setUser] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [authFeature, setAuthFeature] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        navigate(`/products?q=${encodeURIComponent(suggestion)}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleWishlistClick = () => {
        if (user) {
            navigate('/wishlist');
        } else {
            setAuthFeature('Wishlist');
            setShowAuthPopup(true);
        }
    };

    const handleNotificationClick = () => {
        if (!user) {
            setAuthFeature('Notifications');
            setShowAuthPopup(true);
            return true; // Prevent dropdown
        }
        return false;
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const suggestions = ['iPhone 15 Pro', 'PlayStation 5', 'MacBook Air M3', 'Samsung Galaxy S24', 'AirPods Pro'];

    return (
        <div className="dashboard-container">
            {/* Three.js Interactive Background */}
            <ThreeBackground />

            {/* Gradient Overlay */}
            <div className="gradient-overlay"></div>

            {/* Auth Required Popup */}
            <AuthRequiredPopup
                isOpen={showAuthPopup}
                onClose={() => setShowAuthPopup(false)}
                feature={authFeature}
            />

            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                    <img src="/logo/Logo.webp" alt="PriceWatch" className="brand-logo" />
                    <span className="brand-text">PriceWatch</span>
                </div>
                <div className="dashboard-user">
                    {user ? (
                        <>
                            <NotificationDropdown />
                            <button className="wishlist-nav-btn" onClick={handleWishlistClick} title="My Wishlist">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </button>
                            <span className="user-name">{user.name || 'User'}</span>
                            <div className="user-avatar" title={user.name || 'User'}>
                                {getInitials(user.name)}
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Show notification and wishlist buttons for non-logged-in users too */}
                            <button
                                className="notification-bell guest-btn"
                                onClick={() => { setAuthFeature('Notifications'); setShowAuthPopup(true); }}
                                title="Notifications"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                            </button>
                            <button
                                className="wishlist-nav-btn guest-btn"
                                onClick={handleWishlistClick}
                                title="Wishlist"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </button>
                            <div className="auth-buttons">
                                <button className="auth-btn login-btn" onClick={() => navigate('/login')}>
                                    Login
                                </button>
                                <button className="auth-btn signup-btn" onClick={() => navigate('/signup')}>
                                    Sign Up
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Main Search Section */}
            <section className="search-section">
                <div className="search-hero">
                    <p className="hero-tagline">Smart Price Comparison</p>
                    <h1>
                        Find the <span className="gradient-text">Best Prices</span>
                    </h1>
                    <p className="hero-subtitle">
                        Compare prices across 50+ stores instantly. Save money on every purchase.
                    </p>
                </div>

                <form className={`search-box ${isSearchFocused ? 'focused' : ''}`} onSubmit={handleSearch}>
                    <div className="search-input-wrapper">
                        <div className="search-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.3-4.3"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for any product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                        <button type="submit" className="search-btn" aria-label="Search">
                            <span>Search</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </form>

                {/* Search Suggestions */}
                <div className="search-suggestions">
                    <span className="suggestions-label">Popular:</span>
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            className="suggestion-chip"
                            onClick={() => handleSuggestionClick(suggestion)}
                            type="button"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>

                {/* Stats Section */}
                <div className="stats-section">
                    <div className="stat-item">
                        <span className="stat-number">50+</span>
                        <span className="stat-label">Stores</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">1M+</span>
                        <span className="stat-label">Products</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">₹6.7L</span>
                        <span className="stat-label">Saved</span>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="features-section">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <h3>Price Compare</h3>
                        <p>Real-time prices from 50+ retailers</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                            </svg>
                        </div>
                        <h3>Price Alerts</h3>
                        <p>Get notified on price drops</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3v18h18"></path>
                                <path d="m19 9-5 5-4-4-3 3"></path>
                            </svg>
                        </div>
                        <h3>Price History</h3>
                        <p>Historical trends &amp; insights</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                            </svg>
                        </div>
                        <h3>Wishlist</h3>
                        <p>Track your favorite items</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;

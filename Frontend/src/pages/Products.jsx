import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PriceHistoryChart from '../components/PriceHistoryChart';
import NotificationDropdown from '../components/NotificationDropdown';
import '../styles/Auth.css';
import '../styles/Products.css';
import '../styles/PriceHistoryChart.css';

const API_URL = 'http://localhost:3000/api';

// Seller icon mapping - maps seller names to custom logo paths
const SELLER_ICONS = {
    'amazon': '/Seller_icon/amazon-icon--socialmedia-iconset--uiconstock-0.png',
    'flipkart': '/Seller_icon/Flipkart.png',
    'meesho': '/Seller_icon/Meesho_logo.png',
    'lenskart': '/Seller_icon/Lenskart.jpg',
    'tata cliq': '/Seller_icon/Tata cliq.png',
    'tatacliq': '/Seller_icon/Tata cliq.png',
    'zepto': '/Seller_icon/Zepto.png',
    'blinkit': '/Seller_icon/blinkit.svg',
    'ajio': '/Seller_icon/Ajio.webp',
    'myntra': '/Seller_icon/Myntra.webp',
    'nykaa': '/Seller_icon/Nykaa.png',
    'croma': '/Seller_icon/croma.png',
    'decathlon': '/Seller_icon/Decathlon.png',
    'pharmeasy': '/Seller_icon/PharmEasy.jpg',
    'vijay sales': '/Seller_icon/Vijay_Sales.png',
    'vijaysales': '/Seller_icon/Vijay_Sales.png',
    'instamart': '/Seller_icon/instamart.jpg',
    'swiggy': '/Seller_icon/instamart.jpg',
};

// Get seller icon - returns custom logo if available, otherwise default emoji
const getSellerIcon = (sellerName) => {
    if (!sellerName) return null;
    const lowerName = sellerName.toLowerCase();

    // Check if any key is contained in the seller name
    for (const [key, iconPath] of Object.entries(SELLER_ICONS)) {
        if (lowerName.includes(key)) {
            return iconPath;
        }
    }
    return null; // No custom icon found
};

function Products() {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cached, setCached] = useState(false);
    const [cacheAge, setCacheAge] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [sellers, setSellers] = useState([]);
    const [loadingSellers, setLoadingSellers] = useState(false);
    const [sortBy, setSortBy] = useState('relevance');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [wishlist, setWishlist] = useState(new Set());
    const [userLocation, setUserLocation] = useState('India');
    const [locationLoading, setLocationLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Get user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Get user location on component mount
    useEffect(() => {
        getUserLocation();
    }, []);

    const getUserLocation = async () => {
        setLocationLoading(true);

        // Check if we have cached location
        const cachedLocation = localStorage.getItem('userLocation');
        if (cachedLocation) {
            setUserLocation(cachedLocation);
            setLocationLoading(false);
            return;
        }

        if (!navigator.geolocation) {
            console.log('Geolocation not supported');
            setLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Use free reverse geocoding API
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();

                    // Extract city and state
                    const city = data.address?.city || data.address?.town || data.address?.village || '';
                    const state = data.address?.state || '';
                    const country = data.address?.country || 'India';

                    // Use state-level location for SearchAPI compatibility
                    // Small cities are often not recognized by SearchAPI
                    let location = '';
                    if (state) {
                        location = `${state}, ${country}`;
                    } else {
                        location = country;
                    }

                    setUserLocation(location);
                    // Store display location (with city) separately for UI
                    const displayLocation = city ? `${city}, ${state}` : state || country;
                    localStorage.setItem('userLocation', location);
                    localStorage.setItem('userLocationDisplay', displayLocation);
                    console.log(`📍 Location detected: ${displayLocation} (API: ${location})`);
                } catch (err) {
                    console.error('Error getting location:', err);
                } finally {
                    setLocationLoading(false);
                }
            },
            (err) => {
                console.log('Location permission denied or error:', err.message);
                setLocationLoading(false);
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    };

    // Fetch products when query changes or restore from sessionStorage
    // Wait for location to be detected before searching
    useEffect(() => {
        // Don't search until location detection is complete
        if (locationLoading) return;

        const query = searchParams.get('q');
        if (query) {
            setSearchQuery(query);

            // Check sessionStorage for cached results
            const cachedData = sessionStorage.getItem(`search_${query}_${userLocation}`);
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    setProducts(parsed.products || []);
                    setCached(parsed.cached || false);
                    setCacheAge(parsed.cacheAge || '');
                    return; // Don't fetch if we have cached results
                } catch (e) {
                    console.error('Error parsing cached search results:', e);
                }
            }

            fetchProducts(query);
        }
    }, [searchParams, userLocation, locationLoading]);

    const fetchProducts = async (query) => {
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setSelectedProduct(null);
        setSellers([]);

        try {
            const token = localStorage.getItem('token');
            const locationParam = encodeURIComponent(userLocation);
            const response = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(query)}&location=${locationParam}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch products');
            }

            const productsData = data.data?.shoppingResults || [];
            setProducts(productsData);
            setCached(data.cached || false);
            setCacheAge(data.cacheAge || '');

            // Save to sessionStorage for navigation persistence (include location)
            sessionStorage.setItem(`search_${query}_${userLocation}`, JSON.stringify({
                products: productsData,
                cached: data.cached || false,
                cacheAge: data.cacheAge || ''
            }));
        } catch (err) {
            setError(err.message || 'Something went wrong');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSellers = async (product) => {
        // Reset sellers immediately and show loading
        setSellers([]);
        setLoadingSellers(true);

        try {
            const token = localStorage.getItem('token');
            const timestamp = Date.now();

            // Build the API URL with product ID or fallback data
            let apiUrl;

            if (product.productId && product.productId !== 'undefined' && product.productId !== '') {
                // Product has ID - normal API call
                apiUrl = `${API_URL}/products/${product.productId}/sellers?t=${timestamp}`;
            } else {
                // Single-seller product - send fallback data as query params
                const params = new URLSearchParams({
                    t: timestamp,
                    seller: product.seller || '',
                    link: product.link || '',
                    price: product.extractedPrice || 0,
                    delivery: product.delivery || '',
                    title: product.title || ''  // For generating seller search URLs
                });
                apiUrl = `${API_URL}/products/undefined/sellers?${params.toString()}`;
            }

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Cache-Control': 'no-cache'
                }
            });

            const data = await response.json();

            if (data.success) {
                setSellers(data.sellers || []);
            } else {
                setSellers([]);
            }
        } catch (err) {
            console.error('Error fetching sellers:', err);
            setSellers([]);
        } finally {
            setLoadingSellers(false);
        }
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        // Always fetch sellers - for single-seller products, it will use fallback data
        fetchSellers(product);
    };

    const closeProductPanel = () => {
        setSelectedProduct(null);
        setSellers([]);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const renderStars = (rating) => {
        if (!rating) return null;
        const stars = [];
        const fullStars = Math.floor(rating);

        for (let i = 0; i < 5; i++) {
            stars.push(
                <svg
                    key={i}
                    className={`star ${i < fullStars ? 'filled' : ''}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            );
        }
        return stars;
    };

    const formatPrice = (price, extractedPrice) => {
        if (extractedPrice) return `₹${extractedPrice.toLocaleString('en-IN')}`;
        if (price) return price;
        return 'Price unavailable';
    };

    const getDirectSellerLink = (product) => {
        // Priority: link > offersLink > productLink
        // 'link' = direct seller link (best)
        // 'offersLink' = sometimes has seller link
        // 'productLink' = Google Shopping (fallback)
        if (product.link && product.link.trim() !== '') {
            return product.link;
        }
        if (product.offersLink && product.offersLink.trim() !== '') {
            return product.offersLink;
        }
        return product.productLink || '#';
    };

    // Check if this is the Google Shopping page (not direct seller)
    const isGoogleShoppingLink = (url) => {
        if (!url) return true;
        return url.includes('google.com') || url.includes('shopping.google');
    };

    const isSingleSeller = (product) => {
        return !product.productId || product.productId === 'undefined' || product.productId === '';
    };

    // Wishlist functions
    const fetchWishlist = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/wishlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                // Create a Set of "title+seller" keys for quick lookup
                const wishlistSet = new Set(
                    data.items.map(item => `${item.title}|${item.seller}`)
                );
                setWishlist(wishlistSet);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    const isInWishlist = (product) => {
        return wishlist.has(`${product.title}|${product.seller}`);
    };

    const toggleWishlist = async (e, product) => {
        e.stopPropagation(); // Prevent card click

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to add items to wishlist');
            navigate('/login');
            return;
        }

        const key = `${product.title}|${product.seller}`;
        const isCurrentlyInWishlist = wishlist.has(key);

        try {
            if (isCurrentlyInWishlist) {
                // Need to get the item ID first, then remove
                const listResponse = await fetch(`${API_URL}/wishlist`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const listData = await listResponse.json();
                const item = listData.items?.find(i => i.title === product.title && i.seller === product.seller);

                if (item) {
                    await fetch(`${API_URL}/wishlist/${item._id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                setWishlist(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(key);
                    return newSet;
                });
            } else {
                // Fetch sellers from API before adding to wishlist
                let productSellers = [];
                try {
                    const timestamp = Date.now();
                    let apiUrl;

                    if (product.productId && product.productId !== 'undefined' && product.productId !== '') {
                        apiUrl = `${API_URL}/products/${product.productId}/sellers?t=${timestamp}`;
                    } else {
                        const params = new URLSearchParams({
                            t: timestamp,
                            seller: product.seller || '',
                            link: product.link || '',
                            price: product.extractedPrice || 0,
                            delivery: product.delivery || '',
                            title: product.title || ''
                        });
                        apiUrl = `${API_URL}/products/undefined/sellers?${params.toString()}`;
                    }

                    const sellersResponse = await fetch(apiUrl, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const sellersData = await sellersResponse.json();

                    if (sellersData.success) {
                        productSellers = sellersData.sellers || [];
                    }
                } catch (err) {
                    console.error('Error fetching sellers for wishlist:', err);
                }

                // Add to wishlist with sellers
                await fetch(`${API_URL}/wishlist`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        product: {
                            ...product,
                            sellers: productSellers
                        }
                    })
                });

                setWishlist(prev => new Set(prev).add(key));
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        }
    };

    // Fetch wishlist on component mount
    useEffect(() => {
        fetchWishlist();
    }, []);

    // Filter products by price range
    const filteredProducts = products.filter(product => {
        const price = product.extractedPrice || 0;
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        return price >= min && price <= max;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return (a.extractedPrice || 0) - (b.extractedPrice || 0);
            case 'price-high':
                return (b.extractedPrice || 0) - (a.extractedPrice || 0);
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            default:
                return 0;
        }
    });

    return (
        <div className="products-page">
            {/* Header */}
            <header className="products-header">
                <div className="header-brand" onClick={() => navigate('/dashboard')}>
                    <img src="/logo/Logo.webp" alt="PriceWatch" className="brand-logo" />
                </div>

                <form className="header-search" onSubmit={handleSearch}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                <div className="location-indicator" title={`Searching in: ${userLocation}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{locationLoading ? 'Detecting...' : userLocation.split(',')[0]}</span>
                </div>

                <div className="header-actions">
                    {user ? (
                        <>
                            <NotificationDropdown />
                            <button className="wishlist-nav-btn" onClick={() => navigate('/wishlist')} title="My Wishlist">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                <span className="wishlist-badge">{wishlist.size}</span>
                            </button>
                        </>
                    ) : null}

                    {user ? (
                        <div className="user-profile-section">
                            <div className="user-avatar-small" title={user.name || 'User'}>
                                {getInitials(user.name)}
                            </div>
                            <button className="logout-btn-small" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons-small">
                            <button className="auth-btn-small login" onClick={() => navigate('/login')}>
                                Login
                            </button>
                            <button className="auth-btn-small signup" onClick={() => navigate('/signup')}>
                                Sign Up
                            </button>
                        </div>
                    )}

                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="products-layout">
                {/* Left Sidebar - Filters */}
                <aside className="filters-sidebar">
                    <h3 className="sidebar-title">Refine results</h3>

                    <div className="filter-section">
                        <h4 className="filter-heading">Sort by</h4>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    name="sort"
                                    checked={sortBy === 'relevance'}
                                    onChange={() => setSortBy('relevance')}
                                />
                                <span>Relevance</span>
                            </label>
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    name="sort"
                                    checked={sortBy === 'price-low'}
                                    onChange={() => setSortBy('price-low')}
                                />
                                <span>Price: low to high</span>
                            </label>
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    name="sort"
                                    checked={sortBy === 'price-high'}
                                    onChange={() => setSortBy('price-high')}
                                />
                                <span>Price: high to low</span>
                            </label>
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    name="sort"
                                    checked={sortBy === 'rating'}
                                    onChange={() => setSortBy('rating')}
                                />
                                <span>Rating: high to low</span>
                            </label>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h4 className="filter-heading">Price Range</h4>
                        <div className="price-range-inputs">
                            <div className="price-input-group">
                                <span className="price-currency">₹</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="price-input"
                                />
                            </div>
                            <span className="price-separator">to</span>
                            <div className="price-input-group">
                                <span className="price-currency">₹</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="price-input"
                                />
                            </div>
                        </div>
                        {(minPrice || maxPrice) && (
                            <button
                                className="clear-price-btn"
                                onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                            >
                                Clear price filter
                            </button>
                        )}
                    </div>
                </aside>

                {/* Products Grid */}
                <main className="products-main">
                    {/* Results Info */}
                    <div className="results-info-bar">
                        <span className="results-count">
                            {loading ? 'Searching...' : (
                                <>
                                    {sortedProducts.length} results
                                    {(minPrice || maxPrice) && ` (filtered from ${products.length})`}
                                </>
                            )}
                            {cached && <span className="cache-badge"> • Cached ({cacheAge})</span>}
                        </span>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p className="loading-text">Searching across stores...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="empty-state">
                            <h2>Something went wrong</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && products.length === 0 && searchParams.get('q') && (
                        <div className="empty-state">
                            <h2>No products found</h2>
                            <p>Try searching with different keywords</p>
                        </div>
                    )}

                    {/* Products Grid */}
                    {!loading && sortedProducts.length > 0 && (
                        <div className="products-grid">
                            {sortedProducts.map((product, index) => (
                                <div
                                    key={product.productId || index}
                                    className={`product-card ${selectedProduct?.productId === product.productId ? 'selected' : ''}`}
                                    onClick={() => handleProductClick(product)}
                                >
                                    <div className="product-image">
                                        <img
                                            src={product.thumbnail}
                                            alt={product.title}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                                            }}
                                        />
                                    </div>
                                    <button
                                        className={`wishlist-btn ${isInWishlist(product) ? 'active' : ''}`}
                                        onClick={(e) => toggleWishlist(e, product)}
                                        title={isInWishlist(product) ? 'Remove from wishlist' : 'Add to wishlist'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isInWishlist(product) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>
                                    <div className="product-info">
                                        <h3 className="product-title">{product.title}</h3>
                                        <p className="product-price">{formatPrice(product.price, product.extractedPrice)}</p>
                                        {product.originalPrice && product.extractedOriginalPrice > product.extractedPrice && (
                                            <p className="product-original-price">
                                                <span className="strikethrough">₹{product.extractedOriginalPrice?.toLocaleString('en-IN')}</span>
                                                <span className="discount-text">
                                                    {Math.round(((product.extractedOriginalPrice - product.extractedPrice) / product.extractedOriginalPrice) * 100)}% off
                                                </span>
                                            </p>
                                        )}
                                        <p className="product-seller">
                                            {getSellerIcon(product.seller) ? (
                                                <img
                                                    src={getSellerIcon(product.seller)}
                                                    alt=""
                                                    className="seller-logo"
                                                />
                                            ) : (
                                                <span className="seller-icon">🏪</span>
                                            )}
                                            {product.seller || 'Multiple sellers'}
                                            {product.offers && ` & more`}
                                        </p>
                                        {product.delivery && (
                                            <p className="product-delivery">{product.delivery}</p>
                                        )}
                                        {product.rating && (
                                            <div className="product-rating">
                                                <span className="rating-value">{product.rating}</span>
                                                <span className="rating-star">★</span>
                                                {product.reviews && (
                                                    <span className="rating-count">({product.reviews.toLocaleString()})</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Right Sidebar - Product Details */}
                {selectedProduct && (
                    <aside className="product-detail-panel">
                        <div className="panel-header">
                            <button className="panel-action-btn" title="Share">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                            </button>
                            <button className="panel-action-btn" title="More options">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                </svg>
                            </button>
                            <button className="panel-close-btn" onClick={closeProductPanel} title="Close">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="panel-content">
                            {/* Product Images */}
                            <div className="panel-images">
                                <img
                                    src={selectedProduct.thumbnail}
                                    alt={selectedProduct.title}
                                    className="panel-main-image"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                                    }}
                                />
                            </div>

                            {/* Product Title */}
                            <h2 className="panel-title">{selectedProduct.title}</h2>

                            {/* Price Range */}
                            <div className="panel-price-range">
                                <span className="price-icon">↗</span>
                                <span className="price-text">
                                    Typically {formatPrice(selectedProduct.price, selectedProduct.extractedPrice)}
                                </span>
                            </div>

                            {/* Sellers List */}
                            <div className="panel-sellers">
                                <h3 className="sellers-title">Buy from</h3>

                                {loadingSellers && (
                                    <div className="sellers-loading">
                                        <div className="mini-spinner"></div>
                                        <span>Finding best sellers...</span>
                                    </div>
                                )}

                                {/* Show sellers from API (these have direct links) */}
                                {!loadingSellers && sellers.length > 0 && (
                                    <>
                                        {sellers.map((seller, idx) => (
                                            <a
                                                key={idx}
                                                href={seller.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`seller-card ${idx === 0 ? 'main-seller' : ''}`}
                                            >
                                                <div className="seller-info">
                                                    {seller.logo ? (
                                                        <img src={seller.logo} alt={seller.name} className="seller-logo-img" />
                                                    ) : (
                                                        <span className="seller-logo-fallback">{seller.name?.charAt(0).toUpperCase() || 'S'}</span>
                                                    )}
                                                    <div className="seller-details">
                                                        <span className="seller-name">{seller.name}</span>
                                                        {seller.delivery && (
                                                            <span className="seller-delivery">{seller.delivery}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="seller-price">
                                                    {seller.price > 0 ? `₹${seller.price.toLocaleString('en-IN')}` : 'Price on site'}
                                                </span>
                                            </a>
                                        ))}
                                    </>
                                )}

                                {/* Fallback: Show main seller ONLY if it has a direct link (not Google Shopping) AND no API sellers */}
                                {!loadingSellers && sellers.length === 0 && !isGoogleShoppingLink(getDirectSellerLink(selectedProduct)) && (
                                    <a
                                        href={getDirectSellerLink(selectedProduct)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="seller-card main-seller"
                                    >
                                        <div className="seller-info">
                                            <span className="seller-logo-fallback">{selectedProduct.seller?.charAt(0).toUpperCase() || 'S'}</span>
                                            <div className="seller-details">
                                                <span className="seller-name">{selectedProduct.seller || 'View Deal'}</span>
                                                {selectedProduct.delivery && (
                                                    <span className="seller-delivery">{selectedProduct.delivery}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="seller-price">
                                            {formatPrice(selectedProduct.price, selectedProduct.extractedPrice)}
                                        </span>
                                    </a>
                                )}

                                {/* No direct sellers available */}
                                {!loadingSellers && sellers.length === 0 && isGoogleShoppingLink(getDirectSellerLink(selectedProduct)) && (
                                    <div className="no-direct-sellers">
                                        <p>No direct seller links available for this product.</p>
                                        <p className="hint">This product may only be available through price comparison.</p>
                                    </div>
                                )}
                            </div>

                            {/* Price History Chart */}
                            <PriceHistoryChart
                                productId={selectedProduct.productId}
                                productTitle={selectedProduct.title}
                            />
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

export default Products;


import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const API_URL = 'http://localhost:3000/api';

// Color palette for multiple sellers
const SELLER_COLORS = [
    '#8b5cf6', // Purple
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
];

function PriceHistoryChart({ productId, productTitle }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [priceData, setPriceData] = useState(null);
    const [selectedSellers, setSelectedSellers] = useState(new Set());

    useEffect(() => {
        if (productId && productId !== 'undefined') {
            fetchPriceHistory();
        } else {
            setLoading(false);
            setError('No price history available for this product');
        }
    }, [productId]);

    const fetchPriceHistory = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/products/${productId}/price-history`);
            const data = await response.json();

            if (data.success) {
                setPriceData(data);
                // Select all sellers by default
                if (data.sellers && data.sellers.length > 0) {
                    setSelectedSellers(new Set(data.sellers.map(s => s.sellerId || 'unknown')));
                }
            } else {
                setError(data.message || 'Failed to fetch price history');
            }
        } catch (err) {
            setError('Error loading price history');
            console.error('Price history error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSeller = (sellerId) => {
        setSelectedSellers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sellerId)) {
                newSet.delete(sellerId);
            } else {
                newSet.add(sellerId);
            }
            return newSet;
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    };

    const formatPrice = (price) => {
        return `₹${price?.toLocaleString('en-IN') || 0}`;
    };

    const formatFirstSeen = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Transform data for Recharts - create unified timeline
    const getChartData = () => {
        if (!priceData?.history) return [];

        const timelineMap = new Map();

        priceData.history.forEach((sellerData, idx) => {
            const sellerId = sellerData.sellerId || 'unknown';
            if (!selectedSellers.has(sellerId)) return;

            sellerData.prices.forEach(priceEntry => {
                const dateKey = new Date(priceEntry.recordedAt).toISOString();

                if (!timelineMap.has(dateKey)) {
                    timelineMap.set(dateKey, {
                        date: priceEntry.recordedAt,
                        displayDate: formatDate(priceEntry.recordedAt)
                    });
                }

                timelineMap.get(dateKey)[`seller_${idx}`] = priceEntry.price;
                timelineMap.get(dateKey)[`sellerName_${idx}`] = sellerData.sellerName;
            });
        });

        return Array.from(timelineMap.values()).sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );
    };

    const chartData = getChartData();

    // Render loading state
    if (loading) {
        return (
            <div className="price-history-chart loading">
                <div className="chart-header">
                    <h4>📈 Price History</h4>
                </div>
                <div className="chart-loading">
                    <div className="mini-spinner"></div>
                    <span>Loading price history...</span>
                </div>
            </div>
        );
    }

    // Render error or no data state
    if (error || !priceData || priceData.history?.length === 0) {
        return (
            <div className="price-history-chart empty">
                <div className="chart-header">
                    <h4>📈 Price History</h4>
                </div>
                <div className="chart-empty">
                    <span className="empty-icon">📊</span>
                    <p>{error || 'No price history yet'}</p>
                    {priceData?.firstSeen && (
                        <p className="tracking-since">
                            Tracking price since {formatFirstSeen(priceData.firstSeen)}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="price-history-chart">
            <div className="chart-header">
                <h4>📈 Price History</h4>
                <span className="data-points">{priceData.totalDataPoints} data points</span>
            </div>

            {/* Tracking since message for short history */}
            {priceData.totalDataPoints < 5 && (
                <div className="tracking-notice">
                    <span>🕐</span>
                    Tracking price since {formatFirstSeen(priceData.firstSeen)}
                </div>
            )}

            {/* Seller filter toggles */}
            {priceData.sellers && priceData.sellers.length > 1 && (
                <div className="seller-filters">
                    {priceData.sellers.map((seller, idx) => (
                        <button
                            key={seller.sellerId || idx}
                            className={`seller-toggle ${selectedSellers.has(seller.sellerId || 'unknown') ? 'active' : ''}`}
                            onClick={() => toggleSeller(seller.sellerId || 'unknown')}
                            style={{
                                '--seller-color': SELLER_COLORS[idx % SELLER_COLORS.length]
                            }}
                        >
                            <span className="seller-color-dot"></span>
                            {seller.sellerName}
                        </button>
                    ))}
                </div>
            )}

            {/* Price stats */}
            <div className="price-stats">
                {priceData.sellers?.slice(0, 3).map((seller, idx) => (
                    <div key={seller.sellerId || idx} className="stat-item">
                        <span className="stat-seller">{seller.sellerName}</span>
                        <div className="stat-prices">
                            <span className="stat-current">
                                Current: {formatPrice(seller.latestPrice)}
                            </span>
                            <span className="stat-range">
                                Low: {formatPrice(seller.lowestPrice)} / High: {formatPrice(seller.highestPrice)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="displayDate"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                            width={50}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(30, 30, 45, 0.95)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            formatter={(value, name) => [formatPrice(value), priceData.history?.[parseInt(name.split('_')[1])]?.sellerName || 'Price']}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        {priceData.history?.map((sellerData, idx) => {
                            const sellerId = sellerData.sellerId || 'unknown';
                            if (!selectedSellers.has(sellerId)) return null;

                            return (
                                <Line
                                    key={sellerId}
                                    type="monotone"
                                    dataKey={`seller_${idx}`}
                                    name={`seller_${idx}`}
                                    stroke={SELLER_COLORS[idx % SELLER_COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ fill: SELLER_COLORS[idx % SELLER_COLORS.length], r: 3 }}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend for single seller or when all selected */}
            {priceData.sellers?.length === 1 && (
                <div className="chart-legend-single">
                    <span
                        className="legend-dot"
                        style={{ backgroundColor: SELLER_COLORS[0] }}
                    ></span>
                    {priceData.sellers[0].sellerName}
                </div>
            )}
        </div>
    );
}

export default PriceHistoryChart;

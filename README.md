<p align="center">
  <img src="Frontend/Logo/Logo.webp" alt="PriceWatch Logo" width="150" height="150">
</p>

<h1 align="center">🏷️ PriceWatch</h1>

<p align="center">
  <strong>Smart Price Comparison & Tracking Platform</strong>
</p>

<p align="center">
  Compare prices across 50+ stores instantly. Track price drops in real-time. Save money on every purchase.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-endpoints">API</a> •
  <a href="#screenshots">Screenshots</a>
</p>

---

## ✨ Features

### 🔍 **Smart Product Search**
- Search for any product across 50+ e-commerce platforms
- Location-based search results for accurate local pricing
- Intelligent caching system for faster repeat searches

### 💰 **Price Comparison**
- Real-time price comparison from multiple sellers
- See all available sellers for each product with direct purchase links
- Compare prices from Amazon, Flipkart, Croma, Reliance Digital, and more

### 📊 **Price History & Analytics**
- Track historical price trends with interactive charts
- View price history per seller for informed buying decisions
- Identify the best time to buy based on historical data

### 🔔 **Real-Time Price Drop Alerts**
- Get instant notifications when prices drop on wishlist items
- WebSocket-powered real-time alerts
- Automated scheduled price checking (daily at 9 AM)

### ❤️ **Wishlist Management**
- Save products to your personal wishlist
- Track multiple products simultaneously
- Automatic price monitoring for all wishlist items

### 🔐 **User Authentication**
- Secure JWT-based authentication
- User registration and login
- Personalized experience with user-specific features

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI Library |
| [Vite](https://vitejs.dev/) | Build Tool & Dev Server |
| [React Router DOM](https://reactrouter.com/) | Client-side Routing |
| [Three.js](https://threejs.org/) & [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | 3D Interactive Background |
| [Recharts](https://recharts.org/) | Price History Charts |
| [Socket.io Client](https://socket.io/) | Real-time Notifications |

### **Backend**
| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) | Runtime Environment |
| [Express 5](https://expressjs.com/) | Web Framework |
| [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/) | Database & ODM |
| [Socket.io](https://socket.io/) | WebSocket Server |
| [JWT](https://jwt.io/) | Authentication |
| [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Password Hashing |
| [node-cron](https://www.npmjs.com/package/node-cron) | Scheduled Price Checking |
| [SearchAPI.io](https://www.searchapi.io/) | Product Search API |

---

## 📁 Project Structure

```
PriceWatch/
├── Backend/
│   ├── controllers/
│   │   ├── product_controller.js    # Product search & price history
│   │   ├── user_login_signup.js     # Authentication logic
│   │   ├── wishlist_controller.js   # Wishlist CRUD operations
│   │   └── notification_controller.js
│   ├── models/
│   │   ├── user_model.js            # User schema
│   │   ├── product.js               # Product schema
│   │   ├── product_search.js        # Cached searches
│   │   ├── product_sellers.js       # Seller data cache
│   │   ├── price_history.js         # Historical price data
│   │   ├── wishlist.js              # User wishlists
│   │   ├── price_alert.js           # Price alert records
│   │   └── seller.js                # Seller information
│   ├── routes/
│   │   ├── product.js               # Product routes
│   │   ├── user.js                  # Auth routes
│   │   ├── wishlist.js              # Wishlist routes
│   │   └── notification.js          # Notification routes
│   ├── services/
│   │   ├── price_checker.js         # Scheduled price monitoring
│   │   └── socket_handler.js        # WebSocket event handling
│   ├── middleware/
│   │   └── auth.js                  # JWT middleware
│   ├── server.js                    # Express + Socket.io server
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ThreeBackground.jsx      # 3D animated background
│   │   │   ├── PriceHistoryChart.jsx    # Price trend charts
│   │   │   ├── NotificationDropdown.jsx # Notification UI
│   │   │   ├── PriceDropNotification.jsx # Real-time toast alerts
│   │   │   └── AuthRequiredPopup.jsx    # Auth modal
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Home page with search
│   │   │   ├── Products.jsx         # Search results & comparison
│   │   │   ├── Wishlist.jsx         # User's saved products
│   │   │   ├── Login.jsx            # Login page
│   │   │   └── Signup.jsx           # Registration page
│   │   ├── styles/                  # CSS stylesheets
│   │   ├── context/                 # React context providers
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                 # Entry point
│   ├── Logo/                        # Brand assets
│   ├── Seller_icon/                 # Seller platform icons
│   └── package.json
│
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **SearchAPI.io API Key** ([Get one here](https://www.searchapi.io/))

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/PriceWatch.git
cd PriceWatch
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Create environment file
touch .env
```

Add the following to your `.env` file:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pricewatch
JWT_SECRET=your_super_secret_jwt_key_here
SEARCHAPI_KEY=your_searchapi_io_api_key_here
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../Frontend

# Install dependencies
npm install
```

### Step 4: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Or start manually
mongod --dbpath /path/to/your/data/directory
```

### Step 5: Run the Application

**Terminal 1 - Start Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd Frontend
npm run dev
```

### Step 6: Open in Browser

Navigate to `http://localhost:5173` in your browser.

---

## 📖 Usage

### Searching for Products

1. Enter a product name in the search bar on the Dashboard
2. View results from multiple sellers with prices
3. Click on a product to see seller options and price history

### Adding to Wishlist

1. Create an account or log in
2. Click the heart icon on any product card
3. Access your wishlist from the navigation bar

### Receiving Price Alerts

1. Add products to your wishlist
2. Price checks run automatically every day at 9 AM
3. Receive real-time notifications when prices drop

### Viewing Price History

1. Click on any product card
2. Select a seller to view their price history chart
3. Analyze trends to find the best buying opportunity

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/signup` | Register new user |
| `POST` | `/api/users/login` | User login |
| `GET` | `/api/users/me` | Get current user (auth required) |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/search?q={query}` | Search products |
| `GET` | `/api/products/cached` | Get cached searches |
| `GET` | `/api/products/:id/sellers` | Get sellers for a product |
| `GET` | `/api/products/:id/price-history` | Get price history |

### Wishlist

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wishlist` | Get user's wishlist |
| `POST` | `/api/wishlist` | Add product to wishlist |
| `DELETE` | `/api/wishlist/:itemId` | Remove from wishlist |
| `POST` | `/api/wishlist/check` | Check if product is in wishlist |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get user notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/trigger-price-check` | Manually trigger price check |
| `GET` | `/api/admin/price-check-status` | Get price checker status |

---

## 🔄 Real-Time Features

PriceWatch uses Socket.io for real-time functionality:

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client → Server | Authenticate and join user's room |
| `leave-room` | Client → Server | Leave room on logout |
| `price-drop` | Server → Client | Price drop notification |
| `price-check-status` | Server → Client | Price check progress updates |
| `joined` | Server → Client | Confirmation of room join |

### Connecting to WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
    withCredentials: true
});

// Join authenticated room
socket.emit('join-room', { token: 'your-jwt-token' });

// Listen for price drops
socket.on('price-drop', (data) => {
    console.log('Price dropped!', data);
});
```

---

## 🎨 Design Features

- **Interactive 3D Background** - Powered by Three.js
- **Modern Glassmorphism UI** - Sleek, modern design
- **Responsive Layout** - Works on all device sizes
- **Dark Theme** - Easy on the eyes
- **Smooth Animations** - Enhanced user experience
- **Platform-specific Seller Icons** - Recognizable retailer branding

---

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

### Product Model
```javascript
{
  title: String,
  googleProductId: String,
  thumbnail: String,
  lastScraped: Date,
  sellers: [{ name, price, link }]
}
```

### Wishlist Model
```javascript
{
  user: ObjectId (ref: User),
  items: [{
    productId: String,
    title: String,
    price: String,
    extractedPrice: Number,
    thumbnail: String,
    seller: String,
    link: String
  }]
}
```

### Price History Model
```javascript
{
  product: ObjectId (ref: Product),
  seller: ObjectId (ref: Seller),
  price: Number,
  currency: String,
  recordedAt: Date
}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/pricewatch` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `SEARCHAPI_KEY` | SearchAPI.io API key | Required |

### Scheduled Tasks

- **Daily Price Check**: Runs every day at 9:00 AM
- Checks prices for all products in all user wishlists
- Sends real-time notifications for price drops

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgements

- [SearchAPI.io](https://www.searchapi.io/) for product search API
- [Three.js](https://threejs.org/) for 3D graphics
- [Recharts](https://recharts.org/) for beautiful charts
- [Socket.io](https://socket.io/) for real-time communication

---

<p align="center">
  Made with ❤️ by Ritesh Jadhav
</p>

<p align="center">
  <a href="#-pricewatch">⬆️ Back to Top</a>
</p>

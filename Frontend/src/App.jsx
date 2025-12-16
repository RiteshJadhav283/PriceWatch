import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Wishlist from './pages/Wishlist';
import PriceDropNotification from './components/PriceDropNotification';

function App() {
  return (
    <>
      {/* Global price drop notification toast */}
      <PriceDropNotification />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Routes>
    </>
  );
}

export default App;


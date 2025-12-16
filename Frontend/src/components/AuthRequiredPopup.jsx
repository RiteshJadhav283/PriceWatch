import { useNavigate } from 'react-router-dom';
import './AuthRequiredPopup.css';

/**
 * Popup shown when non-logged-in user tries to access protected features
 */
function AuthRequiredPopup({ isOpen, onClose, feature = 'this feature' }) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleLogin = () => {
        onClose();
        navigate('/login');
    };

    const handleSignup = () => {
        onClose();
        navigate('/signup');
    };

    return (
        <div className="auth-popup-overlay" onClick={onClose}>
            <div className="auth-popup" onClick={(e) => e.stopPropagation()}>
                <div className="popup-icon">🔐</div>

                <h3>Login Required</h3>

                <p className="popup-message">
                    To use {feature}, you need to be logged in.
                </p>

                <div className="popup-buttons">
                    <button className="popup-btn login-btn" onClick={handleLogin}>
                        Login
                    </button>
                    <button className="popup-btn signup-btn" onClick={handleSignup}>
                        Sign Up
                    </button>
                </div>

                <button className="continue-btn" onClick={onClose}>
                    Continue without logging in
                </button>
            </div>
        </div>
    );
}

export default AuthRequiredPopup;

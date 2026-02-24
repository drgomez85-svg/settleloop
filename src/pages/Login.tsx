import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import '../styles/global.css';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [cardNumber, setCardNumber] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as XXXX XXXX XXXX XXXX
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || digits;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cardNumber.trim() || !password.trim() || !userName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // In demo mode, any card number and password works
    login(cardNumber, password, userName);
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-lg)',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '700',
              margin: '0 auto var(--spacing-md)',
            }}
          >
            🏦
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
            Simplii Financial
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <form onSubmit={handleSubmit}>
            {/* Card Number */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--color-text)',
                }}
              >
                Card Number
              </label>
              <input
                type="text"
                className="input"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
                style={{
                  fontSize: '1.125rem',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                }}
                required
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--color-text)',
                }}
              >
                Password
              </label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  fontSize: '1rem',
                }}
                required
              />
            </div>

            {/* Name */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--color-text)',
                }}
              >
                Your Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{
                  fontSize: '1rem',
                }}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  marginBottom: 'var(--spacing-md)',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            {/* Demo Notice */}
            <div
              style={{
                padding: 'var(--spacing-sm)',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                color: 'var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                marginBottom: 'var(--spacing-lg)',
                textAlign: 'center',
              }}
            >
              💡 Demo Mode: Any card number and password will work
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                fontSize: '1rem',
                fontWeight: '600',
              }}
            >
              Sign In
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: 'var(--spacing-xl)',
              paddingTop: 'var(--spacing-lg)',
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              🔒 Secure login • Protected by 256-bit encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

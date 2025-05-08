import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-page">
        <div className="auth-header">
          <h1>Check Your Email 📧</h1>
          <p>Password reset instructions have been sent</p>
        </div>
        
        <div className="auth-container">
          <div className="auth-card">
            <div className="success-message">
              <span className="success-icon">✅</span>
              We've sent a password reset link to: {email}
            </div>
            <div className="reset-instructions">
              <p>Please check your email and follow the instructions to reset your password.</p>
              <p>The link will expire in 1 hour for security reasons.</p>
            </div>
            <div className="auth-footer">
              <p>
                Didn't receive the email? <button onClick={() => setIsSubmitted(false)} className="resend-button">Try again</button>
              </p>
              <p className="mt-4">
                Remember your password? <Link to="/login">Back to login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-header">
        <h1>Reset Your Password 🔐</h1>
        <p>Enter your email to receive reset instructions</p>
      </div>
      
      <div className="auth-container">
        <div className="auth-card">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-container">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                <span className="loading-spinner">Sending Reset Link...</span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Remember your password? <Link to="/login">Back to login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

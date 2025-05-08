import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

interface LocationState {
  mfaSessionToken?: string;
  email?: string;
  returnPath?: string;
  fromVerificationPage?: boolean;
}

const MFAVerification: React.FC = () => {
  const [mfaToken, setMfaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  // Get MFA session token from location state or localStorage
  const [mfaSessionToken, setMfaSessionToken] = useState<string | null>(
    state?.mfaSessionToken || localStorage.getItem('mfa_session_token')
  );
  
  // Get user email for display
  const [email, setEmail] = useState<string | null>(
    state?.email || localStorage.getItem('mfa_pending_email')
  );
  
  // Store return path if provided
  const [returnPath, setReturnPath] = useState<string | null>(
    state?.returnPath || localStorage.getItem('verification_return_path') || '/dashboard'
  );

  useEffect(() => {
    document.title = 'DocuDino | Verify MFA';
    
    // If we have session token from navigation state, save it to localStorage
    if (state?.mfaSessionToken) {
      localStorage.setItem('mfa_session_token', state.mfaSessionToken);
      setMfaSessionToken(state.mfaSessionToken);
    }
    
    // If we have email from navigation state, save it to localStorage
    if (state?.email) {
      localStorage.setItem('mfa_pending_email', state.email);
      setEmail(state.email);
    }
    
    // If we have return path, save it to localStorage
    if (state?.returnPath) {
      localStorage.setItem('verification_return_path', state.returnPath);
      setReturnPath(state.returnPath);
      
      // If coming from verification page, save that info
      if (state.fromVerificationPage) {
        localStorage.setItem('verification_pending', 'true');
      }
    }
    
    // If we don't have MFA session token, redirect back to login
    if (!mfaSessionToken && !state?.mfaSessionToken) {
      console.error('No MFA session token found. Redirecting to login.');
      navigate('/login');
    }
    
    return () => {
      document.title = 'DocuDino';
    };
  }, [state, mfaSessionToken, navigate]);

  const handleVerifyMFA = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!mfaToken) {
        setError('Please enter your verification code');
        setLoading(false);
        return;
      }
      
      if (!mfaSessionToken) {
        setError('MFA session expired. Please log in again.');
        navigate('/login');
        return;
      }
      
      console.log('Verifying MFA code...');
      const response = await authApi.verifyMFA({ 
        mfa_session_token: mfaSessionToken, 
        token: mfaToken 
      });
      
      if (response.success && response.token) {
        // Store the new auth token
        localStorage.setItem('token', response.token);
        
        // IMPORTANT: Store the MFA token for document verification
        localStorage.setItem('mfa_token', mfaToken);
        
        // Clean up MFA session data
        localStorage.removeItem('mfa_session_token');
        localStorage.removeItem('mfa_pending_email');
        
        console.log('MFA verification successful');
        
        // Check if we need to return to verification page
        const isPendingVerification = localStorage.getItem('verification_pending') === 'true';
        
        if (isPendingVerification && returnPath) {
          // Clear verification pending flag
          localStorage.removeItem('verification_pending');
          localStorage.removeItem('verification_return_path');
          
          console.log('Redirecting back to verification page:', returnPath);
          navigate(returnPath);
        } else {
          // Default navigation to dashboard
          navigate('/dashboard');
        }
      } else {
        setError('MFA verification failed. Please try again.');
      }
    } catch (err) {
      console.error('MFA verification error:', err);
      setError('Failed to verify MFA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        <h1>Two-Factor Authentication</h1>
        <p>Enter the code from your authenticator app</p>
        {email && <p className="email-display">For account: <strong>{email}</strong></p>}
      </div>

      <div className="auth-container">
        <div className="auth-card animate-scale-in">
          {error && (
            <div className="error-message">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-icon">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#f87171" strokeWidth="2"/>
                <path d="M12 8V12" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 16H12.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="mfaToken">MFA Verification Code</label>
            <div className="input-container">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="input-icon">
                <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7Z" stroke="currentColor" strokeWidth="2" />
                <path d="M7 15L10 12L7 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                id="mfaToken"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                placeholder="Enter your 6-digit code"
                className="auth-form-input"
                maxLength={6}
                autoFocus
                required
                disabled={loading}
              />
            </div>
            <p className="form-hint">Enter the 6-digit code from your authenticator app</p>
          </div>

          <button
            onClick={handleVerifyMFA}
            disabled={loading || mfaToken.length < 6}
            className="auth-button btn-shimmer"
          >
            {loading ? (
              <span className="loading-spinner">
                <span className="spinner"></span> Verifying...
              </span>
            ) : (
              'Verify'
            )}
          </button>
          
          <div className="auth-footer">
            <button 
              onClick={() => navigate('/login')} 
              className="text-button"
              disabled={loading}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
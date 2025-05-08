import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const MFASetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaSetupData, setMfaSetupData] = useState<{secret: string; qr_code: string} | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'DocuDino | MFA Setup';
    setupMFA();
    
    return () => {
      document.title = 'DocuDino';
    };
  }, []);
  
  const setupMFA = async () => {
    try {
      setLoading(true);
      setError('');
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication token missing. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('Setting up MFA with token available');
      const response = await authApi.setupMFA();
      console.log('MFA setup response:', response);
      setMfaSetupData(response);
    } catch (err) {
      console.error('MFA setup error:', err);
      setError('Failed to set up MFA. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Verifying MFA code...');
      // For MFA setup, there's no session token as this is during initial setup
      // We need to use a different API endpoint or parameter structure
      
      // Call the API with required parameters
      const response = await authApi.verifyMFA({
        mfa_session_token: 'setup',  // Special value to indicate setup mode
        token: verificationCode
      });
      
      // Store the MFA token for document verification
      localStorage.setItem('mfa_token', verificationCode);
      
      console.log('MFA verification successful');
      navigate('/dashboard');
    } catch (err) {
      console.error('MFA verification error:', err);
      setError('Failed to verify MFA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipMFASetup = () => {
    console.log('User skipped MFA setup');
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        <h1>Setup Two-Factor Authentication</h1>
        <p>Enhance your account security with MFA</p>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {loading && !mfaSetupData ? (
            <div className="loading-container">
              <span className="loading-spinner"></span>
              <p>Setting up MFA...</p>
            </div>
          ) : mfaSetupData ? (
            <div className="mfa-setup">
              <h3>Scan QR Code</h3>
              <p>Use an authenticator app like Google Authenticator or Authy to scan this QR code:</p>
              
              <img 
                src={`data:image/png;base64,${mfaSetupData.qr_code}`} 
                alt="MFA QR Code" 
                className="qr-code"
              />
              
              <p className="mfa-manual-code">
                <strong>Or enter this code manually:</strong> {mfaSetupData.secret}
              </p>
              
              <div className="verification-form">
                <p>Enter the verification code from your authenticator app:</p>
                
                <div className="form-group">
                  <div className="input-container">
                    <span className="input-icon">🔐</span>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit verification code"
                      required
                    />
                  </div>
                </div>
                
                <div className="button-group">
                  <button 
                    onClick={handleVerifyMFA} 
                    disabled={loading || verificationCode.length < 6} 
                    className="auth-button"
                  >
                    {loading ? 'Verifying...' : 'Verify & Complete Setup'}
                  </button>
                  
                  <button 
                    onClick={skipMFASetup} 
                    className="auth-button secondary"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mfa-error">
              <p>Unable to set up MFA. Please try again or contact support.</p>
              <button onClick={setupMFA} className="auth-button">
                Retry Setup
              </button>
              <button onClick={skipMFASetup} className="auth-button secondary">
                Skip for Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MFASetup;
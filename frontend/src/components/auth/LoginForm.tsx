import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  useEffect(() => {
    document.title = 'DocuDino | Login';
    return () => {
      document.title = 'DocuDino';
    };
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuth();

  // Clear any existing auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  // Debug effect to check when errors are set
  useEffect(() => {
    if (error) {
      console.log('[LoginForm] Local error state set:', error);
      // Force error to be visible by scrolling to it
      const errorElement = document.querySelector('.error-message');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    if (authError) {
      console.log('[LoginForm] Auth context error state set:', authError);
    }
  }, [error, authError]);
  
  // Set up a processing message timer for slow responses
  useEffect(() => {
    let messageTimer: number | ReturnType<typeof setTimeout>;
    
    if (loading) {
      // Initially show simple "Signing in" message
      setProcessingMessage('Signing in...');
      
      // After 5 seconds, update to let the user know it's taking longer
      messageTimer = setTimeout(() => {
        setProcessingMessage('This is taking longer than usual. Please wait...');
      }, 5000);
      
      // After 15 seconds, update again
      const longWaitTimer = setTimeout(() => {
        setProcessingMessage('Still working on it. The server might be busy...');
      }, 15000);
      
      return () => {
        clearTimeout(messageTimer);
        clearTimeout(longWaitTimer);
      };
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    clearError(); // Clear any existing auth context errors
    
    // Basic form validation
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    
    // Record start time to enforce minimum loading duration
    const startTime = Date.now();
    const minLoadingTime = 1500; // 1.5 seconds minimum loading time
    
    // Set a timeout to force reset loading state in case of hanging requests
    const loadingTimeoutId = setTimeout(() => {
      console.log('[LoginForm] Force resetting loading state after timeout');
      setLoading(false);
      setProcessingMessage('');
      setError('Login request timed out. Please try again.');
    }, 15000); // 15 second timeout
    
    try {
      console.log('[LoginForm] Starting login attempt for:', email);
      
      // Try to login
      let response;
      try {
        response = await login(email, password);
        console.log('[LoginForm] Login response received:', response);
      } catch (apiError: any) {
        console.error('[LoginForm] API error during login:', apiError);
        
        // Extract the error message
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (apiError.response) {
          // Server responded with an error status
          if (apiError.response.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (apiError.response.status === 403) {
            errorMessage = apiError.response.data?.error || 'Access denied.';
          } else if (apiError.response.data?.error) {
            errorMessage = apiError.response.data.error;
          } else if (apiError.response.data?.message) {
            errorMessage = apiError.response.data.message;
          }
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
        
        // Wait for minimum loading time before showing error
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }
        
        // Set error and update loading state
        setError(errorMessage);
        setLoading(false);
        setProcessingMessage('');
        // Clear the timeout since we've handled the error
        clearTimeout(loadingTimeoutId);
        return;
      }
      
      // If we reach here, login was successful
      
      // Calculate how long we've been in the loading state
      const elapsedTime = Date.now() - startTime;
      
      // If we need to wait longer to meet the minimum loading time
      if (elapsedTime < minLoadingTime) {
        console.log(`[LoginForm] Enforcing minimum loading time, waiting ${minLoadingTime - elapsedTime}ms`);
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      // Check if MFA is required
      if (response.requiresMFA || response.mfa_required || response.requires_mfa) {
        console.log('[LoginForm] MFA required, handling MFA flow');
        const sessionToken = response.tempToken || response.mfa_session_token || '';
        
        if (!sessionToken) {
          console.error('[LoginForm] No MFA session token found');
          setError('MFA verification required but no session token was provided.');
          setLoading(false);
          clearTimeout(loadingTimeoutId);
          return;
        }
        
        // Handle MFA flow
        if (rememberMe) localStorage.setItem('remember_user', 'true');
        localStorage.setItem('mfa_pending_email', email);
        localStorage.setItem('mfa_session_token', sessionToken);
        
        console.log('[LoginForm] Redirecting to MFA verification page');
        // Clear the timeout since we're navigating away
        clearTimeout(loadingTimeoutId);
        navigate('/mfa-verification', { 
          state: { mfaSessionToken: sessionToken, email }
        });
        return;
      }
      
      // Normal successful login flow
      console.log('[LoginForm] Login successful, navigating to dashboard');
      if (rememberMe) localStorage.setItem('remember_user', 'true');
      // Clear the timeout since we're navigating away
      clearTimeout(loadingTimeoutId);
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error('[LoginForm] Unhandled error during login process:', err);
      
      // Ensure we still maintain the minimum loading time even on error
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        console.log(`[LoginForm] Enforcing minimum loading time on error, waiting ${minLoadingTime - elapsedTime}ms`);
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      // Default error message for unexpected errors
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      // ALWAYS reset the loading state, regardless of success or error
      setLoading(false);
      setProcessingMessage('');
      clearTimeout(loadingTimeoutId);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        <h1>Welcome Back to DocuDino</h1>
        <p>Sign in to continue your document verification journey</p>
      </div>
      
      <div className="auth-container">
        <div className="auth-card animate-scale-in">
          {/* Display error messages prominently */}
          {(error || authError) && (
            <div className="error-message">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-icon">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ef4444" strokeWidth="2"/>
                <path d="M12 8V12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 16H12.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error || authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form form-reveal">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="input-icon">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="input-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading} 
                /> 
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="auth-button btn-shimmer">
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span> {processingMessage}
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              New to DocuDino? <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { User, LoginResponse, RegisterResponse } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, mfaToken?: string) => Promise<LoginResponse>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Set a shorter timeout to prevent getting stuck in loading state
        const timeoutPromise = new Promise(resolve => setTimeout(() => {
          console.log('Auth check timed out after 8 seconds');
          resolve(null);
        }, 8000)); // Reduced from 15 seconds to 8 seconds
        
        const token = localStorage.getItem('token');
        if (token) {
          console.log('Found token, checking profile...');
          // Race between the API call and the timeout
          const userData = await Promise.race([
            authApi.getProfile().catch(err => {
              console.error('Profile fetch error:', err);
              // Handle 401 specifically to avoid getting stuck
              if (axios.isAxiosError(err) && err.response?.status === 401) {
                console.log('Unauthorized access - clearing token');
                localStorage.removeItem('token');
              }
              return null;
            }),
            timeoutPromise
          ]);
          
          if (userData) {
            console.log('Profile data received successfully:', userData);
            setUser(userData as User);
          } else {
            console.log('Profile check failed or timed out');
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
      } finally {
        // Always set loading to false
        setLoading(false);
      }
    };

    // Start auth check
    checkAuth();
    
    // Fallback timer in case something goes wrong - reduced to 10 seconds
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        console.log('Forcing loading state to false after fallback timeout');
        setLoading(false);
      }
    }, 10000); // Reduced from 20 seconds to 10 seconds
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  const clearError = () => setError(null);

  // Improved login function with better error handling
  const login = async (email: string, password: string, mfaToken?: string): Promise<LoginResponse> => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting login for:', email);
      console.time('login-duration');

      // Record start time to enforce minimum loading duration
      const startTime = Date.now();
      
      // Set a timeout to force reset loading state in case of hanging requests
      const loadingTimeoutId = setTimeout(() => {
        console.log('[AuthContext] Force resetting loading state after timeout');
        setLoading(false);
        setError('Login request timed out. Please try again.');
      }, 20000); // 20 second timeout - slightly longer than component timeout

      try {
        const response = await authApi.login({ email, password, mfa_token: mfaToken });
        console.timeEnd('login-duration');
        console.log('Login response received:', { ...response, token: response.token ? '[REDACTED]' : 'none' });

        // If we have a token, store it (normal login flow)
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('token_expiry', new Date(Date.now() + 3600 * 1000).toISOString());
          console.log('Token stored successfully');
        } else {
          console.log('No token received in login response');
        }

        // If we have user data, set it in context
        if (response.user) {
          setUser(response.user);
          console.log('User data set in context');
          if (response.user.id) {
            localStorage.setItem('user_id', response.user.id);
          }
        } else {
          console.log('No user data in login response');
        }

        // Calculate how long we've been in the loading state
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1500; // 1.5 seconds minimum loading time
        
        // If we need to wait longer to meet the minimum loading time
        if (elapsedTime < minLoadingTime) {
          console.log(`Enforcing minimum loading time, waiting ${minLoadingTime - elapsedTime}ms`);
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }

        // Create a consistent response object that matches what the LoginForm expects
        const enhancedResponse = {
          ...response,
          requiresMFA: response.mfa_required || false,
          tempToken: response.mfa_session_token || ''
        };
        
        // Set loading to false before returning
        setLoading(false);
        clearTimeout(loadingTimeoutId);
        
        return enhancedResponse;
      } catch (apiError: any) {
        // Extract error message from various possible error structures
        console.error('API Login error:', apiError);
        
        let errorMessage: string;
        
        if (apiError.response && apiError.response.data) {
          // The API usually returns error messages in the data.error field
          errorMessage = apiError.response.data.error || apiError.response.data.message || 'Login failed. Please try again.';
          console.log('Error from API:', errorMessage);
        } else if (apiError instanceof Error) {
          errorMessage = apiError.message;
        } else {
          errorMessage = 'Login failed. Please try again.';
        }
        
        // Calculate how long we've been in the loading state
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1500; // 1.5 seconds minimum loading time
        
        // If we need to wait longer to meet the minimum loading time
        if (elapsedTime < minLoadingTime) {
          console.log(`Enforcing minimum loading time on error, waiting ${minLoadingTime - elapsedTime}ms`);
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }
        
        // Set the extracted error message to the context
        setError(errorMessage);
        
        // Set loading to false before throwing
        setLoading(false);
        clearTimeout(loadingTimeoutId);
        
        // Create an error object with response data for more context
        const enhancedError = new Error(errorMessage);
        if (apiError.response) {
          (enhancedError as any).response = apiError.response;
        }
        
        // Re-throw to allow the component to handle it
        throw enhancedError;
      }
    } catch (err: any) {
      console.error('Unhandled login error:', err);
      // This catch block is for errors that weren't caught in the try-catch above
      // Set loading to false and re-throw
      setLoading(false);
      throw err;
    }
  };

  // Improved register function with better error handling
  const register = async (email: string, password: string, firstName: string, lastName: string): Promise<RegisterResponse> => {
    try {
      console.log('Attempting registration...');
      setError(null);
      setLoading(true);
      const response = await authApi.register({ email, password, firstName, lastName });
      console.log('Registration successful:', { ...response, token: '[REDACTED]' });
      
      // Ensure token and user ID are properly stored
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('token_expiry', new Date(Date.now() + 3600 * 1000).toISOString());
        console.log('Token stored in localStorage');
      } else {
        console.error('No token received from registration');
      }
      
      if (response.user && response.user.id) {
        localStorage.setItem('user_id', response.user.id);
        console.log('User ID stored in localStorage:', response.user.id);
      }
      
      setUser(response.user);
      // Don't navigate automatically, let the RegisterForm handle navigation
      return response;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting logout...');
      setLoading(true);
      
      // Get token from localStorage before attempting logout
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found in localStorage during logout');
        // Still proceed with local logout
      } else {
        console.log('Token found, sending logout request');
        try {
          await authApi.logout();
          console.log('Server-side logout successful');
        } catch (apiError) {
          console.error('Server-side logout failed:', apiError);
          // Continue with client-side logout even if server-side fails
        }
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always perform local logout regardless of server response
      console.log('Performing local logout');
      localStorage.removeItem('token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('user_id');
      localStorage.removeItem('remember_user');
      setUser(null);
      setLoading(false);
      navigate('/login');
      console.log('Logout completed');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    clearError
  };

  if (loading) {
    return <LoadingSpinner size="large" fullscreen={true} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

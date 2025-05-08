import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  
  // Activity modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityData, setActivityData] = useState<Array<{ date: string; action: string; ip: string; location: string; device: string }>>([]);
  const [activityError, setActivityError] = useState('');
  
  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  useEffect(() => {
    document.title = 'DocuDino | Profile';
    
    // Populate the form with user data when available
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }));
    }
    
    return () => {
      document.title = 'DocuDino';
    };
  }, [user]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUpdateSuccess(false);
    setUpdateError('');
    
    try {
      // Validation
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setUpdateError('New passwords do not match.');
        setLoading(false);
        return;
      }
      
      // Prepare data for API call
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };
      
      // Only include password fields if the user is changing their password
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      // Make the API call to update the profile
      const updatedUser = await authApi.updateProfile(updateData);
      
      // Update the context with the new user data
      if (updatedUser) {
        user && user.id && localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setUpdateSuccess(true);
      setFormData(prevState => ({
        ...prevState,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      
    } catch (error: any) {
      setUpdateError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle account activity view
  const handleViewActivity = async () => {
    setShowActivityModal(true);
    setActivityLoading(true);
    setActivityError('');
    
    try {
      const response = await authApi.getAccountActivity();
      setActivityData(response.activities || []);
    } catch (error: any) {
      setActivityError(error.message || 'Failed to load account activity.');
    } finally {
      setActivityLoading(false);
    }
  };
  
  // Handle delete account button click
  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);
    setDeleteError('');
    setDeletePassword('');
  };
  
  // Handle delete account submission
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Password is required to delete your account.');
      return;
    }
    
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      const response = await authApi.deleteAccount({ password: deletePassword });
      
      if (response && response.success) {
        // Log the user out and redirect to home page
        await logout();
        navigate('/');
      }
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container profile-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Your Profile</h1>
        <p className="page-subtitle">Manage your account information and security settings</p>
      </div>

      <div className="profile-content">
        {/* Enhanced Profile Card */}
        <div className="profile-card animate-fade-in-up" style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--border-radius-md)',
          padding: '2.5rem',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}>
          {/* Decorative gradient background */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'radial-gradient(circle at top right, var(--accent-soft) 0%, transparent 70%)',
            opacity: 0.6,
            zIndex: 0,
          }}></div>
          
          <div className="profile-info" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
            position: 'relative',
            zIndex: 1,
          }}>
            <div className="avatar-container" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div className="avatar" style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-color), #3b82f6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 700,
                fontFamily: '"Montserrat", sans-serif',
                boxShadow: '0 8px 16px rgba(0, 114, 255, 0.25)',
                border: '4px solid white',
                transition: 'transform 0.3s ease',
              }}>
                {user.firstName && user.lastName ? 
                  `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 
                  user.email.substring(0, 2).toUpperCase()
                }
              </div>
              <div className="user-role-tag" style={{
                background: 'rgba(0, 114, 255, 0.1)',
                color: 'var(--accent-color)',
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}>{user.role || 'User'}</div>
            </div>
            
            <div className="user-details" style={{
              flex: 1
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                fontFamily: '"Montserrat", sans-serif',
                color: 'var(--dark-text)',
              }}>{user.firstName} {user.lastName}</h2>
              
              <p className="user-email" style={{
                fontSize: '1.1rem',
                color: 'var(--medium-text)',
                marginBottom: '1rem',
              }}>{user.email}</p>
              
              <div className="account-status" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 500,
              }}>
                <span className="status-indicator active" style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10b981', // Success green
                  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                }}></span>
                Account Active
              </div>
            </div>

            <div className="action-buttons" style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginLeft: 'auto',
            }}>
              <Link to="/mfa-setup" style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--border-radius-sm)',
                background: 'transparent',
                border: '1px solid var(--accent-color)',
                color: 'var(--accent-color)',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }} className="btn-outline hover:bg-accent-soft">
                {user.mfa_enabled ? 'Manage MFA' : 'Enable MFA'}
              </Link>
              
              <button 
                onClick={logout}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="profile-sections" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
          gap: '2rem',
        }}>
          <div className="profile-section animate-fade-in-up delay-100" style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--border-radius-md)',
            padding: '2.5rem',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}>
            <h2 className="section-heading" style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1.75rem',
              color: 'var(--dark-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
              paddingBottom: '0.75rem',
              fontFamily: '"Montserrat", sans-serif',
            }}>
              Account Information
            </h2>
            
            {/* Animated line under heading */}
            <div style={{
              position: 'absolute',
              height: '3px',
              width: '60px',
              background: 'var(--accent-color)',
              top: 'calc(2.5rem + 1.5rem + 0.75rem)',
              left: '2.5rem',
              borderRadius: '2px',
              animation: 'scaleIn 0.5s 0.3s forwards',
              transformOrigin: 'left',
              transform: 'scaleX(0)',
            }}></div>
            
            {updateSuccess && (
              <div className="alert success" style={{
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderLeft: '4px solid #10b981',
                color: '#059669',
                margin: '0 0 1.5rem 0',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                animation: 'fadeIn 0.5s ease',
                fontSize: '0.95rem',
              }}>
                <span style={{ fontWeight: 600 }}>Success!</span> Your profile has been updated successfully!
              </div>
            )}
            
            {updateError && (
              <div className="alert error" style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '4px solid #ef4444',
                color: '#dc2626',
                margin: '0 0 1.5rem 0',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                animation: 'fadeIn 0.5s ease',
                fontSize: '0.95rem',
              }}>
                <span style={{ fontWeight: 600 }}>Error:</span> {updateError}
              </div>
            )}
            
            <form onSubmit={handleUpdateProfile} className="profile-form form-reveal">
              <div className="form-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <div className="form-group">
                  <label htmlFor="firstName" style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--dark-text)',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}>First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                    className="focus:border-accent focus:ring"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName" style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--dark-text)',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}>Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                    className="focus:border-accent focus:ring"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="email" style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--dark-text)',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}>Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                  }}
                  className="focus:border-accent focus:ring"
                  required
                />
              </div>
              
              <h3 className="subsection-heading" style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: '2rem 0 1.5rem',
                color: 'var(--dark-text)',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem',
                position: 'relative',
                fontFamily: '"Montserrat", sans-serif',
              }}>
                Change Password
                <span style={{
                  position: 'absolute',
                  height: '3px',
                  width: '40px',
                  background: 'var(--accent-color)',
                  bottom: '-2px',
                  left: 0,
                  borderRadius: '2px',
                }}></span>
              </h3>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="currentPassword" style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--dark-text)',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}>Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                  }}
                  className="focus:border-accent focus:ring"
                />
              </div>
              
              <div className="form-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <div className="form-group">
                  <label htmlFor="newPassword" style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--dark-text)',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}>New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                    className="focus:border-accent focus:ring"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--dark-text)',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}>Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                    className="focus:border-accent focus:ring"
                  />
                </div>
              </div>
              
              <div className="form-actions" style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <button 
                  type="submit" 
                  style={{
                    padding: '0.85rem 2rem',
                    background: 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 14px rgba(0, 114, 255, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="btn-shimmer"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="small" /> : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="profile-section animate-fade-in-up delay-200" style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--border-radius-md)',
            padding: '2.5rem',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}>
            <h2 className="section-heading" style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1.75rem',
              color: 'var(--dark-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
              paddingBottom: '0.75rem',
              fontFamily: '"Montserrat", sans-serif',
            }}>
              Security Settings
            </h2>
            
            {/* Animated line under heading */}
            <div style={{
              position: 'absolute',
              height: '3px',
              width: '60px',
              background: 'var(--accent-color)',
              top: 'calc(2.5rem + 1.5rem + 0.75rem)',
              left: '2.5rem',
              borderRadius: '2px',
              animation: 'scaleIn 0.5s 0.3s forwards',
              transformOrigin: 'left',
              transform: 'scaleX(0)',
            }}></div>
            
            <div className="security-options" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}>
              <div className="security-option" style={{
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-md)',
                background: 'var(--light-gray-bg)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div className="security-option-info" style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: 'var(--dark-text)',
                  }}>Two-Factor Authentication (2FA)</h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'var(--medium-text)',
                    margin: '0 0 0.75rem 0',
                  }}>Add an extra layer of security to your account by enabling 2FA</p>
                  <div className="status-tag">
                    {user.mfa_enabled ? 
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                        padding: '0.35rem 0.8rem',
                        borderRadius: '2rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#10b981',
                        }}></span>
                        Enabled
                      </span> : 
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#dc2626',
                        padding: '0.35rem 0.8rem',
                        borderRadius: '2rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#ef4444',
                        }}></span>
                        Disabled
                      </span>
                    }
                  </div>
                </div>
                <Link to="/mfa-setup" style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: user.mfa_enabled ? 'transparent' : 'var(--accent-color)',
                  border: user.mfa_enabled ? '1px solid var(--accent-color)' : 'none',
                  color: user.mfa_enabled ? 'var(--accent-color)' : 'white',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: user.mfa_enabled ? 'none' : '0 4px 6px rgba(0, 114, 255, 0.2)',
                }} className="hover:translate-y-1px">
                  {user.mfa_enabled ? 'Manage 2FA' : 'Enable 2FA'}
                </Link>
              </div>
              
              <div className="security-option" style={{
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-md)',
                background: 'var(--light-gray-bg)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div className="security-option-info" style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: 'var(--dark-text)',
                  }}>Account Activity</h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'var(--medium-text)',
                  }}>Review your recent sign-in activity and locations</p>
                </div>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-color)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  position: 'relative',
                }} className="text-button" onClick={handleViewActivity}>
                  View Activity
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '0.5rem',
                    width: 'calc(100% - 1rem)',
                    height: '1px',
                    background: 'var(--accent-color)',
                    transform: 'scaleX(0)',
                    transition: 'transform 0.3s ease',
                    transformOrigin: 'left',
                  }} className="underline-animation"></span>
                </button>
              </div>
              
              <div className="security-option" style={{
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-md)',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div className="security-option-info" style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: '#dc2626',
                  }}>Delete Account</h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'var(--medium-text)',
                  }}>Permanently delete your account and all associated data</p>
                </div>
                <button style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#dc2626',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }} className="hover:bg-red-50" onClick={handleDeleteAccountClick}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add custom CSS to handle hover effects and animations */}
      <style jsx>{`
        .hover\\:bg-accent-soft:hover {
          background-color: var(--accent-soft);
        }
        
        .hover\\:bg-red-50:hover {
          background-color: rgba(239, 68, 68, 0.15);
        }
        
        .hover\\:translate-y-1px:hover {
          transform: translateY(-1px);
        }
        
        .text-button:hover .underline-animation {
          transform: scaleX(1);
        }
        
        .focus\\:border-accent:focus {
          border-color: var(--accent-color);
          outline: none;
        }
        
        .focus\\:ring:focus {
          box-shadow: 0 0 0 3px rgba(0, 114, 255, 0.2);
        }
        
        @media (max-width: 1024px) {
          .profile-sections {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .profile-info {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1.5rem;
          }
          
          .action-buttons {
            margin-left: 0;
            margin-top: 1rem;
          }
          
          .user-details h2 {
            text-align: center;
          }
        }
      `}</style>
      
      {/* Account Activity Modal */}
      {showActivityModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
        }}>
          <div className="modal-content" style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.3s ease, slideUp 0.3s ease',
          }}>
            <button 
              className="modal-close" 
              onClick={() => setShowActivityModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: 'var(--medium-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
              }}
            >
              &times;
            </button>
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              color: 'var(--dark-text)',
              fontFamily: '"Montserrat", sans-serif',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
            }}>Account Activity</h2>
            
            {activityLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '2rem',
              }}>
                <LoadingSpinner />
              </div>
            )}
            
            {activityError && (
              <div className="alert error" style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '4px solid #ef4444',
                color: '#dc2626',
                borderRadius: 'var(--border-radius-sm)',
                margin: '1rem 0',
              }}>
                {activityError}
              </div>
            )}
            
            {!activityLoading && !activityError && (
              activityData.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'var(--medium-text)',
                }}>
                  No recent activity found
                </div>
              ) : (
                <div className="activity-list" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  {activityData.map((activity, index) => (
                    <div 
                      key={index} 
                      className="activity-item"
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--border-radius-md)',
                        background: index % 2 === 0 ? 'var(--light-gray-bg)' : 'transparent',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ flex: 2, minWidth: '160px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--dark-text)' }}>
                          {activity.action}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--medium-text)' }}>
                          {activity.date}
                        </div>
                      </div>
                      
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <div style={{ fontSize: '0.9rem' }}>
                          {activity.ip}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--medium-text)' }}>
                          {activity.location}
                        </div>
                      </div>
                      
                      <div style={{ 
                        flex: 1, 
                        minWidth: '120px', 
                        fontSize: '0.9rem',
                        color: 'var(--medium-text)',
                      }}>
                        {activity.device}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}>
              <button 
                onClick={() => setShowActivityModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--accent-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
        }}>
          <div className="modal-content" style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            position: 'relative',
            boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.3s ease, slideUp 0.3s ease',
          }}>
            <button 
              className="modal-close" 
              onClick={() => setShowDeleteModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: 'var(--medium-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
              }}
            >
              &times;
            </button>
            
            <div style={{
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                marginBottom: '1rem',
              }}>
                ⚠️
              </div>
              
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#dc2626',
                fontFamily: '"Montserrat", sans-serif',
              }}>Delete Your Account</h2>
            </div>
            
            <p style={{
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
              color: 'var(--dark-text)',
              textAlign: 'center',
            }}>
              This action <strong>cannot be undone</strong>. This will permanently delete your
              account and remove all your data from our servers.
            </p>
            
            {deleteError && (
              <div className="alert error" style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '4px solid #ef4444',
                color: '#dc2626',
                borderRadius: 'var(--border-radius-sm)',
                margin: '1rem 0',
                fontSize: '0.9rem',
              }}>
                {deleteError}
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="deletePassword" style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--dark-text)',
                marginBottom: '0.5rem',
                display: 'block',
              }}>
                Confirm your password
              </label>
              <input
                type="password"
                id="deletePassword"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your current password"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  fontSize: '1rem',
                }}
                className="focus:border-accent focus:ring"
              />
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '1.5rem',
            }}>
              <button 
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--light-gray-bg)',
                  color: 'var(--dark-text)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              
              <button 
                onClick={handleDeleteAccount}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                disabled={deleteLoading}
              >
                {deleteLoading ? <LoadingSpinner size="small" /> : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
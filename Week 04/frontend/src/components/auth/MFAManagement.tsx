import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';

interface MFASetupData {
  secret: string;
  qr_code: string;
}

const MFAManagement: React.FC = () => {
  const [mfaStatus, setMfaStatus] = useState<{
    mfa_enabled: boolean;
    mfa_verified: boolean;
    requires_mfa: boolean;
  }>({
    mfa_enabled: false,
    mfa_verified: false,
    requires_mfa: false
  });
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      const response = await authApi.get('/api/mfa/status');
      setMfaStatus(response.data);
    } catch (err) {
      setError('Failed to fetch MFA status');
    }
  };

  const handleSetupMFA = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authApi.post('/api/mfa/setup');
      setSetupData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authApi.post('/api/mfa/verify', {
        token: verificationCode,
        generate_backup_codes: true
      });
      
      if (response.data.backup_codes) {
        setBackupCodes(response.data.backup_codes);
        setShowBackupCodes(true);
      }
      
      await fetchMFAStatus();
      setSetupData(null);
      setVerificationCode('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      setLoading(true);
      setError('');
      await authApi.post('/api/mfa/disable', {
        password: prompt('Please enter your password to disable MFA:')
      });
      await fetchMFAStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authApi.post('/api/mfa/generate-backup-codes', {
        password: prompt('Please enter your password to generate backup codes:')
      });
      setBackupCodes(response.data.backup_codes);
      setShowBackupCodes(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-management">
      <h2>Two-Factor Authentication (2FA)</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="mfa-status">
        <p>Status: {mfaStatus.mfa_enabled ? 'Enabled' : 'Disabled'}</p>
      </div>

      {!mfaStatus.mfa_enabled && !setupData && (
        <button 
          onClick={handleSetupMFA} 
          disabled={loading}
          className="auth-button"
        >
          {loading ? 'Setting up...' : 'Enable 2FA'}
        </button>
      )}

      {setupData && (
        <div className="mfa-setup">
          <h3>Setup 2FA</h3>
          <p>Scan this QR code with your authenticator app:</p>
          <img 
            src={`data:image/png;base64,${setupData.qr_code}`} 
            alt="MFA QR Code" 
            className="qr-code"
          />
          <p>Or enter this code manually: {setupData.secret}</p>
          
          <div className="verification-input">
            <div className="form-group">
              <label htmlFor="verification-code">Enter verification code</label>
              <div className="input-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="input-icon">
                  <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 15L10 12L7 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="auth-form-input"
                  maxLength={6}
                />
              </div>
            </div>
            <button 
              onClick={handleVerifyMFA}
              disabled={loading || !verificationCode}
              className="auth-button"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {mfaStatus.mfa_enabled && (
        <div className="mfa-actions">
          <button 
            onClick={handleDisableMFA}
            disabled={loading || mfaStatus.requires_mfa}
            className="auth-button"
          >
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </button>
          <button 
            onClick={handleGenerateBackupCodes}
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Generating...' : 'Generate Backup Codes'}
          </button>
        </div>
      )}

      {showBackupCodes && (
        <div>
          <h3>Backup Codes</h3>
          <ul>
            {backupCodes.map((code, index) => (
              <li key={index}>{code}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MFAManagement;
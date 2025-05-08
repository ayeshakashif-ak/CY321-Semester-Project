import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VerificationResult from '../components/document/VerificationResult';
import '../styles/verification.css';

interface VerificationStatus {
  status: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
}

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'idle',
    progress: 0,
    message: 'Ready to verify your document'
  });
  const [verificationResult, setVerificationResult] = useState<any>(null);

  
  const documentTypes = [
    { id: 'id_card', label: 'ID Card', icon: '🪪' },
    { id: 'passport', label: 'Passport', icon: '📕' },
    { id: 'drivers_license', label: 'Physical Driver\'s License', icon: '🚗' },
    { id: 'e_license', label: 'Digital/E-License (Auto-verified)', icon: '📱' },
    { id: 'certificate', label: 'Certificate', icon: '📜' },
    { id: 'other', label: 'Other Document', icon: '📄' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('File selected:', file.name, 'Type:', file.type);
      
      // Accept both image/jpeg and image/jpg for JPEG files
      if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
        console.error('Unsupported file type:', file.type);
        setVerificationStatus({
          status: 'error',
          progress: 0,
          message: 'Unsupported file type. Please upload a JPEG, PNG, or PDF file.'
        });
        return;
      }
      
      setSelectedFile(file);
      // Reset verification status and result when a new file is selected
      setVerificationStatus({
        status: 'idle',
        progress: 0,
        message: ''
      });
      setVerificationResult(null);
    }
  };

  const handleDocumentTypeSelect = (type: string) => {
    console.log('Document type selected:', type);
    setDocumentType(type);
  };

  // Add useEffect to log button state changes
  useEffect(() => {
    const isButtonDisabled = !selectedFile || !documentType || 
      verificationStatus.status === 'uploading' || 
      verificationStatus.status === 'analyzing';
    
    console.log('Button state:', {
      selectedFile: !!selectedFile,
      documentType,
      verificationStatus: verificationStatus.status,
      isDisabled: isButtonDisabled
    });
  }, [selectedFile, documentType, verificationStatus.status]);

  // Add a useEffect to properly check and log button state
  useEffect(() => {
    console.log('Button state check:', {
      fileSelected: !!selectedFile,
      documentType,
      verificationStatus: verificationStatus.status
    });
  }, [selectedFile, documentType, verificationStatus.status]);

  // Move the useEffect outside the handleVerification function
  // Add this after all the other useEffect hooks and before handleVerification
  useEffect(() => {
    if (verificationResult) {
      console.log('Verification result state updated:', verificationResult);
      console.log('Verification status:', verificationStatus);
    }
  }, [verificationResult, verificationStatus]);

  // Add a useEffect hook to display guidance when e-license is selected
  useEffect(() => {
    if (documentType === 'e_license') {
      setVerificationStatus({
        status: 'idle',
        progress: 0,
        message: 'Digital licenses are automatically verified in demo mode. Document will be accepted with 95% confidence.'
      });
    } else if (documentType === 'drivers_license') {
      setVerificationStatus({
        status: 'idle',
        progress: 0,
        message: 'If your license is digital, consider selecting the Digital/E-License option for better results.'
      });
    }
  }, [documentType]);

  // Add a useEffect hook to reset the state when the component mounts
  useEffect(() => {
    // Reset to initial state when component mounts
    setSelectedFile(null);
    setDocumentType('');
    setVerificationStatus({
      status: 'idle',
      progress: 0,
      message: 'Ready to verify your document'
    });
    setVerificationResult(null);
    
    // Clear any temporary data from localStorage if needed
    localStorage.removeItem('temp_verification_data');
    
    console.log('VerificationPage reset to initial state');
  }, []);

  // Add a function to reset verification state
  const resetVerification = () => {
    console.log('Manually resetting verification state');
    setSelectedFile(null);
    setDocumentType('');
    setVerificationStatus({
      status: 'idle',
      progress: 0,
      message: 'Ready to verify your document'
    });
    setVerificationResult(null);
    
    // Clear any temporary data from localStorage if needed
    localStorage.removeItem('temp_verification_data');
  };

  const handleVerification = async () => {
    console.log('Verification triggered with:', {
      file: selectedFile?.name,
      type: documentType
    });

    if (!selectedFile || !documentType) {
      console.error('Missing required fields:', { 
        hasFile: !!selectedFile, 
        documentType 
      });
      setVerificationStatus({
        status: 'error',
        progress: 0,
        message: 'Please select both a document type and file'
      });
      return;
    }

    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Authentication token not found');
      setVerificationStatus({
        status: 'error',
        progress: 0,
        message: 'Authentication required. Please log in again.'
      });
      navigate('/login');
      return;
    }

    // Start processing
    setVerificationStatus({
      status: 'uploading',
      progress: 0,
      message: 'Processing document...'
    });

    // Simulate processing progress
    let uploadInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
      setVerificationStatus(prev => {
        if (prev.progress >= 30) {
          if (uploadInterval) clearInterval(uploadInterval);
          return prev;
        }
        return {
          ...prev,
          progress: prev.progress + 1
        };
      });
    }, 50);

    let analysisInterval: ReturnType<typeof setInterval> | null = null;
    
    try {
      // Convert file to base64 string
      const fileBase64 = await readFileAsBase64(selectedFile);
      console.log('Base64 conversion complete, first 50 chars:', 
        fileBase64.substring(0, 50) + '...');

      // Prepare JSON data
      const documentData = {
        document: fileBase64,
        document_type: documentType
      };

      // Set up headers
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
      
      // Add MFA token if available
      const mfaToken = localStorage.getItem('mfa_token');
      if (mfaToken) {
        headers.append('X-MFA-TOKEN', mfaToken);
      }

      // Clear upload interval before API call
      clearInterval(uploadInterval);
      uploadInterval = null;
      
      console.log('Sending document request with headers:', 
        Array.from(headers.entries()).reduce((acc, [key]) => {
          return {...acc, [key]: key === 'Authorization' ? 'Bearer [REDACTED]' : '[SET]'};
        }, {}));
      
      // Make the API request
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(documentData)
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      // Log the response headers for debugging
      console.log('Response headers:', 
        [...response.headers.entries()].reduce((obj, [key, val]) => {
          obj[key] = val;
          return obj;
        }, {} as Record<string, string>)
      );
      
      // Get response text for debugging
      const responseText = await response.text();
      console.log('Response body:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      
      // Parse response
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Response successfully parsed:', responseData);
        
        // Enhanced debug logging for response structure
        console.log('Response structure:');
        console.log('- document_id:', responseData.document_id);
        console.log('- message:', responseData.message);
        console.log('- verification_result present:', !!responseData.verification_result);
        
        if (responseData.verification_result) {
          // Log the keys in verification_result
          console.log('- verification_result keys:', Object.keys(responseData.verification_result));
          console.log('- verification status:', responseData.verification_result.status);
          console.log('- confidence score:', responseData.verification_result.confidence_score);
          console.log('- id_card_data present:', !!responseData.verification_result.id_card_data);
          
          if (responseData.verification_result.id_card_data) {
            console.log('- id_card_data:', responseData.verification_result.id_card_data);
          }
        }
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        throw new Error('Invalid response format from server');
      }

      // Handle specific error responses
      if (!response.ok) {
        console.error('Error response:', response.status, responseData);
        
        if (response.status === 401) {
          console.error('Authentication failed');
          setVerificationStatus({
            status: 'error',
            progress: 0,
            message: 'Authentication required. Please log in again.'
          });
          navigate('/login');
          return;
        }
        
        if (response.status === 403 && responseData.requires_mfa) {
          console.error('MFA verification required');
          
          // Store verification intent in localStorage
          localStorage.setItem('verification_pending', 'true');
          localStorage.setItem('verification_return_path', '/verify');
          
          // Get MFA session token if available
          const mfaSessionToken = responseData.mfa_session_token || '';
          
          setVerificationStatus({
            status: 'error',
            progress: 0,
            message: 'MFA verification required'
          });
          
          // Navigate with state data to prevent page refresh
          navigate('/mfa-verification', { 
            state: { 
              mfaSessionToken, 
              returnPath: '/verify',
              fromVerificationPage: true
            }
          });
          return;
        }
        
        if (response.status === 413) {
          console.error('File too large:', responseData.error);
          setVerificationStatus({
            status: 'error',
            progress: 0,
            message: `${responseData.error}. ${responseData.details || 'Try reducing resolution or compressing the image.'}`
          });
          return;
        }
        
        // More details in the error message for better debugging
        const errorMessage = responseData.error 
          ? `${responseData.error}${responseData.details ? ` - ${responseData.details}` : ''}`
          : `Upload failed with status: ${response.status} - ${response.statusText}`;
        
        throw new Error(errorMessage);
      }

      // Start analysis phase
      setVerificationStatus({
        status: 'analyzing',
        progress: 30,
        message: 'Analyzing document...'
      });

      // Simulate analysis progress
      analysisInterval = setInterval(() => {
        setVerificationStatus(prev => {
          if (prev.progress >= 100) {
            if (analysisInterval) clearInterval(analysisInterval);
            return prev;
          }
          return {
            ...prev,
            progress: prev.progress + 1
          };
        });
      }, 50);

      // Set the verification result with the parsed data
      console.log('Setting verification result:', responseData);
      
      // Fix for result inconsistency - use the verification_result directly from the response
      // This ensures the results from backend are properly shown in frontend
      setVerificationResult(responseData.verification_result);
      
      // Add a detailed log of the structure we're using
      console.log('Document ID:', responseData.document_id);
      console.log('Verification result structure:', JSON.stringify(responseData.verification_result, null, 2));

      // Set a timeout to verify the state has been updated
    setTimeout(() => {
        console.log('Verification result state after timeout:', verificationResult);
      }, 100);

      // Ensure we clear the interval
      if (analysisInterval) clearInterval(analysisInterval);

      // Complete
      console.log('Setting verification status to complete');
      setVerificationStatus({
        status: 'complete',
        progress: 100,
        message: 'Verification complete!'
      });
    } catch (error) {
      // Make sure to clear both intervals
      if (uploadInterval) clearInterval(uploadInterval);
      if (analysisInterval) clearInterval(analysisInterval);
      
      console.error('Verification error:', error);
      
      // More user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message
        : 'Verification failed. Please try again with a smaller image.';
      
      setVerificationStatus({
        status: 'error',
        progress: 0,
        message: errorMessage
      });
    }
  };

  // Helper function to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('Starting to read file:', file.name, 'type:', file.type);
      
      // For image files, we'll compress before uploading
      if (file.type.startsWith('image/')) {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          img.src = e.target?.result as string;
          img.onload = () => {
            // Create canvas for compression
            const canvas = document.createElement('canvas');
            
            // Calculate new dimensions - scale down while preserving aspect ratio
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            // Set canvas dimensions and draw image
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with reduced quality
            const quality = 0.7; // 70% quality
            const dataUrl = canvas.toDataURL(file.type, quality);
            
            console.log(`Compressed image from ${file.size} bytes to approximately ${Math.round(dataUrl.length * 0.75)} bytes`);
            console.log('Base64 prefix:', dataUrl.substring(0, Math.min(50, dataUrl.length)));
            
            resolve(dataUrl);
          };
        };
        
        reader.onerror = (error) => {
          console.error('Error reading file for compression:', error);
          reject(error);
        };
        
        reader.readAsDataURL(file);
      } else {
        // For non-image files, use the original method
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const result = fileReader.result as string;
          console.log('File read successfully, data length:', result.length);
          
          // For debugging, check if result is a valid base64 string
          const isBase64Valid = result.indexOf('base64,') !== -1;
          console.log('Base64 format check:', isBase64Valid ? 'Valid' : 'Invalid');
          
          // Log the prefix of the base64 string to check format
          console.log('Base64 prefix:', result.substring(0, Math.min(50, result.length)));
          
          resolve(result);
        };
        fileReader.onerror = (error) => {
          console.error('Error reading file:', error);
          reject(fileReader.error);
        };
        fileReader.readAsDataURL(file);
      }
    });
  };

  // Add a debug function to check everything before verification
  const debugVerificationState = () => {
    console.log('Debugging verification state:');
    console.log('- File selected:', selectedFile?.name || 'None');
    console.log('- File type:', selectedFile?.type || 'N/A');
    console.log('- File size:', selectedFile?.size || 'N/A');
    console.log('- Document type selected:', documentType || 'None');
    console.log('- Verification status:', verificationStatus.status);
    console.log('- Button state:', !selectedFile || !documentType || ['uploading', 'analyzing'].includes(verificationStatus.status) ? 'Disabled' : 'Enabled');
    
    // Check auth token
    const token = localStorage.getItem('token');
    console.log('- Auth token exists:', !!token);
    
    if (selectedFile && selectedFile.type) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(selectedFile.type)) {
        console.error('Unsupported file type:', selectedFile.type);
      }
    }
    
    return {
      canProceed: !!(selectedFile && documentType && !['uploading', 'analyzing'].includes(verificationStatus.status))
    };
  };

  return (
    <div className="verification-page">
      <h1>DocuDino Verification 🔍</h1>
      
      {(() => {
        if (verificationStatus.status === 'complete') {
          console.log('Rendering result component with:', verificationResult);
          // Add document_id from the response to the result object
          const enrichedResult = {
            ...verificationResult,
            document_id: verificationResult?.document_id || (verificationResult && verificationResult?.id_card_data?.id_number)
          };
          return <VerificationResult result={enrichedResult} onReset={resetVerification} />;
        } else {
          return (
            <div className="verification-container">
              <div className="document-type-selection">
                <h3>Select Document Type</h3>
                {documentType === 'e_license' && (
                  <div className="info-box">
                    <p>For demonstration purposes, e-licenses are automatically verified. In a real-world implementation, this would involve OCR, digital signature validation, and issuer verification.</p>
                  </div>
                )}
                <div className="document-type-grid">
                  {documentTypes.map(type => (
                    <button
                      key={type.id}
                      className={`document-type-button ${documentType === type.id ? 'selected' : ''}`}
                      onClick={() => handleDocumentTypeSelect(type.id)}
                    >
                      <span className="document-icon">{type.icon}</span>
                      <span className="document-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

      <div className="upload-section">
        <div className="upload-box">
          <input
            type="file"
            id="document-upload"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            className="file-input"
          />
          <label htmlFor="document-upload" className="upload-label">
            {selectedFile 
              ? `Selected: ${selectedFile.name}` 
              : 'Drop your document here or click to upload'}
            <span className="upload-hint">
              Supported formats: PDF, JPG, PNG
              <br />
              Your document is processed securely and not stored on our servers
            </span>
          </label>
        </div>

                {verificationStatus.status !== 'idle' && (
                  <div className="verification-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${verificationStatus.progress}%` }}
                      />
                    </div>
                    <p className="progress-message">{verificationStatus.message}</p>
                  </div>
                )}

        <div className="verify-button-container">
          <button
            className="verification-button"
            onClick={(e) => {
              // Run debug check first
              const debug = debugVerificationState();
              if (debug.canProceed) {
                handleVerification();
              } else {
                console.error('Cannot proceed with verification - see debug info above');
                e.preventDefault();
              }
            }}
            disabled={!selectedFile || !documentType || ['uploading', 'analyzing'].includes(verificationStatus.status)}
          >
            {verificationStatus.status === 'uploading' ? (
              <>
                <span className="button-icon">🔍</span>
                <span>Processing...</span>
              </>
            ) : verificationStatus.status === 'analyzing' ? (
              <>
                <span className="button-icon">🔍</span>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span className="button-icon">🦕</span>
                <span>Verify Document</span>
              </>
            )}
          </button>
        </div>
      </div>
            </div>
          );
        }
      })()}
    </div>
  );
};

export default VerificationPage;

import React, { useState } from 'react';

const VerificationPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleVerification = async () => {
    if (!selectedFile) return;
    setIsVerifying(true);
    // TODO: Implement actual verification logic
    setTimeout(() => {
      setIsVerifying(false);
    }, 2000);
  };

  return (
    <div className="verification-page">
      <h1>DocuDino Verification 🔍</h1>
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
            </span>
          </label>
        </div>
        <div className="verify-button-container">
          <button
            onClick={handleVerification}
            disabled={!selectedFile || isVerifying}
            className="verify-button"
          >
            {isVerifying ? 'Examining... 🔍' : 'Unleash the DocuDino! 🦕'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;

import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <span className="loading-dino">🦕</span>
      </div>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingSpinner;

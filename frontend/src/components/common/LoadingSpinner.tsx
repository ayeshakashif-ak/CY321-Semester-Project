import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullscreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', fullscreen = false }) => {
  const [visible, setVisible] = useState(false);
  
  // Add a slight delay before showing spinner to avoid flashing for quick operations
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 200); // 200ms delay before showing
    
    return () => clearTimeout(timer);
  }, []);
  
  // Determine size-specific styles
  const getContainerStyle = () => {
    switch (size) {
      case 'small':
        return { width: '24px', height: '24px' };
      case 'large':
        return { width: '80px', height: '80px' };
      default: // medium
        return { width: '50px', height: '50px' };
    }
  };

  const fullscreenStyle = fullscreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  } : {};

  return (
    <div 
      className={`modern-spinner-container ${size} ${visible ? 'visible' : ''}`}
      style={{
        ...fullscreenStyle,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <div 
        className="modern-spinner" 
        style={{
          ...getContainerStyle(),
          display: 'inline-block',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '4px solid rgba(0, 114, 255, 0.1)',
          borderTopColor: 'var(--accent-color, #0072ff)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
      
      {size !== 'small' && (
        <p style={{
          marginTop: size === 'large' ? '20px' : '12px',
          color: 'var(--medium-text, #555)',
          fontWeight: 500,
          fontSize: size === 'large' ? '16px' : '14px',
        }}>
          Loading...
        </p>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .modern-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .modern-spinner-container.large {
          min-height: 200px;
        }
        
        .modern-spinner-container.medium {
          min-height: 120px;
        }
        
        .modern-spinner-container.visible {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to DocuDino 🦕</h1>
        <p>Your Prehistoric Guardian Against Document Fraud</p>
        {isAuthenticated ? (
          <Link to="/verify" className="cta-button">
            Verify Document
          </Link>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="cta-button">
              Login
            </Link>
            <Link to="/register" className="cta-button cta-button-secondary">
              Register
            </Link>
          </div>
        )}
      </section>
      
      <section className="features">
        <h2>Why Choose DocuDino?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>🔍 Prehistoric Precision</h3>
            <p>Our AI examines documents with the thoroughness of a paleontologist</p>
          </div>
          <div className="feature-card">
            <h3>⚡ Raptor-Quick Results</h3>
            <p>Lightning-fast verification with prehistoric power</p>
          </div>
          <div className="feature-card">
            <h3>🛡️ Jurassic Security</h3>
            <p>Your documents are protected with extinction-level security</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

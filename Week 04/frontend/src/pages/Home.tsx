import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'DocuDino | Secure Document Verification';
    return () => {
      document.title = 'DocuDino';
    };
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h1>
          Detecting Document Fraud with <span className="accent">Advanced</span> AI
        </h1>
        <p>
          DocuDino uses cutting-edge AI technology to verify document authenticity in seconds.
          Protect your organization from fraud with enterprise-grade verification.
        </p>
        
        {isAuthenticated ? (
          <div className="hero-cta">
            <Link to="/verify" className="hero-button">
              Verify Document
              <svg className="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        ) : (
          <div className="hero-cta">
            <Link to="/register" className="hero-button">
              Get Started Now
              <svg className="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        )}
      </section>
      
      <section className="features">
        <div className="features-container">
          <div className="section-header">
            <h2>Powerful Document Verification</h2>
            <p className="section-subtitle">
              DocuDino combines AI and machine learning to detect document forgeries, alterations, and inconsistencies with unmatched precision.
            </p>
          </div>
          
          <div className="feature-grid">
            <div className="feature-card animate-fade-in-up delay-100">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>AI-Powered Analysis</h3>
              <p>Our proprietary algorithms examine document structure, content, and metadata to identify inconsistencies and forgeries within seconds.</p>
            </div>
            <div className="feature-card animate-fade-in-up delay-200">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Real-Time Verification</h3>
              <p>Get instant verification results with detailed analysis reports highlighting any potential issues or inconsistencies found.</p>
            </div>
            <div className="feature-card animate-fade-in-up delay-300">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 9V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Enterprise Security</h3>
              <p>End-to-end encryption and secure document handling ensure your sensitive information remains protected at every step.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-header">
          <h2>Verify Documents in Three Simple Steps</h2>
          <p className="section-subtitle">
            Our streamlined verification process delivers rapid results without compromising on accuracy.
          </p>
        </div>

        <div className="steps-connector"></div>
        <div className="steps-container">
          <div className="step-card animate-fade-in-up">
            <div className="step-icon">📄</div>
            <div className="step-card-content">
              <h3><span className="step-number">1</span>Upload Document</h3>
              <p>Securely upload your document in multiple formats including PDF, JPG, PNG, and TIFF. Our system handles everything from ID cards to complex legal documents.</p>
            </div>
          </div>
          <div className="step-card animate-fade-in-up delay-200">
            <div className="step-icon">🔍</div>
            <div className="step-card-content">
              <h3><span className="step-number">2</span>AI Examination</h3>
              <p>Our proprietary AI analyzes over 100 data points, checking for inconsistencies, manipulations, and authenticity markers with military-grade precision.</p>
            </div>
          </div>
          <div className="step-card animate-fade-in-up delay-300">
            <div className="step-icon">✅</div>
            <div className="step-card-content">
              <h3><span className="step-number">3</span>Detailed Results</h3>
              <p>Receive comprehensive verification reports with confidence scores, highlighted areas of concern, and actionable insights within seconds.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="use-cases">
        <div className="section-header">
          <h2>Trusted Across Industries</h2>
          <p className="section-subtitle">
            Organizations worldwide rely on DocuDino for critical document verification needs.
          </p>
        </div>

        <div className="use-cases-grid">
          <div className="use-case-card animate-fade-in-up">
            <div className="use-case-icon">🏢</div>
            <h3>HR & Recruitment</h3>
            <p>Verify candidate credentials, education certificates, and employment history in seconds instead of weeks.</p>
          </div>
          <div className="use-case-card animate-fade-in-up delay-100">
            <div className="use-case-icon">🏦</div>
            <h3>Banking & Finance</h3>
            <p>Streamline KYC processes and detect fraudulent financial documents with precision and compliance.</p>
          </div>
          <div className="use-case-card animate-fade-in-up delay-200">
            <div className="use-case-icon">⚖️</div>
            <h3>Legal Services</h3>
            <p>Validate legal documents, contracts, and court filings with confidence and thorough analysis.</p>
          </div>
          <div className="use-case-card animate-fade-in-up delay-300">
            <div className="use-case-icon">🏥</div>
            <h3>Healthcare</h3>
            <p>Verify medical credentials, insurance documents, and patient records while maintaining HIPAA compliance.</p>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="section-header">
          <h2>Trusted by Industry Leaders</h2>
        </div>

        <div className="testimonials-container">
          <div className="testimonial-card animate-fade-in">
            <div className="quote-icon">"</div>
            <p className="testimonial-text">
              DocuDino has transformed our hiring process. We've reduced verification time by 94% while catching numerous falsified credentials that would have otherwise slipped through.
            </p>
            <div className="testimonial-author-container">
              <div>
                <p className="testimonial-author">
                  Sarah Johnson
                </p>
                <span className="testimonial-position">HR Director, Global Tech Solutions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2>Start Verifying Documents Today</h2>
          <p>Join organizations that trust DocuDino to detect document fraud and protect their operations.</p>
          
          <div className="stats-highlight">
            <div className="stat-item animate-fade-in">
              <div className="stat-number">99.7%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat-item animate-fade-in delay-200">
              <div className="stat-number">3s</div>
              <div className="stat-label">Average Processing Time</div>
            </div>
            <div className="stat-item animate-fade-in delay-300">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Availability</div>
            </div>
          </div>
          
          {isAuthenticated ? (
            <Link to="/verify" className="cta-button cta-button-accent get-started-btn">
              Verify Document Now
              <svg className="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : (
            <Link to="/register" className="cta-button cta-button-accent get-started-btn">
              Verify Document Now
              <svg className="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

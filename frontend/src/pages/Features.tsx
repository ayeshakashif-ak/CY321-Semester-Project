import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Features: React.FC = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'DocuDino | Features';
    return () => {
      document.title = 'DocuDino';
    };
  }, []);

  return (
    <div className="features-page">
      <section className="features-hero">
        <h1>Advanced Document Verification Features</h1>
        <p className="features-subtitle">
          Discover the powerful tools and technologies that make DocuDino the industry leader in document verification.
        </p>
      </section>

      <section className="feature-showcase">
        <div className="feature-showcase-grid">
          <div className="feature-showcase-content animate-fade-in-right">
            <h2>AI-Powered Document Analysis</h2>
            <p>
              Our proprietary machine learning algorithms analyze documents at multiple levels - from pixel-level 
              visual inspection to content consistency checks and metadata analysis.
            </p>
            <ul className="feature-list">
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Machine learning models trained on millions of document samples</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Pixel-level scrutiny detects even minor alterations</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Content verification against known templates and formats</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Metadata inspection for hidden modification traces</span>
              </li>
            </ul>
          </div>
          <div className="feature-showcase-image animate-fade-in-left">
            <div className="floating-element small"></div>
            <div className="floating-element medium"></div>
            <div className="floating-element small"></div>
            <div className="floating-element medium"></div>
            <svg className="svg-illustration" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="120" y="60" width="360" height="280" rx="15" fill="#ffffff" stroke="#0072ff" strokeWidth="2" />
              <rect x="150" y="100" width="300" height="20" rx="5" fill="#e2ecff" />
              <rect x="150" y="140" width="250" height="20" rx="5" fill="#e2ecff" />
              <rect x="150" y="180" width="300" height="100" rx="5" fill="#e2ecff" />
              <rect x="150" y="300" width="120" height="20" rx="5" fill="#0072ff" opacity="0.6" />
              <circle cx="450" cy="90" r="15" fill="#0072ff" opacity="0.6" />
              <path d="M360 200 L420 200 L400 240 L380 180 L360 200" fill="#0072ff" opacity="0.4" />
              <path d="M200 200 L260 200 L240 240 L220 180 L200 200" fill="#0072ff" opacity="0.4" />
            </svg>
          </div>
        </div>
      </section>

      <section className="feature-showcase feature-showcase-alt">
        <div className="feature-showcase-grid reverse">
          <div className="feature-showcase-image animate-fade-in-right">
            <div className="floating-element small"></div>
            <div className="floating-element medium"></div>
            <div className="floating-element small"></div>
            <div className="floating-element medium"></div>
            <svg className="svg-illustration" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="300" cy="200" r="150" fill="#ffffff" stroke="#0072ff" strokeWidth="2" />
              <circle cx="300" cy="200" r="140" fill="none" stroke="#0072ff" strokeWidth="2" strokeDasharray="5 5" />
              <circle cx="300" cy="200" r="120" fill="none" stroke="#0072ff" strokeWidth="1" />
              <path d="M300 80 L300 150" stroke="#0072ff" strokeWidth="2" />
              <path d="M300 250 L300 320" stroke="#0072ff" strokeWidth="2" />
              <path d="M180 200 L250 200" stroke="#0072ff" strokeWidth="2" />
              <path d="M350 200 L420 200" stroke="#0072ff" strokeWidth="2" />
              <circle cx="300" cy="200" r="30" fill="#0072ff" opacity="0.2" />
              <circle cx="300" cy="200" r="15" fill="#0072ff" opacity="0.6" />
              <text x="290" y="170" fontSize="24" fill="#0072ff" fontWeight="bold">3s</text>
            </svg>
          </div>
          <div className="feature-showcase-content animate-fade-in-left">
            <h2>Real-Time Verification</h2>
            <p>
              No more waiting days for verification results. DocuDino delivers comprehensive 
              document analysis in seconds, not hours or days.
            </p>
            <ul className="feature-list">
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Process documents in as little as 3 seconds</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>High-throughput architecture handles volume</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Parallel processing of multiple verification checks</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Instant detailed reporting with highlighted areas of concern</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="feature-showcase">
        <div className="feature-showcase-grid">
          <div className="feature-showcase-content animate-fade-in-right">
            <h2>Enterprise-Grade Security</h2>
            <p>
              Security is at the core of our platform. DocuDino uses end-to-end encryption, secure document handling, 
              and strict access controls to ensure your sensitive information remains protected.
            </p>
            <ul className="feature-list">
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>SOC 2 Type II compliant infrastructure</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>End-to-end encryption for all document transfers</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Advanced MFA options including biometric verification</span>
              </li>
              <li>
                <span className="feature-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#0072ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Automatic document deletion after processing</span>
              </li>
            </ul>
          </div>
          <div className="feature-showcase-image animate-fade-in-left">
            <div className="floating-element small"></div>
            <div className="floating-element medium"></div>
            <div className="floating-element small"></div>
            <div className="floating-element large"></div>
            <svg className="svg-illustration" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M300 80 L300 320" stroke="#ff3838" strokeWidth="1" strokeDasharray="5 5" />
              <path d="M180 200 L420 200" stroke="#ff3838" strokeWidth="1" strokeDasharray="5 5" />
              <rect x="250" y="150" width="100" height="100" rx="8" fill="#ffffff" stroke="#ff3838" strokeWidth="2" />
              <rect x="270" y="170" width="60" height="10" rx="2" fill="#ffe6e6" />
              <rect x="270" y="190" width="40" height="10" rx="2" fill="#ffe6e6" />
              <rect x="270" y="210" width="30" height="10" rx="2" fill="#ff3838" opacity="0.6" />
              <circle cx="300" cy="280" r="30" fill="#ffffff" stroke="#ff3838" strokeWidth="2" />
              <path d="M290 280 L300 290 L315 270" stroke="#ff3838" strokeWidth="2" />
              <circle cx="200" cy="120" r="20" fill="#ffffff" stroke="#ff3838" strokeWidth="2" />
              <path d="M194 120 L200 126 L208 114" stroke="#ff3838" strokeWidth="2" />
              <circle cx="400" cy="280" r="20" fill="#ffffff" stroke="#ff3838" strokeWidth="2" />
              <path d="M394 280 L400 286 L408 274" stroke="#ff3838" strokeWidth="2" />
              <path d="M200 150 L250 175" stroke="#ff3838" strokeWidth="1" />
              <path d="M350 175 L400 150" stroke="#ff3838" strokeWidth="1" />
              <path d="M250 225 L200 250" stroke="#ff3838" strokeWidth="1" />
              <path d="M400 250 L350 225" stroke="#ff3838" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </section>

      <section className="features-detail">
        <div className="section-header centered">
          <h2>Document Types We Verify</h2>
          <p className="section-subtitle">DocuDino can verify virtually any document type with industry-leading accuracy</p>
        </div>

        <div className="feature-detail-grid">
          <div className="feature-detail-card">
            <div className="feature-detail-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Identity Document Verification</h3>
            <p>Verify IDs, passports, driver's licenses and other official identification documents against official templates.</p>
          </div>

          <div className="feature-detail-card">
            <div className="feature-detail-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 8H18V17C18 18.0609 17.5786 19.0783 16.8284 19.8284C16.0783 20.5786 15.0609 21 14 21H6C4.93913 21 3.92172 20.5786 3.17157 19.8284C2.42143 19.0783 2 18.0609 2 17V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Credential Authentication</h3>
            <p>Validate educational certificates, professional licenses, and employment credentials with comprehensive checks.</p>
          </div>

          <div className="feature-detail-card">
            <div className="feature-detail-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 10H12V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 16H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Document Metadata Analysis</h3>
            <p>Examine hidden document properties, creation dates, and modification history to identify tampering.</p>
          </div>

          <div className="feature-detail-card">
            <div className="feature-detail-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Fraud Pattern Recognition</h3>
            <p>Detect common forgery patterns and techniques based on our extensive database of fraud examples.</p>
          </div>

          <div className="feature-detail-card">
            <div className="feature-detail-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 16L12 12L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.39 18.39C21.3654 17.8583 22.1359 17.0169 22.5799 16.0091C23.024 15.0013 23.1162 13.8822 22.8428 12.8186C22.5694 11.755 21.9480 10.8157 21.0701 10.1542C20.1922 9.49272 19.1086 9.14919 18 9.17999C17.5221 7.90558 16.7004 6.77563 15.6236 5.92371C14.5468 5.07179 13.2646 4.52472 11.9115 4.33534C10.5584 4.14596 9.18204 4.32151 7.9229 4.84291C6.66376 5.36432 5.57168 6.2098 4.75478 7.29292C3.93788 8.37605 3.42845 9.65426 3.28436 10.9941C3.14027 12.334 3.36639 13.6857 3.93655 14.9124C4.50671 16.1392 5.3968 17.1996 6.52067 17.9866C7.64454 18.7736 8.96326 19.255 10.34 19.39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Batch Processing</h3>
            <p>Verify multiple documents simultaneously with our high-throughput batch processing capabilities.</p>
          </div>

          <div className="feature-detail-card">
            <div className="feature-detail-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3H3C2.46957 3 1.96086 3.21071 1.58579 3.58579C1.21071 3.96086 1 4.46957 1 5V19C1 19.5304 1.21071 20.0391 1.58579 20.4142C1.96086 20.7893 2.46957 21 3 21H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 3H21C21.5304 3 22.0391 3.21071 22.4142 3.58579C22.7893 3.96086 23 4.46957 23 5V19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Comprehensive Reporting</h3>
            <p>Get detailed verification reports with confidence scores, risk assessments, and highlighted areas of concern.</p>
          </div>
        </div>
      </section>

      <section className="features-comparison">
        <div className="section-header centered">
          <h2>Why Choose DocuDino</h2>
          <p className="section-subtitle">See how our advanced verification capabilities compare to traditional methods</p>
        </div>

        <div className="comparison-table-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>DocuDino</th>
                <th>Traditional Methods</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Verification Time</td>
                <td><span className="highlight">Seconds</span></td>
                <td>Days to Weeks</td>
              </tr>
              <tr>
                <td>Accuracy Rate</td>
                <td><span className="highlight">99.7%</span></td>
                <td>60-80%</td>
              </tr>
              <tr>
                <td>Cost per Document</td>
                <td><span className="highlight">Significantly Lower</span></td>
                <td>High (Manual Labor)</td>
              </tr>
              <tr>
                <td>Fraud Detection Capabilities</td>
                <td><span className="highlight">Advanced AI Detection</span></td>
                <td>Limited Human Review</td>
              </tr>
              <tr>
                <td>Scalability</td>
                <td><span className="highlight">Unlimited</span></td>
                <td>Limited by Staff</td>
              </tr>
              <tr>
                <td>24/7 Availability</td>
                <td><span className="highlight">Yes</span></td>
                <td>No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="features-cta">
        <h2>Ready to Experience Advanced Document Verification?</h2>
        <p>Join thousands of organizations that trust DocuDino for their document verification needs.</p>
        
        {isAuthenticated ? (
          <Link to="/verify" className="cta-button cta-button-accent get-started-btn">
            Verify a Document Now
            <svg className="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ) : (
          <Link to="/register" className="cta-button cta-button-accent get-started-btn">
            Start Now
            <svg className="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
      </section>
    </div>
  );
};

export default Features;
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/verification.css'; // Import the stylesheet

interface VerificationResultProps {
  result: {
    status?: string;
    confidence_score?: number;
    security_features?: string[];
    message?: string;
    document_id?: string;
    digital_document?: boolean;
    id_card_data?: {
      id_number?: string;
      card_type?: string;
      issuing_authority?: string;
    };
    // Handle older response format compatibility
    analysis_details?: {
      document_authenticity?: boolean;
      security_features?: string[];
      data_consistency?: boolean;
      image_quality?: string;
      risk_factors?: string[];
    };
    recommendations?: string[];
    // New detailed analysis format
    detailed_analysis?: {
      authenticity?: {
        score?: number;
        findings?: string[];
      };
      data_consistency?: {
        score?: number;
        findings?: string[];
      };
      image_quality?: {
        score?: number;
        findings?: string[];
      };
      risk_factors?: {
        score?: number;
        findings?: string[];
      };
    };
  };
  onReset?: () => void; // Add optional onReset function
}

const VerificationResult: React.FC<VerificationResultProps> = ({ result, onReset }) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('VerificationResult component received:', result);
    // Log specific key parts of the result for debugging
    console.log('- Status:', result?.status);
    console.log('- Document ID:', result?.document_id);
    console.log('- Confidence:', result?.confidence_score);
    console.log('- ID Card Data:', result?.id_card_data);
    console.log('- Security Features:', result?.security_features);
    console.log('- Detailed Analysis:', result?.detailed_analysis);
  }, [result]);

  // Defensive check for missing result or status
  if (!result) {
    console.error('No result data provided to VerificationResult component');
    return <div className="error-message">No verification result available</div>;
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'verified':
        return 'green';
      case 'potentially valid':
        return 'orange';
      case 'invalid':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getConfidenceColor = (score: number = 0) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 85) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Extract values with defaults to avoid errors
  const {
    status = 'Unknown',
    confidence_score = 0,
    security_features = [],
    recommendations = [],
    message,
    document_id,
    digital_document,
    id_card_data,
    analysis_details = {},
    detailed_analysis = {}
  } = result;

  // For backward compatibility, try to get security features from both places
  const actualSecurityFeatures = security_features?.length > 0 
    ? security_features 
    : analysis_details?.security_features || [];

  // Extract document authenticity from either detailed_analysis or analysis_details
  const documentAuthenticity = detailed_analysis?.authenticity?.score 
    ? detailed_analysis.authenticity.score >= 85
    : analysis_details?.document_authenticity || false;

  // Extract data consistency from either detailed_analysis or analysis_details
  const dataConsistency = detailed_analysis?.data_consistency?.score
    ? detailed_analysis.data_consistency.score > 70
    : analysis_details?.data_consistency || false;

  // Check if the actual finding says data is consistent
  const isDataConsistent = detailed_analysis?.data_consistency?.findings?.[0]?.toLowerCase().includes("consistent") || false;

  // Extract image quality from either detailed_analysis or analysis_details
  const imageQuality = detailed_analysis?.image_quality?.findings?.[0] || analysis_details?.image_quality || 'Unknown';

  // Extract risk factors from either detailed_analysis or analysis_details
  const riskFactors = detailed_analysis?.risk_factors?.findings || analysis_details?.risk_factors || [];

  // Format scores for display
  const formatScore = (score: number | undefined): string => score ? `${Math.round(score)}%` : 'N/A';
  const authenticityScore = detailed_analysis?.authenticity?.score || confidence_score;
  const dataConsistencyScore = detailed_analysis?.data_consistency?.score || 0;
  const imageQualityScore = detailed_analysis?.image_quality?.score || 0;
  const riskFactorScore = detailed_analysis?.risk_factors?.score || 0;

  // Function to get background color based on score
  const getScoreBackground = (score: number): string => {
    if (score >= 90) return '#c6f6d5'; // Green
    if (score >= 85) return '#fefcbf'; // Yellow
    return '#fed7d7'; // Red
  };

  console.log('Rendering with status:', status);
  console.log('Document authenticity:', documentAuthenticity);

  // Function to handle downloading the verification report
  const handleDownloadReport = () => {
    console.log('Downloading report for document:', result?.document_id);
    try {
      // Create a text report from the verification result
      const report = `
DOCUMENT VERIFICATION REPORT
===========================
Document ID: ${result?.document_id || 'Unknown'}
Date & Time: ${new Date().toLocaleString()}

VERIFICATION RESULT
------------------
Status: ${result?.status?.toUpperCase() || 'UNKNOWN'}
Confidence Score: ${result?.confidence_score || 0}%

${result?.id_card_data ? `
IDENTITY CARD INFORMATION
------------------------
ID Number: ${result.id_card_data.id_number || 'N/A'}
Card Type: ${result.id_card_data.card_type || 'N/A'}
Issuing Authority: ${result.id_card_data.issuing_authority || 'N/A'}
` : ''}

SECURITY FEATURES DETECTED
-------------------------
${result?.security_features?.map((feature: string) => `- ${feature}`).join('\n') || '- None detected'}

${result?.detailed_analysis?.risk_factors?.findings && result.detailed_analysis.risk_factors.findings.length > 0 ? `
RISK FACTORS
-----------
${result.detailed_analysis.risk_factors.findings.map((risk: string) => `- ${risk}`).join('\n')}
` : ''}

RECOMMENDATIONS
-------------
${result?.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || '- None provided'}
      `;

      // Create a blob from the report
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `verification-report-${result?.document_id || 'document'}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Report download complete');
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <div className="result-container">
      <div className="result-header">
        <h2>Verification Results</h2>
        <div className={`status-badge ${getStatusColor(status)}`}>
          {status}
        </div>
      </div>

      {message && (
        <div className="result-message">
          <p>{message}</p>
        </div>
      )}

      {document_id && (
        <div className="document-id">
          <h3>Verification Reference ID</h3>
          <p className="id-value">{document_id}</p>
          <p className="id-note">This is a reference ID for this verification session only. Your document was not stored.</p>
        </div>
      )}

      <div className="privacy-notice">
        <h3>Privacy Protection</h3>
        <p>
          <span className="privacy-icon">🔒</span> Your document was processed securely and was not stored on our servers.
          This verification was performed in real-time, and no copies of your document remain in our system.
        </p>
      </div>

      {digital_document && (
        <div className="special-notice">
          <h3>Digital Document Information</h3>
          <p>
            This appears to be a digital document. In a production environment, verification would include:
          </p>
          <ul>
            <li>OCR (Optical Character Recognition) to extract and validate text</li>
            <li>Digital signature verification with the issuing authority</li>
            <li>Watermark detection and validation</li>
            <li>Hologram and security feature analysis</li>
          </ul>
          <p>For demonstration purposes, the system has accepted this document as valid.</p>
        </div>
      )}

      {id_card_data && (
        <div className="id-card-data">
          <h3>Identity Card Information</h3>
          <div className="id-card-details">
            <div className="id-detail">
              <span className="id-label">ID Number:</span>
              <span className="id-value highlight">{id_card_data.id_number}</span>
            </div>
            <div className="id-detail">
              <span className="id-label">Card Type:</span>
              <span className="id-value">{id_card_data.card_type}</span>
            </div>
            <div className="id-detail">
              <span className="id-label">Issuing Authority:</span>
              <span className="id-value">{id_card_data.issuing_authority}</span>
            </div>
          </div>
        </div>
      )}

      <div className="confidence-score">
        <h3>Confidence Score</h3>
        <div className={`score ${getConfidenceColor(confidence_score)}`}>
          {confidence_score}%
        </div>
      </div>

      {detailed_analysis && Object.keys(detailed_analysis).length > 0 && (
        <div className="score-breakdown">
          <h3>Verification Score Breakdown</h3>
          <div className="score-components">
            <div 
              className="score-component" 
              style={{backgroundColor: getScoreBackground(authenticityScore)}}
            >
              <div className="component-name">Authenticity</div>
              <div className="component-score">{formatScore(authenticityScore)}</div>
            </div>
            <div 
              className="score-component" 
              style={{backgroundColor: getScoreBackground(dataConsistencyScore)}}
            >
              <div className="component-name">Data Consistency</div>
              <div className="component-score">{formatScore(dataConsistencyScore)}</div>
            </div>
            <div 
              className="score-component" 
              style={{backgroundColor: getScoreBackground(imageQualityScore)}}
            >
              <div className="component-name">Image Quality</div>
              <div className="component-score">{formatScore(imageQualityScore)}</div>
            </div>
            <div 
              className="score-component" 
              style={{backgroundColor: getScoreBackground(riskFactorScore)}}
            >
              <div className="component-name">Risk Assessment</div>
              <div className="component-score">{formatScore(riskFactorScore)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="analysis-details">
        <h3>Analysis Details</h3>
        
        <div className="detail-section">
          <h4>Document Authenticity</h4>
          <div className={`status-indicator ${documentAuthenticity ? 'success' : 'error'}`}>
            {documentAuthenticity ? '✓ Authentic' : '✗ Potentially Fake'}
          </div>
          {detailed_analysis?.authenticity?.findings && (
            <ul className="finding-list">
              {detailed_analysis.authenticity.findings.map((finding, index) => (
                <li key={index} className="finding-item">
                  {finding}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="detail-section">
          <h4>Security Features</h4>
          {actualSecurityFeatures.length > 0 ? (
            <ul className="feature-list">
              {actualSecurityFeatures.map((feature, index) => (
                <li key={index} className="feature-item">
                  <span className="feature-icon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          ) : (
            <p>No security features detected</p>
          )}
        </div>

        <div className="detail-section">
          <h4>Data Consistency</h4>
          <div className={`status-indicator ${isDataConsistent ? 'success' : 'error'}`}>
            {isDataConsistent ? '✓ Consistent' : '✗ Inconsistent'}
          </div>
          {detailed_analysis?.data_consistency?.findings && (
            <ul className="finding-list">
              {detailed_analysis.data_consistency.findings.map((finding, index) => (
                <li key={index} className="finding-item">
                  {finding}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="detail-section">
          <h4>Image Quality</h4>
          <div className="quality-rating">
            {imageQuality}
          </div>
          {detailed_analysis?.image_quality?.findings && (
            <ul className="finding-list">
              {detailed_analysis.image_quality.findings.map((finding, index) => (
                <li key={index} className="finding-item">
                  {finding}
                </li>
              ))}
            </ul>
          )}
        </div>

        {riskFactors.length > 0 && (
          <div className="detail-section risk-factors">
            <h4>Risk Factors</h4>
            <ul className="risk-list">
              {riskFactors.map((risk, index) => (
                <li key={index} className="risk-item">
                  <span className="risk-icon">⚠️</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Recommendations</h3>
          <ul className="recommendation-list">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="recommendation-item">
                <span className="recommendation-icon">💡</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-actions">
        <button 
          className="action-button primary"
          onClick={handleDownloadReport}
        >
          Download Report
        </button>
        {onReset ? (
          <button 
            className="action-button secondary"
            onClick={() => {
              console.log('Reset button clicked - using manual reset function');
              onReset();
            }}
          >
            Verify Another Document
          </button>
        ) : (
          <>
            <Link 
              to="/verify" 
              className="action-button secondary"
              onClick={() => console.log('Link clicked - using react-router navigation')}
            >
              Verify Another Document
            </Link>
            <button 
              className="action-button secondary alt-nav-btn"
              onClick={() => {
                console.log('Alternative navigation button clicked - using window.location');
                window.location.href = '/verify';
              }}
            >
              Verify Another (Alt)
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationResult;

import React, { useEffect } from 'react';

const Dashboard: React.FC = () => {
  useEffect(() => {
    document.title = 'DocuDino | Dashboard';
    return () => {
      document.title = 'DocuDino';
    };
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard 🦕</h1>
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Documents Examined</h3>
            <p className="stat-number">0</p>
            <p className="stat-description">Total documents processed</p>
          </div>
          <div className="stat-card">
            <h3>Accuracy Rate</h3>
            <p className="stat-number">0%</p>
            <p className="stat-description">Verification accuracy</p>
          </div>
          <div className="stat-card">
            <h3>Frauds Caught</h3>
            <p className="stat-number">0</p>
            <p className="stat-description">Suspicious documents detected</p>
          </div>
        </div>
        <div className="recent-activity">
          <h2>Recent Excavations 🔍</h2>
          <div className="activity-list">
            <p className="no-activity">No recent document examinations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

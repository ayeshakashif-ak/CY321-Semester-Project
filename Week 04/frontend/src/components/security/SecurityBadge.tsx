const SecurityBadge: React.FC = () => {
  return (
    <div className="security-badge">
      <div className="encryption-status">
        <span className="icon">🔒</span>
        <span>End-to-End Encrypted</span>
      </div>
      <div className="certification-info">
        <span>ISO 27001 Certified</span>
      </div>
    </div>
  );
};

export default SecurityBadge;

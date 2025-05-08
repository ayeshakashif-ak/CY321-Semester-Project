const AnalyticsChart: React.FC = () => {
  return (
    <div className="analytics-section">
      <div className="chart-filters">
        <select>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 3 months</option>
        </select>
      </div>
      <div className="chart-container">
        {/* Chart implementation */}
      </div>
    </div>
  );
};

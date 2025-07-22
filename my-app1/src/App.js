import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Sidebar Component
function Sidebar({ companies, onSelect, selectedSymbol }) {
  console.log('Sidebar rendering with companies:', companies);
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">📈</span>
          <h2>Stock Market</h2>
        </div>
        <div className="subtitle">Live Dashboard</div>
      </div>
      
      <div className="search-container">
        <input 
          type="text" 
          className="search-input"
          placeholder="Search companies..."
        />
        <span className="search-icon">🔍</span>
      </div>
      
      <div className="companies-list">
        <div className="list-header">
          <h3>Companies</h3>
          <span className="company-count">{companies.length}</span>
        </div>
        
        {companies && companies.length > 0 ? (
          companies.map((company) => (
            <div
              key={company.symbol || company.Symbol || Math.random()}
              className={`company-item ${selectedSymbol === (company.symbol || company.Symbol) ? 'active' : ''}`}
              onClick={() => onSelect(company.symbol || company.Symbol)}
            >
              <div className="company-avatar">
                <span>{(company.name || company.Name || 'UK')[0]}</span>
              </div>
              <div className="company-info">
                <div className="company-name">
                  {company.name || company.Name || 'Unknown Company'}
                </div>
                <div className="company-symbol">
                  {company.symbol || company.Symbol || 'N/A'}
                </div>
              </div>
              <div className="company-status">
                <div className="status-indicator active"></div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-companies">
            <span className="no-data-icon">📊</span>
            <p>No companies available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// StockChart Component
function StockChart({ symbol, data, loading }) {
  console.log('StockChart rendering with data:', data);
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-date">{label}</span>
          </div>
          <div className="tooltip-content">
            <div className="tooltip-item">
              <span className="tooltip-label">Close Price:</span>
              <span className="tooltip-value">${payload[0].value.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle different possible data formats
  const chartData = data.map(item => ({
    date: item.date || item.Date || item.timestamp || 'N/A',
    price: parseFloat(item.price || item.Price || item.close || item.Close || 0)
  }));

  // Calculate price change
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const previousPrice = chartData.length > 1 ? chartData[0].price : 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice !== 0 ? (priceChange / previousPrice) * 100 : 0;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="stock-info">
          <h2 className="stock-symbol">{symbol}</h2>
          <div className="stock-price">
            <span className="current-price">${currentPrice.toFixed(2)}</span>
            <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 
              ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="chart-controls">
          <button className="time-btn active">1M</button>
          <button className="time-btn">3M</button>
          <button className="time-btn">6M</button>
          <button className="time-btn">1Y</button>
        </div>
      </div>
      
      <div className="chart-wrapper">
        {loading ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>Loading chart data...</p>
          </div>
        ) : chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-chart-data">
            <span className="no-data-icon">📈</span>
            <h3>No Data Available</h3>
            <p>Unable to load stock data for {symbol}</p>
          </div>
        )}
      </div>
      
      <div className="chart-footer">
        <div className="market-stats">
          <div className="stat-item">
            <span className="stat-label">Volume</span>
            <span className="stat-value">2.4M</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Market Cap</span>
            <span className="stat-value">$2.1T</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">P/E Ratio</span>
            <span className="stat-value">28.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [companies, setCompanies] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    console.log('Fetching companies from:', `${BASE_URL}/companies`);
    setLoading(true);
    
    fetch(`${BASE_URL}/companies`)
      .then(response => response.json())
      .then((data) => {
        console.log('Companies response:', data);
        setCompanies(data || []);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching companies:', err);
        setCompanies([]);
        setError('Failed to load companies');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      console.log('Fetching stock data for:', selectedSymbol);
      setLoading(true);
      setError(null);
      
      fetch(`${BASE_URL}/stock/${selectedSymbol}`)
        .then(response => response.json())
        .then((data) => {
          console.log('Stock data response:', data);
          setStockData(data || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching stock data:', err);
          setStockData([]);
          setError('Failed to load stock data');
          setLoading(false);
        });
    }
  }, [selectedSymbol]);

  return (
    <div className="app">
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .app {
          display: flex;
          height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        /* Sidebar Styles */
        .sidebar {
          width: 350px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .sidebar-header {
          padding: 30px 25px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .logo-icon {
          font-size: 32px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        .logo h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .subtitle {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }

        .search-container {
          position: relative;
          margin: 20px;
          margin-bottom: 10px;
        }

        .search-input {
          width: 100%;
          padding: 12px 45px 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          background: #f9fafb;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .companies-list {
          flex: 1;
          overflow: auto;
          padding: 0 20px 20px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding: 0 5px;
        }

        .list-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .company-count {
          background: #6366f1;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .company-item {
          display: flex;
          align-items: center;
          padding: 16px;
          margin-bottom: 8px;
          background: white;
          border: 2px solid #f3f4f6;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .company-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          transition: left 0.5s;
        }

        .company-item:hover::before {
          left: 100%;
        }

        .company-item:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
        }

        .company-item.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-color: #6366f1;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
        }

        .company-avatar {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: #6366f1;
          margin-right: 15px;
          flex-shrink: 0;
        }

        .company-item.active .company-avatar {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .company-info {
          flex: 1;
          min-width: 0;
        }

        .company-name {
          font-weight: 600;
          font-size: 16px;
          color: #1f2937;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .company-item.active .company-name {
          color: white;
        }

        .company-symbol {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .company-item.active .company-symbol {
          color: rgba(255, 255, 255, 0.8);
        }

        .company-status {
          margin-left: 12px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          position: relative;
        }

        .status-indicator.active::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 50%;
          border: 2px solid #10b981;
          animation: pulse 2s infinite;
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          padding: 30px;
          background: transparent;
          overflow: hidden;
        }

        .chart-container {
          height: 100%;
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .chart-header {
          padding: 30px;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stock-info h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .stock-price {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .current-price {
          font-size: 24px;
          font-weight: 700;
        }

        .price-change {
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }

        .price-change.positive {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .price-change.negative {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .chart-controls {
          display: flex;
          gap: 8px;
        }

        .time-btn {
          padding: 8px 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .time-btn:hover, .time-btn.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .chart-wrapper {
          flex: 1;
          padding: 30px;
          min-height: 400px;
          position: relative;
        }

        .chart-loading, .no-chart-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        .no-data-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .chart-footer {
          padding: 20px 30px;
          border-top: 1px solid #f3f4f6;
          background: #f9fafb;
        }

        .market-stats {
          display: flex;
          justify-content: space-around;
        }

        .stat-item {
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .custom-tooltip {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
        }

        .tooltip-header {
          margin-bottom: 8px;
        }

        .tooltip-date {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .tooltip-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tooltip-label {
          color: #6b7280;
          font-size: 14px;
        }

        .tooltip-value {
          color: #6366f1;
          font-weight: 700;
          font-size: 16px;
        }

        .welcome-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: #6b7280;
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          margin: 30px;
          padding: 60px;
        }

        .welcome-icon {
          font-size: 120px;
          margin-bottom: 30px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-title {
          font-size: 36px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .welcome-subtitle {
          font-size: 18px;
          color: #6b7280;
          max-width: 400px;
          line-height: 1.6;
        }

        .no-companies {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Scrollbar Styling */
        .companies-list::-webkit-scrollbar {
          width: 6px;
        }

        .companies-list::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .companies-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .companies-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .app {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            height: 300px;
          }
          
          .companies-list {
            max-height: 200px;
          }
        }
      `}</style>
      
      <Sidebar companies={companies} onSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} />
      
      <div className="main-content">
        {selectedSymbol ? (
          <StockChart symbol={selectedSymbol} data={stockData} loading={loading} />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-icon">📊</div>
            <h2 className="welcome-title">Welcome to Stock Dashboard</h2>
            <p className="welcome-subtitle">
              Select a company from the sidebar to view real-time stock data and interactive charts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
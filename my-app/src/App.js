import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, BarChart3, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const StockDashboard = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [stats, setStats] = useState({});

  // API base URL - change this to your FastAPI server URL
  const API_BASE_URL = 'http://localhost:8000/api';

  const styles = {
    container: {
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    },
    layout: {
      display: 'flex',
      height: '100vh'
    },
    sidebar: {
      width: '350px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
    },
    sidebarHeader: {
      padding: '24px',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    },
    sidebarTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      margin: 0,
      fontSize: '20px',
      fontWeight: 'bold'
    },
    sidebarSubtitle: {
      margin: '8px 0 0 0',
      fontSize: '14px',
      opacity: 0.9,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      marginTop: '8px'
    },
    companyListContainer: {
      flex: 1,
      overflow: 'hidden'
    },
    companyListHeader: {
      padding: '20px 24px 16px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    companyListTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0
    },
    refreshButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    companyListScroll: {
      height: 'calc(100vh - 240px)',
      overflowY: 'auto',
      overflowX: 'hidden'
    },
    companyItem: {
      padding: '16px 24px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      borderBottom: '1px solid #f1f5f9',
      position: 'relative'
    },
    companyItemActive: {
      backgroundColor: '#eff6ff',
      borderLeft: '4px solid #3b82f6'
    },
    companyItemFlex: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    companyInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1
    },
    companyLogo: {
      fontSize: '20px',
      minWidth: '20px'
    },
    companyDetails: {
      flex: 1,
      minWidth: 0
    },
    companySymbol: {
      fontWeight: '600',
      color: '#1f2937',
      fontSize: '14px',
      margin: '0 0 4px 0'
    },
    companyName: {
      fontSize: '12px',
      color: '#6b7280',
      margin: '0 0 6px 0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    companySector: {
      background: '#f3f4f6',
      color: '#374151',
      padding: '2px 6px',
      borderRadius: '8px',
      fontSize: '10px',
      display: 'inline-block'
    },
    companyPrice: {
      textAlign: 'right'
    },
    companyCurrentPrice: {
      fontWeight: '600',
      fontSize: '14px',
      color: '#1f2937'
    },
    companyChange: {
      fontSize: '12px',
      fontWeight: '500',
      marginTop: '2px'
    },
    activeDot: {
      width: '6px',
      height: '6px',
      background: '#3b82f6',
      borderRadius: '50%',
      animation: 'pulse 2s infinite'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)'
    },
    topBar: {
      padding: '20px 30px',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    topBarLeft: {
      color: 'white'
    },
    topBarTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0
    },
    topBarSubtitle: {
      fontSize: '14px',
      opacity: 0.8,
      margin: '4px 0 0 0'
    },
    topBarRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'white',
      fontSize: '14px',
      opacity: 0.9
    },
    chartArea: {
      flex: 1,
      padding: '30px',
      display: 'flex',
      flexDirection: 'column'
    },
    stockHeader: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    stockHeaderLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    stockLogo: {
      fontSize: '40px'
    },
    stockSymbol: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '0 0 4px 0'
    },
    stockName: {
      color: '#6b7280',
      fontSize: '14px',
      margin: 0
    },
    priceContainer: {
      textAlign: 'right'
    },
    currentPrice: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '0 0 8px 0'
    },
    priceChange: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '600',
      fontSize: '16px',
      justifyContent: 'flex-end'
    },
    priceChangePositive: {
      color: '#059669'
    },
    priceChangeNegative: {
      color: '#dc2626'
    },
    chartPanel: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '24px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      minHeight: 0
    },
    chartContainer: {
      flex: 1,
      minHeight: '300px'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '300px'
    },
    loadingDots: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    loadingDot: {
      width: '12px',
      height: '12px',
      background: '#667eea',
      borderRadius: '50%',
      animation: 'bounce 1.4s infinite ease-in-out'
    },
    emptyState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '300px',
      color: '#6b7280',
      textAlign: 'center'
    },
    errorState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '300px',
      color: '#dc2626',
      textAlign: 'center',
      flexDirection: 'column',
      gap: '16px'
    },
    retryButton: {
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginTop: '20px'
    },
    statItem: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: '500',
      marginBottom: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    statValue: {
      fontWeight: '700',
      fontSize: '16px'
    },
    statValueGreen: {
      color: '#059669'
    },
    statValueRed: {
      color: '#dc2626'
    },
    statValueGray: {
      color: '#1f2937'
    }
  };

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-8px); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .loading-dot-1 { animation-delay: 0s; }
      .loading-dot-2 { animation-delay: 0.2s; }
      .loading-dot-3 { animation-delay: 0.4s; }
      .spin { animation: spin 1s linear infinite; }
      
      .company-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .company-scroll::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 3px;
      }
      .company-scroll::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      .company-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(style);
    
    return () => document.head.removeChild(style);
  }, []);

  // API functions
  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/companies`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data);
      setApiConnected(true);
      
      // Auto-select first company if none selected
      if (!selectedCompany && data.length > 0) {
        handleCompanySelect(data[0]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to connect to API. Using offline mode.');
      setApiConnected(false);
      // Fallback to mock data
      const mockCompanies = [
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Oil & Gas', basePrice: 2450, logo: '🛢️', currentPrice: 2450, priceChange: 0, priceChangePercent: 0 },
        { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services', basePrice: 3850, logo: '💻', currentPrice: 3850, priceChange: 0, priceChangePercent: 0 },
        { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT Services', basePrice: 1650, logo: '🔧', currentPrice: 1650, priceChange: 0, priceChangePercent: 0 }
      ];
      setCompanies(mockCompanies);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const fetchStockData = async (symbol) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/stock/${symbol}?days=30`);
      if (!response.ok) throw new Error('Failed to fetch stock data');
      const data = await response.json();
      
      setStockData(data.prices);
      setStats(data.stats);
      setSelectedCompany(data.company);
      setApiConnected(true);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setError('Failed to load stock data');
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback mock data when API is not available
  const generateMockStockData = (company) => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    let currentPrice = company.basePrice;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const change = (Math.random() - 0.5) * 0.02 * currentPrice;
      currentPrice = Math.max(currentPrice + change, company.basePrice * 0.7);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 500000,
        high: parseFloat((currentPrice * (1 + Math.random() * 0.03)).toFixed(2)),
        low: parseFloat((currentPrice * (1 - Math.random() * 0.03)).toFixed(2)),
        open: parseFloat((currentPrice * (0.98 + Math.random() * 0.04)).toFixed(2))
      });
    }
    
    return data;
  };

  const handleCompanySelect = async (company) => {
    if (apiConnected) {
      await fetchStockData(company.symbol);
    } else {
      // Use mock data when API is not available
      setLoading(true);
      setSelectedCompany(company);
      setTimeout(() => {
        const mockData = generateMockStockData(company);
        setStockData(mockData);
        const current = mockData[mockData.length - 1].price;
        const previous = mockData[mockData.length - 2].price;
        setStats({
          current_price: current,
          price_change: current - previous,
          price_change_percent: ((current - previous) / previous) * 100,
          high_52w: Math.max(...mockData.map(d => d.high)),
          low_52w: Math.min(...mockData.map(d => d.low)),
          avg_volume: mockData.reduce((sum, d) => sum + d.volume, 0) / mockData.length
        });
        setLoading(false);
      }, 800);
    }
  };

  const getCurrentPrice = () => {
    if (apiConnected && stats.current_price) {
      return stats.current_price;
    }
    if (stockData.length === 0) return selectedCompany?.basePrice || 0;
    return stockData[stockData.length - 1].price;
  };

  const getPriceChange = () => {
    if (apiConnected && stats.price_change !== undefined) {
      return { 
        change: stats.price_change.toFixed(2), 
        percentage: stats.price_change_percent.toFixed(2) 
      };
    }
    if (stockData.length < 2) return { change: 0, percentage: 0 };
    const current = stockData[stockData.length - 1].price;
    const previous = stockData[stockData.length - 2].price;
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return { change: change.toFixed(2), percentage: percentage.toFixed(2) };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', margin: 0 }}>
            {new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const priceChange = getPriceChange();
  const isPositive = parseFloat(priceChange.change) >= 0;

  return (
    <div style={styles.container}>
      <div style={styles.layout}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h1 style={styles.sidebarTitle}>
              <BarChart3 size={24} />
              Stock Dashboard
            </h1>
            <p style={styles.sidebarSubtitle}>
              Market Insights
              <div style={styles.connectionStatus}>
                {apiConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {apiConnected ? 'Live Data' : 'Offline Mode'}
              </div>
            </p>
          </div>
          
          <div style={styles.companyListContainer}>
            <div style={styles.companyListHeader}>
              <h2 style={styles.companyListTitle}>
                <DollarSign size={18} color="#059669" />
                Companies
              </h2>
              <button
                style={styles.refreshButton}
                onClick={fetchCompanies}
                disabled={companiesLoading}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <RefreshCw size={16} className={companiesLoading ? 'spin' : ''} />
              </button>
            </div>
            
            <div style={styles.companyListScroll} className="company-scroll">
              {companiesLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={styles.loadingDots}>
                    <div style={styles.loadingDot} className="loading-dot-1"></div>
                    <div style={styles.loadingDot} className="loading-dot-2"></div>
                    <div style={styles.loadingDot} className="loading-dot-3"></div>
                  </div>
                </div>
              ) : (
                companies.map((company) => (
                  <div
                    key={company.symbol}
                    onClick={() => handleCompanySelect(company)}
                    style={{
                      ...styles.companyItem,
                      ...(selectedCompany?.symbol === company.symbol ? styles.companyItemActive : {})
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCompany?.symbol !== company.symbol) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCompany?.symbol !== company.symbol) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={styles.companyItemFlex}>
                      <div style={styles.companyInfo}>
                        <span style={styles.companyLogo}>{company.logo}</span>
                        <div style={styles.companyDetails}>
                          <h3 style={styles.companySymbol}>{company.symbol}</h3>
                          <p style={styles.companyName}>{company.name}</p>
                          <span style={styles.companySector}>{company.sector}</span>
                        </div>
                      </div>
                      <div style={styles.companyPrice}>
                        {company.currentPrice && (
                          <>
                            <div style={styles.companyCurrentPrice}>
                              ₹{company.currentPrice.toLocaleString('en-IN')}
                            </div>
                            <div style={{
                              ...styles.companyChange,
                              color: company.priceChange >= 0 ? '#059669' : '#dc2626'
                            }}>
                              {company.priceChange >= 0 ? '+' : ''}
                              {company.priceChangePercent?.toFixed(2)}%
                            </div>
                          </>
                        )}
                      </div>
                      {selectedCompany?.symbol === company.symbol && (
                        <div style={styles.activeDot}></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          <div style={styles.topBar}>
            <div style={styles.topBarLeft}>
              <h2 style={styles.topBarTitle}>Market Analysis</h2>
              <p style={styles.topBarSubtitle}>
                {apiConnected ? 'Real-time stock performance' : 'Demo mode - Sample data'}
              </p>
            </div>
            <div style={styles.topBarRight}>
              <Clock size={16} />
              <span>{new Date().toLocaleString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: 'short'
              })}</span>
            </div>
          </div>

          <div style={styles.chartArea}>
            {selectedCompany ? (
              <>
                <div style={styles.stockHeader}>
                  <div style={styles.stockHeaderLeft}>
                    <span style={styles.stockLogo}>{selectedCompany.logo}</span>
                    <div>
                      <h2 style={styles.stockSymbol}>{selectedCompany.symbol}</h2>
                      <p style={styles.stockName}>{selectedCompany.name}</p>
                    </div>
                  </div>
                  <div style={styles.priceContainer}>
                    <div style={styles.currentPrice}>
                      ₹{getCurrentPrice().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{
                      ...styles.priceChange,
                      ...(isPositive ? styles.priceChangePositive : styles.priceChangeNegative)
                    }}>
                      {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      <span>
                        {isPositive ? '+' : ''}₹{priceChange.change} ({priceChange.percentage}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div style={styles.chartPanel}>
                  <div style={styles.chartContainer}>
                    {loading ? (
                      <div style={styles.loadingContainer}>
                        <div style={styles.loadingDots}>
                          <div style={styles.loadingDot} className="loading-dot-1"></div>
                          <div style={styles.loadingDot} className="loading-dot-2"></div>
                          <div style={styles.loadingDot} className="loading-dot-3"></div>
                        </div>
                      </div>
                    ) : error && !stockData.length ? (
                      <div style={styles.errorState}>
                        <WifiOff size={48} />
                        <p>{error}</p>
                        <button 
                          style={styles.retryButton}
                          onClick={() => handleCompanySelect(selectedCompany)}
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stockData}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#667eea" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#667eea" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.3)" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={(date) => {
                              const d = new Date(date);
                              return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={(value) => `₹${value.toFixed(0)}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#667eea"
                            strokeWidth={3}
                            fill="url(#colorPrice)"
                            dot={false}
                            activeDot={{ r: 5, stroke: '#667eea', strokeWidth: 2, fill: '#ffffff' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {!loading && stockData.length > 0 && (
                    <div style={styles.statsRow}>
                      <div style={styles.statItem}>
                        <p style={styles.statLabel}>High</p>
                        <p style={{...styles.statValue, ...styles.statValueGreen}}>
                          ₹{(stats.high_52w || Math.max(...stockData.map(d => d.high))).toFixed(2)}
                        </p>
                      </div>
                      <div style={styles.statItem}>
                        <p style={styles.statLabel}>Low</p>
                        <p style={{...styles.statValue, ...styles.statValueRed}}>
                          ₹{(stats.low_52w || Math.min(...stockData.map(d => d.low))).toFixed(2)}
                        </p>
                      </div>
                      <div style={styles.statItem}>
                        <p style={styles.statLabel}>Volume</p>
                        <p style={{...styles.statValue, ...styles.statValueGray}}>
                          {((stats.avg_volume || stockData.reduce((sum, d) => sum + d.volume, 0) / stockData.length) / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div style={styles.statItem}>
                        <p style={styles.statLabel}>Range</p>
                        <p style={{...styles.statValue, ...styles.statValueGray}}>30D</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={styles.chartPanel}>
                <div style={styles.emptyState}>
                  <div>
                    <Activity size={48} color="rgba(255, 255, 255, 0.3)" style={{margin: '0 auto 16px'}} />
                    <p style={{color: 'white'}}>Select a company to view stock data</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;
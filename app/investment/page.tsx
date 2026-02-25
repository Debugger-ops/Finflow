'use client';

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  TrendingUp,
  Upload,
  Plus,
  DollarSign,
  LineChart,
  PieChart as PieIcon,
  Activity,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Settings,
  Bell,
  Search,
  MoreVertical,
  Star,
  BarChart3,
  Globe,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './investment.css';

// --- Types ---
interface Portfolio {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  allocation: number;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'red';
  icon: React.ElementType;
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  shares?: number;
  value?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: string;
  targetPrice?: number;
  stopLoss?: number;
}

interface Transaction {
  id: number;
  type: 'buy' | 'sell' | 'dividend';
  symbol: string;
  name: string;
  amount: number;
  shares?: number;
  price?: number;
  date: string;
  time: string;
}

interface PerformanceMetric {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ElementType;
  color: string;
}

interface Alert {
  symbol: string;
  message: string;
  type: 'target' | 'stopLoss';
}

// --- Component ---
const Investments: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [activeView, setActiveView] = useState<'overview' | 'holdings' | 'transactions'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'stocks' | 'crypto' | 'etfs' | 'bonds'>('all');
  const [alerts, setAlerts] = useState<
  { id: number; message: string }[]
>([]);

const addAlert = (message: string) => {
  const newAlert = {
    id: Date.now() + Math.random(), // Ensures unique ID
    message: message
  };
  
  setAlerts(prev => [...prev, newAlert]);
};
const removeAlert = (id: number) => {
  setAlerts(prev => prev.filter(alert => alert.id !== id));   
};

  const myStocks: Stock[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.42, change: 2.35, changePercent: 1.33, shares: 50, value: 8921, dayHigh: 179.85, dayLow: 176.20, volume: '52.3M', targetPrice: 185, stopLoss: 170 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 412.78, change: 5.67, changePercent: 1.39, shares: 25, value: 10319.50, dayHigh: 415.20, dayLow: 409.50, volume: '23.1M', targetPrice: 430, stopLoss: 400 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -1.20, changePercent: -0.84, shares: 40, value: 5672, dayHigh: 143.50, dayLow: 141.00, volume: '18.7M', targetPrice: 150, stopLoss: 135 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: 8.90, changePercent: 3.71, shares: 30, value: 7455, dayHigh: 252.00, dayLow: 242.30, volume: '95.2M', targetPrice: 260, stopLoss: 230 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 12.45, changePercent: 1.44, shares: 15, value: 13129.20, dayHigh: 880.00, dayLow: 868.50, volume: '41.5M', targetPrice: 900, stopLoss: 850 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: -2.15, changePercent: -1.19, shares: 35, value: 6238.75, dayHigh: 181.00, dayLow: 177.50, volume: '35.8M', targetPrice: 190, stopLoss: 170 },
  ];

  const [liveStocks, setLiveStocks] = useState<Stock[]>(myStocks);

  const portfolioHoldings: Portfolio[] = [
    { name: 'US Stocks', value: 18500, change: 850, changePercent: 4.8, allocation: 57, color: 'emerald', icon: TrendingUp },
    { name: 'Cryptocurrency', value: 8200, change: 320, changePercent: 4.1, allocation: 25, color: 'amber', icon: Globe },
    { name: 'Bonds', value: 3750, change: 45, changePercent: 1.2, allocation: 12, color: 'blue', icon: DollarSign },
    { name: 'ETFs', value: 2000, change: 30, changePercent: 1.5, allocation: 6, color: 'purple', icon: PieIcon },
  ];

  const recentTransactions: Transaction[] = [
    { id: 1, type: 'buy', symbol: 'AAPL', name: 'Apple Inc.', amount: -8910, shares: 50, price: 178.20, date: '2024-02-05', time: '09:30 AM' },
    { id: 2, type: 'dividend', symbol: 'MSFT', name: 'Microsoft Corp.', amount: 125.50, date: '2024-02-04', time: '12:00 PM' },
    { id: 3, type: 'sell', symbol: 'TSLA', name: 'Tesla Inc.', amount: 2485, shares: 10, price: 248.50, date: '2024-02-03', time: '02:15 PM' },
    { id: 4, type: 'buy', symbol: 'NVDA', name: 'NVIDIA Corp.', amount: -4376.40, shares: 5, price: 875.28, date: '2024-02-02', time: '10:45 AM' },
    { id: 5, type: 'dividend', symbol: 'AAPL', name: 'Apple Inc.', amount: 48.50, date: '2024-02-01', time: '12:00 PM' },
  ];

  const investmentValue = liveStocks.reduce((sum, s) => sum + (s.value ?? 0), 0);
  const totalInvested = 28500;
  const investmentChange = investmentValue - totalInvested;
  const investmentChangePercent = (investmentChange / totalInvested) * 100;
  const totalReturn = investmentChange;
  const totalReturnPercent = investmentChangePercent;

  const performanceMetrics: PerformanceMetric[] = [
    { label: "Today's Gain", value: `$${investmentChange.toLocaleString()}`, change: `${investmentChange >= 0 ? '+' : ''}${investmentChangePercent.toFixed(2)}%`, isPositive: investmentChange >= 0, icon: TrendingUp, color: 'emerald' },
    { label: 'Total Return', value: `$${totalReturn.toLocaleString()}`, change: `${totalReturn >= 0 ? '+' : ''}${totalReturnPercent.toFixed(2)}%`, isPositive: totalReturn >= 0, icon: Activity, color: 'blue' },
    { label: 'Dividend Income', value: '$284.50', change: 'This month', icon: DollarSign, color: 'purple' },
    { label: 'Total Invested', value: `$${totalInvested.toLocaleString()}`, icon: DollarSign, color: 'amber' },
  ];

  // AI Suggestions based on stock prices
  const getAISuggestion = (stock: Stock): string => {
    const priceToTarget = stock.targetPrice ? ((stock.targetPrice - stock.price) / stock.price) * 100 : 0;
    const priceToStopLoss = stock.stopLoss ? ((stock.price - stock.stopLoss) / stock.price) * 100 : 0;

    if (priceToTarget > 10) return 'Strong Buy';
    if (priceToTarget > 5) return 'Buy';
    if (priceToStopLoss < 5) return 'Consider Selling';
    if (stock.changePercent > 3) return 'Hold & Monitor';
    return 'Hold';
  };

  useEffect(() => {
    setIsClient(true);
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // --- Fetch Live Prices ---
  useEffect(() => {
    const fetchLivePrices = async () => {
      const symbols = myStocks.map(s => s.symbol).join(',');
      try {
        const res = await fetch(`/api/prices?symbols=${symbols}`);
        const data = await res.json();

        setLiveStocks(myStocks.map(stock => ({
          ...stock,
          price: data[stock.symbol]?.price ?? stock.price,
          change: data[stock.symbol]?.change ?? stock.change,
          changePercent: data[stock.symbol]?.changePercent ?? stock.changePercent,
          value: stock.shares ? stock.shares * (data[stock.symbol]?.price ?? stock.price) : stock.value
        })));
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // --- Check Alerts ---
  useEffect(() => {
    const newAlerts: Alert[] = [];
    liveStocks.forEach(stock => {
      if (stock.targetPrice && stock.price >= stock.targetPrice) {
        newAlerts.push({
          symbol: stock.symbol,
          message: `${stock.symbol} reached target price of $${stock.targetPrice}!`,
          type: 'target'
        });
      }
      if (stock.stopLoss && stock.price <= stock.stopLoss) {
        newAlerts.push({
          symbol: stock.symbol,
          message: `${stock.symbol} hit stop-loss at $${stock.stopLoss}!`,
          type: 'stopLoss'
        });
      }
    });
    newAlerts.forEach(alert => addAlert(alert.message));
  }, [liveStocks]);

  const filteredStocks = liveStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isClient || status === "loading") {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your investments...</p>
      </div>
    );
  }

  if (!session) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const pieColors = {
    emerald: '#10B981',
    amber: '#F59E0B',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    red: '#EF4444'
  };

  return (
    <div className="investments-page">
      {/* Back Button */}
      <button className="back-button" onClick={() => router.push('/dashboard')}>
        <ArrowLeft size={20} />
        Dashboard
      </button>

      {/* Toast Notifications */}
     {alerts.length > 0 && (
  <div className="alerts-toast-container">
    {alerts.map((alert) => (
      <div key={alert.id} className="alert-toast">
        <div className="alert-content">
          <span className="alert-icon">⚡</span>
          <span className="alert-message">{alert.message}</span>
        </div>
        <button
          className="alert-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            setAlerts(prev => prev.filter(a => a.id !== alert.id));
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}



      {/* Header */}
      <div className="investments-header">
        <div className="header-top">
          <div className="header-title">
            <h1>Investment Portfolio</h1>
            <p>Track and manage your investments</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleRefresh}>
              <RefreshCw size={18} className={isRefreshing ? 'spinning' : ''} />
            </button>
            <button className="icon-btn">
              <Download size={18} />
            </button>
            <button className="icon-btn">
              <Bell size={18} />
            </button>
            <button className="icon-btn">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="view-tabs">
          <button
            className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <BarChart3 size={18} />
            Overview
          </button>
          <button
            className={`view-tab ${activeView === 'holdings' ? 'active' : ''}`}
            onClick={() => setActiveView('holdings')}
          >
            <PieIcon size={18} />
            Holdings
          </button>
          <button
            className={`view-tab ${activeView === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveView('transactions')}
          >
            <Clock size={18} />
            Transactions
          </button>
        </div>
      </div>

      {/* Portfolio Summary Card */}
      <div className="portfolio-summary-card">
        <div className="summary-content">
          <div className="summary-left">
            <div className="summary-icon">
              <LineChart size={28} />
            </div>
            <div className="summary-info">
              <p className="summary-label">Total Portfolio Value</p>
              <h2 className="summary-value">
                ${investmentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className={`summary-change ${investmentChange >= 0 ? 'positive' : 'negative'}`}>
                {investmentChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>
                  {investmentChange >= 0 ? '+' : ''}${Math.abs(investmentChange).toLocaleString()} 
                  ({investmentChangePercent.toFixed(2)}%) today
                </span>
              </div>
            </div>
          </div>
          <div className="summary-actions">
            <button className="action-btn primary" onClick={() => router.push('/buy-stocks')}>
              <Plus size={18} />
              Buy Assets
            </button>
            <button className="action-btn secondary" onClick={() => router.push('/sell-stocks')}>
              <Upload size={18} />
              Sell
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="period-selector">
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((period) => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        {performanceMetrics.map((metric, idx) => (
          <div key={idx} className="metric-card">
            <div className={`metric-icon ${metric.color}`}>
              <metric.icon size={20} />
            </div>
            <div className="metric-content">
              <p className="metric-label">{metric.label}</p>
              <h3 className="metric-value">{metric.value}</h3>
              {metric.change && (
                <span className={`metric-change ${metric.isPositive ? 'positive' : ''}`}>
                  {metric.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      {activeView === 'overview' && (
        <div className="overview-grid">
          {/* Portfolio Allocation */}
          <div className="allocation-card">
            <div className="card-header">
              <h3>Portfolio Allocation</h3>
              <button className="text-btn">
                Rebalance
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="allocation-chart">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={portfolioHoldings}
                    dataKey="allocation"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ index }) => {
    const entry = portfolioHoldings[index!]; // Get the original data object
    return `${entry.name}: ${entry.allocation}%`; // Now allocation exists
  }}
                  >
                    {portfolioHoldings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[entry.color]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="allocation-list">
              {portfolioHoldings.map((holding, idx) => (
                <div key={idx} className="allocation-item">
                  <div className="allocation-header">
                    <div className="allocation-left">
                      <div className={`allocation-indicator ${holding.color}`}></div>
                      <holding.icon size={16} />
                      <span className="allocation-name">{holding.name}</span>
                    </div>
                    <span className="allocation-percentage">{holding.allocation}%</span>
                  </div>
                  <div className="allocation-details">
                    <span className="allocation-value">${holding.value.toLocaleString()}</span>
                    <span className={`allocation-change ${holding.change >= 0 ? 'positive' : 'negative'}`}>
                      {holding.change >= 0 ? '+' : ''}${Math.abs(holding.change).toLocaleString()} 
                      ({holding.changePercent}%)
                    </span>
                  </div>
                  <div className="allocation-progress">
                    <div
                      className={`progress-fill ${holding.color}`}
                      style={{ width: `${holding.allocation}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="ai-suggestions-card">
            <div className="card-header">
              <h3>AI Investment Suggestions</h3>
              <span className="ai-badge">AI-Powered</span>
            </div>
            <div className="suggestions-list">
              {liveStocks.map((stock, idx) => (
                <div key={idx} className="suggestion-item">
                  <div className="suggestion-header">
                    <div className="stock-info">
                      <h4>{stock.symbol}</h4>
                      <p>${stock.price.toFixed(2)}</p>
                    </div>
                    <span className={`suggestion-badge ${getAISuggestion(stock).toLowerCase().replace(/\s+/g, '-')}`}>
                      {getAISuggestion(stock)}
                    </span>
                  </div>
                  <div className="suggestion-details">
                    <div className="detail-item">
                      <span className="label">Target:</span>
                      <span className="value">${stock.targetPrice}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Stop Loss:</span>
                      <span className="value">${stock.stopLoss}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Potential:</span>
                      <span className="value positive">
                        +{stock.targetPrice ? (((stock.targetPrice - stock.price) / stock.price) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Holdings */}
          <div className="holdings-card">
            <div className="card-header">
              <h3>Top Holdings</h3>
              <button className="text-btn" onClick={() => setActiveView('holdings')}>
                View All
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="holdings-list">
              {liveStocks.slice(0, 5).map((stock, idx) => (
                <div key={idx} className="holding-item" onClick={() => router.push(`/stock/${stock.symbol}`)}>
                  <div className="holding-left">
                    <div className="stock-icon">
                      <LineChart size={18} />
                    </div>
                    <div className="holding-info">
                      <h4 className="holding-symbol">{stock.symbol}</h4>
                      <p className="holding-name">{stock.name}</p>
                      <span className="holding-shares">{stock.shares} shares</span>
                    </div>
                  </div>
                  <div className="holding-right">
                    <div className="holding-price">${stock.price.toFixed(2)}</div>
                    <div className={`holding-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change >= 0 ? '+' : ''}${Math.abs(stock.change).toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </div>
                    <div className="holding-value">${stock.value?.toLocaleString()}</div>
                  </div>
                  <ChevronRight size={18} className="holding-arrow" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <button className="text-btn" onClick={() => setActiveView('transactions')}>
                View All
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="activity-list">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="activity-item">
                  <div className={`activity-type-icon ${transaction.type}`}>
                    {transaction.type === 'buy' && <ArrowDownRight size={16} />}
                    {transaction.type === 'sell' && <ArrowUpRight size={16} />}
                    {transaction.type === 'dividend' && <DollarSign size={16} />}
                  </div>
                  <div className="activity-info">
                    <h4 className="activity-title">
                      {transaction.type === 'buy' && 'Bought'}
                      {transaction.type === 'sell' && 'Sold'}
                      {transaction.type === 'dividend' && 'Dividend from'}
                      {' '}{transaction.symbol}
                    </h4>
                    <p className="activity-details">
                      {transaction.shares && `${transaction.shares} shares @ $${transaction.price}`}
                      {transaction.type === 'dividend' && transaction.name}
                    </p>
                    <span className="activity-date">{transaction.date} • {transaction.time}</span>
                  </div>
                  <div className={`activity-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'holdings' && (
        <div className="holdings-view">
          {/* Search and Filter */}
          <div className="holdings-controls">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search stocks, ETFs, crypto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              {(['all', 'stocks', 'crypto', 'etfs', 'bonds'] as const).map((type) => (
                <button
                  key={type}
                  className={`filter-btn ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Holdings Table */}
          <div className="holdings-table-card">
            <div className="table-header">
              <div className="table-cell">Asset</div>
              <div className="table-cell">Price</div>
              <div className="table-cell">24h Change</div>
              <div className="table-cell">Holdings</div>
              <div className="table-cell">Value</div>
              <div className="table-cell">Actions</div>
            </div>
            <div className="table-body">
              {filteredStocks.map((stock, idx) => (
                <div key={idx} className="table-row" onClick={() => router.push(`/stock/${stock.symbol}`)}>
                  <div className="table-cell asset-cell">
                    <div className="asset-icon">
                      <LineChart size={20} />
                    </div>
                    <div className="asset-info">
                      <h4>{stock.symbol}</h4>
                      <p>{stock.name}</p>
                    </div>
                  </div>
                  <div className="table-cell price-cell">
                    <div className="price-info">
                      <span className="price">${stock.price.toFixed(2)}</span>
                      <span className="range">H: ${stock.dayHigh} L: ${stock.dayLow}</span>
                    </div>
                  </div>
                  <div className="table-cell change-cell">
                    <div className={`change-badge ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                    </div>
                    <span className="change-amount">
                      {stock.change >= 0 ? '+' : ''}${Math.abs(stock.change).toFixed(2)}
                    </span>
                  </div>
                  <div className="table-cell holdings-cell">
                    <span className="shares">{stock.shares} shares</span>
                    <span className="volume">Vol: {stock.volume}</span>
                  </div>
                  <div className="table-cell value-cell">
                    <span className="value">${stock.value?.toLocaleString()}</span>
                  </div>
                  <div className="table-cell actions-cell">
                    <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); }}>
                      <Star size={16} />
                    </button>
                    <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); }}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'transactions' && (
        <div className="transactions-view">
          <div className="transactions-header">
            <div className="transactions-filters">
              <button className="filter-btn active">All</button>
              <button className="filter-btn">Buys</button>
              <button className="filter-btn">Sells</button>
              <button className="filter-btn">Dividends</button>
            </div>
            <button className="export-btn">
              <Download size={16} />
              Export
            </button>
          </div>

          <div className="transactions-table-card">
            <div className="table-header">
              <div className="table-cell">Type</div>
              <div className="table-cell">Asset</div>
              <div className="table-cell">Shares/Price</div>
              <div className="table-cell">Amount</div>
              <div className="table-cell">Date & Time</div>
            </div>
            <div className="table-body">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="table-row">
                  <div className="table-cell type-cell">
                    <div className={`type-badge ${transaction.type}`}>
                      {transaction.type === 'buy' && <ArrowDownRight size={14} />}
                      {transaction.type === 'sell' && <ArrowUpRight size={14} />}
                      {transaction.type === 'dividend' && <DollarSign size={14} />}
                      <span>{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
                    </div>
                  </div>
                  <div className="table-cell asset-cell">
                    <div className="asset-info">
                      <h4>{transaction.symbol}</h4>
                      <p>{transaction.name}</p>
                    </div>
                  </div>
                  <div className="table-cell shares-cell">
                    {transaction.shares ? (
                      <>
                        <span className="shares">{transaction.shares} shares</span>
                        <span className="price">@ ${transaction.price?.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="dividend-label">Dividend Payment</span>
                    )}
                  </div>
                  <div className="table-cell amount-cell">
                    <span className={`amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                      {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="table-cell date-cell">
                    <div className="date-info">
                      <span className="date">{transaction.date}</span>
                      <span className="time">{transaction.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
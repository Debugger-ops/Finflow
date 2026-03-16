'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, TrendingUp, Upload, Plus, DollarSign,
  LineChart, PieChart as PieIcon, Activity, ArrowLeft,
  ArrowUpRight, ArrowDownRight, RefreshCw, Download,
  Settings, Bell, Search, MoreVertical, Star, BarChart3,
  Globe, Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './investment.css';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
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

interface Toast {
  id: number;
  message: string;
}

// ─────────────────────────────────────────────
// Static data (defined outside component to avoid re-creation)
// ─────────────────────────────────────────────
const BASE_STOCKS: Stock[] = [
  { symbol: 'AAPL',  name: 'Apple Inc.',       price: 178.42, change:  2.35, changePercent:  1.33, shares: 50, value:  8_921.00, dayHigh: 179.85, dayLow: 176.20, volume: '52.3M', targetPrice: 185, stopLoss: 170 },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',  price: 412.78, change:  5.67, changePercent:  1.39, shares: 25, value: 10_319.50, dayHigh: 415.20, dayLow: 409.50, volume: '23.1M', targetPrice: 430, stopLoss: 400 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',    price: 141.80, change: -1.20, changePercent: -0.84, shares: 40, value:  5_672.00, dayHigh: 143.50, dayLow: 141.00, volume: '18.7M', targetPrice: 150, stopLoss: 135 },
  { symbol: 'TSLA',  name: 'Tesla Inc.',       price: 248.50, change:  8.90, changePercent:  3.71, shares: 30, value:  7_455.00, dayHigh: 252.00, dayLow: 242.30, volume: '95.2M', targetPrice: 260, stopLoss: 230 },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',     price: 875.28, change: 12.45, changePercent:  1.44, shares: 15, value: 13_129.20, dayHigh: 880.00, dayLow: 868.50, volume: '41.5M', targetPrice: 900, stopLoss: 850 },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',  price: 178.25, change: -2.15, changePercent: -1.19, shares: 35, value:  6_238.75, dayHigh: 181.00, dayLow: 177.50, volume: '35.8M', targetPrice: 190, stopLoss: 170 },
];

const PORTFOLIO_HOLDINGS: Portfolio[] = [
  { name: 'US Stocks',     value: 18_500, change: 850, changePercent: 4.8, allocation: 57, color: 'emerald', icon: TrendingUp  },
  { name: 'Cryptocurrency',value:  8_200, change: 320, changePercent: 4.1, allocation: 25, color: 'amber',   icon: Globe       },
  { name: 'Bonds',         value:  3_750, change:  45, changePercent: 1.2, allocation: 12, color: 'blue',    icon: DollarSign  },
  { name: 'ETFs',          value:  2_000, change:  30, changePercent: 1.5, allocation:  6, color: 'purple',  icon: PieIcon     },
];

const RECENT_TRANSACTIONS: Transaction[] = [
  { id: 1, type: 'buy',      symbol: 'AAPL',  name: 'Apple Inc.',      amount:  -8_910.00, shares: 50, price: 178.20, date: '2024-02-05', time: '09:30 AM' },
  { id: 2, type: 'dividend', symbol: 'MSFT',  name: 'Microsoft Corp.', amount:     125.50,                             date: '2024-02-04', time: '12:00 PM' },
  { id: 3, type: 'sell',     symbol: 'TSLA',  name: 'Tesla Inc.',      amount:   2_485.00, shares: 10, price: 248.50, date: '2024-02-03', time: '02:15 PM' },
  { id: 4, type: 'buy',      symbol: 'NVDA',  name: 'NVIDIA Corp.',    amount:  -4_376.40, shares:  5, price: 875.28, date: '2024-02-02', time: '10:45 AM' },
  { id: 5, type: 'dividend', symbol: 'AAPL',  name: 'Apple Inc.',      amount:      48.50,                             date: '2024-02-01', time: '12:00 PM' },
];

const PIE_COLORS: Record<string, string> = {
  emerald: '#34d399',
  amber:   '#fbbf24',
  blue:    '#60a5fa',
  purple:  '#a78bfa',
  red:     '#fb7185',
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getAISuggestion(stock: Stock): string {
  const toTarget   = stock.targetPrice ? ((stock.targetPrice - stock.price) / stock.price) * 100 : 0;
  const toStopLoss = stock.stopLoss    ? ((stock.price - stock.stopLoss)    / stock.price) * 100 : 100;
  if (toTarget > 10)       return 'Strong Buy';
  if (toTarget > 5)        return 'Buy';
  if (toStopLoss < 5)      return 'Consider Selling';
  if (stock.changePercent > 3) return 'Hold & Monitor';
  return 'Hold';
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ─────────────────────────────────────────────
// Custom Pie Tooltip
// ─────────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card-alt)', border: '1px solid var(--brand-border)',
      borderRadius: 'var(--r-md)', padding: '8px 14px',
      fontSize: '0.8125rem', color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontWeight: 700 }}>{payload[0].name}</p>
      <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{payload[0].value}%</p>
    </div>
  );
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** Single toast notification */
const ToastItem: React.FC<{ toast: Toast; onClose: (id: number) => void }> = ({ toast, onClose }) => (
  <div className="alert-toast" role="alert">
    <div className="alert-content">
      <span className="alert-icon">⚡</span>
      <span className="alert-message">{toast.message}</span>
    </div>
    <button className="alert-close-btn" onClick={() => onClose(toast.id)} aria-label="Dismiss">×</button>
  </div>
);

/** Performance metric card */
const MetricCard: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => (
  <div className="metric-card">
    <div className={`metric-icon ${metric.color}`}><metric.icon size={18} /></div>
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
);

/** Holding row used in the top-holdings card */
const HoldingRow: React.FC<{ stock: Stock; onClick: () => void }> = ({ stock, onClick }) => (
  <div className="holding-item" onClick={onClick} role="button" tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}>
    <div className="holding-left">
      <div className="stock-icon"><LineChart size={16} /></div>
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
    <ChevronRight size={16} className="holding-arrow" />
  </div>
);

/** Activity item used in the recent-activity card */
const ActivityItem: React.FC<{ tx: Transaction }> = ({ tx }) => (
  <div className="activity-item">
    <div className={`activity-type-icon ${tx.type}`}>
      {tx.type === 'buy'      && <ArrowDownRight size={15} />}
      {tx.type === 'sell'     && <ArrowUpRight   size={15} />}
      {tx.type === 'dividend' && <DollarSign     size={15} />}
    </div>
    <div className="activity-info">
      <h4 className="activity-title">
        {tx.type === 'buy' ? 'Bought' : tx.type === 'sell' ? 'Sold' : 'Dividend from'} {tx.symbol}
      </h4>
      <p className="activity-details">
        {tx.shares ? `${tx.shares} shares @ $${tx.price}` : tx.name}
      </p>
      <span className="activity-date">{tx.date} · {tx.time}</span>
    </div>
    <div className={`activity-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
      {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Views
// ─────────────────────────────────────────────

const OverviewView: React.FC<{
  stocks: Stock[];
  router: ReturnType<typeof useRouter>;
  onViewHoldings: () => void;
  onViewTransactions: () => void;
}> = ({ stocks, router, onViewHoldings, onViewTransactions }) => (
  <div className="overview-grid">

    {/* Allocation */}
    <div className="allocation-card">
      <div className="card-header">
        <h3>Portfolio Allocation</h3>
        <button className="text-btn">Rebalance <ChevronRight size={14} /></button>
      </div>
      <div className="allocation-chart">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={PORTFOLIO_HOLDINGS} dataKey="allocation" nameKey="name"
              cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3} stroke="none"
              label={({ index }) => `${PORTFOLIO_HOLDINGS[index!].allocation}%`}
              labelLine={false}>
              {PORTFOLIO_HOLDINGS.map((h, i) => (
                <Cell key={i} fill={PIE_COLORS[h.color]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend iconType="circle" iconSize={8}
              formatter={(v) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="allocation-list">
        {PORTFOLIO_HOLDINGS.map((h, i) => (
          <div key={i} className="allocation-item">
            <div className="allocation-header">
              <div className="allocation-left">
                <div className={`allocation-indicator ${h.color}`} />
                <h.icon size={14} />
                <span className="allocation-name">{h.name}</span>
              </div>
              <span className="allocation-percentage">{h.allocation}%</span>
            </div>
            <div className="allocation-details">
              <span className="allocation-value">${h.value.toLocaleString()}</span>
              <span className={`allocation-change ${h.change >= 0 ? 'positive' : 'negative'}`}>
                {h.change >= 0 ? '+' : ''}${Math.abs(h.change).toLocaleString()} ({h.changePercent}%)
              </span>
            </div>
            <div className="allocation-progress">
              <div className={`progress-fill ${h.color}`} style={{ width: `${h.allocation}%` }} />
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
        {stocks.map((stock, i) => {
          const suggestion = getAISuggestion(stock);
          const potential  = stock.targetPrice
            ? (((stock.targetPrice - stock.price) / stock.price) * 100).toFixed(1)
            : '0';
          return (
            <div key={i} className="suggestion-item">
              <div className="suggestion-header">
                <div className="stock-info">
                  <h4>{stock.symbol}</h4>
                  <p>${stock.price.toFixed(2)}</p>
                </div>
                <span className={`suggestion-badge ${slugify(suggestion)}`}>{suggestion}</span>
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
                  <span className="value positive">+{potential}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Top Holdings */}
    <div className="holdings-card">
      <div className="card-header">
        <h3>Top Holdings</h3>
        <button className="text-btn" onClick={onViewHoldings}>View All <ChevronRight size={14} /></button>
      </div>
      <div className="holdings-list">
        {stocks.slice(0, 5).map((stock, i) => (
          <HoldingRow key={i} stock={stock} onClick={() => router.push(`/stock/${stock.symbol}`)} />
        ))}
      </div>
    </div>

    {/* Recent Activity */}
    <div className="activity-card">
      <div className="card-header">
        <h3>Recent Activity</h3>
        <button className="text-btn" onClick={onViewTransactions}>View All <ChevronRight size={14} /></button>
      </div>
      <div className="activity-list">
        {RECENT_TRANSACTIONS.slice(0, 5).map((tx) => (
          <ActivityItem key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  </div>
);

// ── Holdings Tab ──
const HoldingsView: React.FC<{
  stocks: Stock[];
  router: ReturnType<typeof useRouter>;
  searchQuery: string;
  onSearch: (q: string) => void;
  filterType: string;
  onFilter: (t: any) => void;
}> = ({ stocks, router, searchQuery, onSearch, filterType, onFilter }) => {
  const filters = ['all', 'stocks', 'crypto', 'etfs', 'bonds'] as const;

  return (
    <div className="holdings-view">
      <div className="holdings-controls">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search stocks, ETFs, crypto…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search holdings"
          />
        </div>
        <div className="filter-buttons" role="group" aria-label="Filter by type">
          {filters.map((t) => (
            <button key={t} className={`filter-btn ${filterType === t ? 'active' : ''}`}
              onClick={() => onFilter(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="holdings-table-card" role="table" aria-label="Holdings">
        <div className="table-header" role="row">
          {['Asset', 'Price', '24h Change', 'Holdings', 'Value', 'Actions'].map((h) => (
            <div key={h} className="table-cell" role="columnheader">{h}</div>
          ))}
        </div>
        <div className="table-body">
          {stocks.map((stock, i) => (
            <div key={i} className="table-row" role="row"
              onClick={() => router.push(`/stock/${stock.symbol}`)}
              tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && router.push(`/stock/${stock.symbol}`)}>
              {/* Asset */}
              <div className="table-cell asset-cell" role="cell">
                <div className="asset-icon"><LineChart size={18} /></div>
                <div className="asset-info">
                  <h4>{stock.symbol}</h4>
                  <p>{stock.name}</p>
                </div>
              </div>
              {/* Price */}
              <div className="table-cell price-cell" role="cell">
                <div className="price-info">
                  <span className="price">${stock.price.toFixed(2)}</span>
                  <span className="range">H: ${stock.dayHigh} · L: ${stock.dayLow}</span>
                </div>
              </div>
              {/* Change */}
              <div className="table-cell change-cell" role="cell">
                <div className={`change-badge ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {stock.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  <span>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                </div>
                <span className="change-amount">
                  {stock.change >= 0 ? '+' : ''}${Math.abs(stock.change).toFixed(2)}
                </span>
              </div>
              {/* Holdings */}
              <div className="table-cell holdings-cell" role="cell">
                <span className="shares">{stock.shares} shares</span>
                <span className="volume">Vol: {stock.volume}</span>
              </div>
              {/* Value */}
              <div className="table-cell value-cell" role="cell">
                <span className="value">${stock.value?.toLocaleString()}</span>
              </div>
              {/* Actions */}
              <div className="table-cell actions-cell" role="cell">
                <button className="action-icon-btn" aria-label={`Watch ${stock.symbol}`}
                  onClick={(e) => e.stopPropagation()}>
                  <Star size={14} />
                </button>
                <button className="action-icon-btn" aria-label="More options"
                  onClick={(e) => e.stopPropagation()}>
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Transactions Tab ──
const TransactionsView: React.FC = () => (
  <div className="transactions-view">
    <div className="transactions-header">
      <div className="transactions-filters" role="group" aria-label="Filter transactions">
        {['All', 'Buys', 'Sells', 'Dividends'].map((f, i) => (
          <button key={f} className={`filter-btn ${i === 0 ? 'active' : ''}`}>{f}</button>
        ))}
      </div>
      <button className="export-btn" aria-label="Export transactions">
        <Download size={15} /> Export
      </button>
    </div>

    <div className="transactions-table-card" role="table" aria-label="Transactions">
      <div className="table-header" role="row">
        {['Type', 'Asset', 'Shares / Price', 'Amount', 'Date & Time'].map((h) => (
          <div key={h} className="table-cell" role="columnheader">{h}</div>
        ))}
      </div>
      <div className="table-body">
        {RECENT_TRANSACTIONS.map((tx) => (
          <div key={tx.id} className="table-row" role="row">
            <div className="table-cell type-cell" role="cell">
              <div className={`type-badge ${tx.type}`}>
                {tx.type === 'buy'      && <ArrowDownRight size={12} />}
                {tx.type === 'sell'     && <ArrowUpRight   size={12} />}
                {tx.type === 'dividend' && <DollarSign     size={12} />}
                <span>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
              </div>
            </div>
            <div className="table-cell asset-cell" role="cell">
              <div className="asset-info">
                <h4>{tx.symbol}</h4>
                <p>{tx.name}</p>
              </div>
            </div>
            <div className="table-cell shares-cell" role="cell">
              {tx.shares ? (
                <>
                  <span className="shares">{tx.shares} shares</span>
                  <span className="price">@ ${tx.price?.toFixed(2)}</span>
                </>
              ) : (
                <span className="dividend-label">Dividend Payment</span>
              )}
            </div>
            <div className="table-cell amount-cell" role="cell">
              <span className={`amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
              </span>
            </div>
            <div className="table-cell date-cell" role="cell">
              <div className="date-info">
                <span className="date">{tx.date}</span>
                <span className="time">{tx.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const Investments: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isClient, setIsClient]         = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'1D'|'1W'|'1M'|'3M'|'1Y'|'ALL'>('1M');
  const [activeView, setActiveView]     = useState<'overview'|'holdings'|'transactions'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterType, setFilterType]     = useState<'all'|'stocks'|'crypto'|'etfs'|'bonds'>('all');
  const [liveStocks, setLiveStocks]     = useState<Stock[]>(BASE_STOCKS);
  const [toasts, setToasts]             = useState<Toast[]>([]);

  // Dismiss toast
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Add toast (deduplicates same message)
  const addToast = useCallback((message: string) => {
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) return prev;
      return [...prev, { id: Date.now() + Math.random(), message }];
    });
  }, []);

  // Auth guard
  useEffect(() => {
    setIsClient(true);
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Live price polling
  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = BASE_STOCKS.map((s) => s.symbol).join(',');
      try {
        const res  = await fetch(`/api/prices?symbols=${symbols}`);
        const data = await res.json();
        setLiveStocks(
          BASE_STOCKS.map((stock) => ({
            ...stock,
            price:         data[stock.symbol]?.price         ?? stock.price,
            change:        data[stock.symbol]?.change        ?? stock.change,
            changePercent: data[stock.symbol]?.changePercent ?? stock.changePercent,
            value: stock.shares
              ? stock.shares * (data[stock.symbol]?.price ?? stock.price)
              : stock.value,
          }))
        );
      } catch { /* keep existing prices on error */ }
    };

    fetchPrices();
    const id = setInterval(fetchPrices, 10_000);
    return () => clearInterval(id);
  }, []);

  // Price alerts
  useEffect(() => {
    liveStocks.forEach((stock) => {
      if (stock.targetPrice && stock.price >= stock.targetPrice) {
        addToast(`${stock.symbol} reached target price of $${stock.targetPrice}!`);
      }
      if (stock.stopLoss && stock.price <= stock.stopLoss) {
        addToast(`${stock.symbol} hit stop-loss at $${stock.stopLoss}!`);
      }
    });
  }, [liveStocks, addToast]);

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), 6_000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Derived values
  const investmentValue          = liveStocks.reduce((sum, s) => sum + (s.value ?? 0), 0);
  const totalInvested            = 28_500;
  const investmentChange         = investmentValue - totalInvested;
  const investmentChangePercent  = (investmentChange / totalInvested) * 100;

  const performanceMetrics: PerformanceMetric[] = [
    {
      label: "Today's Gain",
      value: `$${investmentChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: `${investmentChange >= 0 ? '+' : ''}${investmentChangePercent.toFixed(2)}%`,
      isPositive: investmentChange >= 0,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'Total Return',
      value: `$${investmentChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: `${investmentChange >= 0 ? '+' : ''}${investmentChangePercent.toFixed(2)}%`,
      isPositive: investmentChange >= 0,
      icon: Activity,
      color: 'blue',
    },
    { label: 'Dividend Income', value: '$284.50',                          change: 'This month', icon: DollarSign, color: 'purple' },
    { label: 'Total Invested',  value: `$${totalInvested.toLocaleString()}`,                    icon: DollarSign, color: 'amber'  },
  ];

  const filteredStocks = liveStocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1_500);
  };

  // ── Loading / auth gate ──
  if (!isClient || status === 'loading') {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading your investments…</p>
      </div>
    );
  }
  if (!session) return null;

  // ─────────────────────────────────────────────
  return (
    <div className="investments-page">

      {/* Back */}
      <button className="back-button" onClick={() => router.push('/dashboard')} aria-label="Back to dashboard">
        <ArrowLeft size={17} /> Dashboard
      </button>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="alerts-toast-container" role="status" aria-live="polite">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={dismissToast} />
          ))}
        </div>
      )}

      {/* ── Header ── */}
      <header className="investments-header">
        <div className="header-top">
          <div className="header-title">
            <h1>Investment Portfolio</h1>
            <p>Track and manage your investments</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleRefresh} aria-label="Refresh prices">
              <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            </button>
            <button className="icon-btn" aria-label="Export data"><Download size={16} /></button>
            <button className="icon-btn" aria-label="Notifications"><Bell size={16} /></button>
            <button className="icon-btn" aria-label="Settings"><Settings size={16} /></button>
          </div>
        </div>

        <nav className="view-tabs" role="tablist" aria-label="Portfolio views">
          {(
            [
              { id: 'overview',      label: 'Overview',     icon: BarChart3 },
              { id: 'holdings',      label: 'Holdings',     icon: PieIcon   },
              { id: 'transactions',  label: 'Transactions', icon: Clock     },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeView === id}
              className={`view-tab ${activeView === id ? 'active' : ''}`}
              onClick={() => setActiveView(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* ── Summary Card ── */}
      <section className="portfolio-summary-card" aria-label="Portfolio summary">
        <div className="summary-content">
          <div className="summary-left">
            <div className="summary-icon"><LineChart size={26} /></div>
            <div className="summary-info">
              <p className="summary-label">Total Portfolio Value</p>
              <h2 className="summary-value">
                ${investmentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className={`summary-change ${investmentChange >= 0 ? 'positive' : 'negative'}`}>
                {investmentChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>
                  {investmentChange >= 0 ? '+' : ''}${Math.abs(investmentChange).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  &nbsp;({investmentChangePercent.toFixed(2)}%) today
                </span>
              </div>
            </div>
          </div>

          <div className="summary-actions">
            <button className="action-btn primary" onClick={() => router.push('/buy-stocks')}>
              <Plus size={16} /> Buy Assets
            </button>
            <button className="action-btn secondary" onClick={() => router.push('/sell-stocks')}>
              <Upload size={16} /> Sell
            </button>
          </div>
        </div>

        <div className="period-selector" role="group" aria-label="Time period">
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((p) => (
            <button
              key={p}
              className={`period-btn ${selectedPeriod === p ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(p)}
              aria-pressed={selectedPeriod === p}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* ── Performance Metrics ── */}
      <section className="performance-metrics" aria-label="Performance metrics">
        {performanceMetrics.map((m, i) => <MetricCard key={i} metric={m} />)}
      </section>

      {/* ── Tab Content ── */}
      <main>
        {activeView === 'overview' && (
          <OverviewView
            stocks={liveStocks}
            router={router}
            onViewHoldings={() => setActiveView('holdings')}
            onViewTransactions={() => setActiveView('transactions')}
          />
        )}

        {activeView === 'holdings' && (
          <HoldingsView
            stocks={filteredStocks}
            router={router}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            filterType={filterType}
            onFilter={setFilterType}
          />
        )}

        {activeView === 'transactions' && <TransactionsView />}
      </main>

    </div>
  );
};

export default Investments;

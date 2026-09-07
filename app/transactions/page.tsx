// app/transactions/page.tsx
'use client';

/**
 * Transaction history — backed by /api/transactions/history (server-side
 * search, filtering and pagination) and /api/transactions/summary for the
 * headline figures. This screen previously rendered a hardcoded list of twelve
 * invented transactions.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, Search, Download, ArrowUpRight, ArrowDownLeft,
  ShoppingBag, Home, Car, Coffee, Smartphone, Send, Zap,
  TrendingUp, Layers, ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import './transactions.css';

interface ApiTx {
  id: string;
  recipient: string;
  recipientAvatar: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'sent' | 'received';
  note?: string;
  paymentMethod: string;
  category: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  food:          { label: 'Food & Drink',  icon: Coffee,      color: 'brown'  },
  shopping:      { label: 'Shopping',      icon: ShoppingBag, color: 'blue'   },
  transport:     { label: 'Transport',     icon: Car,         color: 'gray'   },
  bills:         { label: 'Bills',         icon: Zap,         color: 'yellow' },
  entertainment: { label: 'Entertainment', icon: Smartphone,  color: 'purple' },
  income:        { label: 'Income',        icon: TrendingUp,  color: 'green'  },
  investment:    { label: 'Investment',    icon: Home,        color: 'purple' },
  transfer:      { label: 'Transfer',      icon: Send,        color: 'blue'   },
  other:         { label: 'Other',         icon: Layers,      color: 'gray'   },
};
const catMeta = (c?: string) => CATEGORY_META[c ?? 'other'] ?? CATEGORY_META.other;

const CATEGORY_OPTIONS = Object.entries(CATEGORY_META).map(([value, m]) => ({ value, label: m.label }));

const money = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const PAGE_SIZE = 20;

const TransactionsPage: React.FC = () => {
  const router = useRouter();
  const { status } = useSession();

  const [searchQuery, setSearchQuery]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFilter, setSelectedFilter]   = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange]             = useState('all');
  const [page, setPage]                       = useState(1);

  const [txs, setTxs]           = useState<ApiTx[]>([]);
  const [pagination, setPage_]  = useState<Pagination | null>(null);
  const [summary, setSummary]   = useState<{ income: number; expenses: number; net: number } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [selectedFilter, selectedCategory, dateRange]);

  /** Build the query the API understands. `type` carries either a direction
   *  (sent/received) or a status, which is why they are split here. */
  const buildQuery = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      type: selectedFilter === 'income' ? 'received' : selectedFilter === 'expense' ? 'sent' : 'all',
      status: ['pending', 'completed', 'failed'].includes(selectedFilter) ? selectedFilter : 'all',
      category: selectedCategory,
      range: dateRange,
      ...overrides,
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    return params.toString();
  }, [page, selectedFilter, selectedCategory, dateRange, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [histRes, sumRes] = await Promise.all([
        fetch(`/api/transactions/history?${buildQuery()}`),
        fetch('/api/transactions/summary'),
      ]);
      if (!histRes.ok) throw new Error('history');
      const hist = await histRes.json();
      setTxs(hist.transactions ?? []);
      setPage_(hist.pagination ?? null);

      if (sumRes.ok) {
        const sum = await sumRes.json();
        if (sum?.success) setSummary(sum.data.month);
      }
    } catch {
      setError("We couldn't load your transactions. Please try again.");
      setTxs([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { if (status === 'authenticated') load(); }, [status, load]);

  /** Export the whole filtered set as CSV, straight from the API. */
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/transactions/history?${buildQuery({ format: 'csv', page: '1' })}`);
      if (!res.ok) throw new Error('export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finflow-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("The export didn't finish. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="transactions-page has-app-nav">
      <div className="transactions-container">
        {/* Header */}
        <div className="page-header">
          <button className="back-button" onClick={() => router.back()}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="header-content">
            <h1>All Transactions</h1>
            <p>Search, filter and export your account activity</p>
          </div>
          <button className="export-button" onClick={handleExport} disabled={exporting || loading}>
            <Download size={18} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {error && (
          <div className="tx-banner" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button type="button" onClick={load}><RefreshCw size={13} /> Retry</button>
          </div>
        )}

        {/* Summary — this month, from /api/transactions/summary */}
        <div className="summary-grid">
          <div className="summary-card income">
            <div className="summary-icon"><ArrowDownLeft size={24} /></div>
            <div className="summary-details">
              <p className="summary-label">Income this month</p>
              <h3 className="summary-value">${money(summary?.income ?? 0)}</h3>
            </div>
          </div>

          <div className="summary-card expense">
            <div className="summary-icon"><ArrowUpRight size={24} /></div>
            <div className="summary-details">
              <p className="summary-label">Spent this month</p>
              <h3 className="summary-value">${money(summary?.expenses ?? 0)}</h3>
            </div>
          </div>

          <div className="summary-card balance">
            <div className="summary-icon"><TrendingUp size={24} /></div>
            <div className="summary-details">
              <p className="summary-label">Net this month</p>
              <h3 className="summary-value">
                {(summary?.net ?? 0) < 0 ? '−' : ''}${money(Math.abs(summary?.net ?? 0))}
              </h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by recipient or note…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search transactions"
            />
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              <option value="income">Money in</option>
              <option value="expense">Money out</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Filter by date range"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="transactions-list-container">
          <div className="list-header">
            <h2>
              {loading
                ? 'Loading…'
                : `${pagination?.total ?? 0} Transaction${(pagination?.total ?? 0) === 1 ? '' : 's'}`}
            </h2>
            {pagination && pagination.total > 0 && (
              <span className="list-range">
                Page {pagination.page} of {totalPages}
              </span>
            )}
          </div>

          <div className="transactions-list">
            {loading && (
              <div className="tx-skeletons" aria-hidden>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="tx-skeleton" />)}
              </div>
            )}

            {!loading && txs.map((tx) => {
              const meta = catMeta(tx.category);
              const Icon = tx.type === 'received' ? ArrowDownLeft : meta.icon;
              const signed = tx.type === 'sent' ? -tx.amount : tx.amount;
              return (
                <div key={tx.id} className="transaction-row">
                  <div className="transaction-left">
                    <div className={`transaction-icon ${tx.type === 'received' ? 'green' : meta.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="transaction-info">
                      <h4>{tx.recipient || (tx.type === 'received' ? 'Incoming transfer' : 'Payment')}</h4>
                      <div className="transaction-meta">
                        <span className="category">{meta.label}</span>
                        <span className="separator">•</span>
                        <span className="date">{formatDate(tx.date)}</span>
                        <span className="separator">•</span>
                        <span className="payment-method">{tx.paymentMethod}</span>
                      </div>
                      {tx.note && <p className="transaction-note">{tx.note}</p>}
                    </div>
                  </div>
                  <div className="transaction-right">
                    <div className={`transaction-amount ${signed > 0 ? 'positive' : 'negative'}`}>
                      {signed > 0 ? '+' : '−'}${money(Math.abs(tx.amount))}
                    </div>
                    <span className={`status-badge ${tx.status}`}>{tx.status}</span>
                  </div>
                </div>
              );
            })}

            {!loading && txs.length === 0 && !error && (
              <div className="empty-state">
                <p>No transactions match these filters.</p>
                <button type="button" onClick={() => router.push('/send-money')}>Send money</button>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="tx-pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;

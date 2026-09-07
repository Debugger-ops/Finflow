"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Search, TrendingUp, TrendingDown, ArrowLeft,
  ShoppingCart, CheckCircle, X, Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import './BuyAssets.css';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  logo: string;
  category: 'stock' | 'crypto' | 'etf';
}

interface OrderState {
  asset:      Asset;
  quantity:   number;
  orderType:  'market' | 'limit';
  limitPrice: number | null;
  total:      number;
}

// ─────────────────────────────────────────────
// Tradable catalog — identity only. Prices are never hardcoded in a money app:
// they are quoted live from /api/prices (Finnhub) and an asset without a quote
// is shown as unavailable rather than sold at a stale number.
// ─────────────────────────────────────────────
interface CatalogEntry { id: string; symbol: string; name: string; logo: string; category: 'stock' | 'crypto' | 'etf' }

const CATALOG: CatalogEntry[] = [
  { id: '1', symbol: 'AAPL',  name: 'Apple Inc.',      logo: '🍎', category: 'stock' },
  { id: '2', symbol: 'GOOGL', name: 'Alphabet Inc.',   logo: '🔍', category: 'stock' },
  { id: '3', symbol: 'MSFT',  name: 'Microsoft Corp.', logo: '🪟', category: 'stock' },
  { id: '4', symbol: 'TSLA',  name: 'Tesla Inc.',      logo: '⚡', category: 'stock' },
  { id: '5', symbol: 'AMZN',  name: 'Amazon.com Inc.', logo: '📦', category: 'stock' },
  { id: '6', symbol: 'NVDA',  name: 'NVIDIA Corp.',    logo: '🎮', category: 'stock' },
  { id: '7', symbol: 'META',  name: 'Meta Platforms',  logo: '👤', category: 'stock' },
  { id: '8', symbol: 'SPY',   name: 'S&P 500 ETF',     logo: '📈', category: 'etf'   },
];

const QUICK_AMOUNTS = [1, 5, 10, 25];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** Single asset card in the grid */
const AssetCard: React.FC<{ asset: Asset; onClick: () => void; index: number }> = ({
  asset, onClick, index,
}) => (
  <article
    className="asset-card"
    style={{ animationDelay: `${index * 40}ms` }}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
    aria-label={`Buy ${asset.name} at $${formatPrice(asset.price)}`}
  >
    <div className="asset-info">
      <span className="asset-logo" aria-hidden>{asset.logo}</span>
      <div className="asset-details">
        <h3>{asset.symbol}</h3>
        <p>{asset.name}</p>
      </div>
    </div>
    <div className="asset-price">
      <span className="price">${formatPrice(asset.price)}</span>
      <span className={`change ${asset.change >= 0 ? 'positive' : 'negative'}`}>
        {asset.change >= 0
          ? <TrendingUp size={12} aria-hidden />
          : <TrendingDown size={12} aria-hidden />
        }
        {asset.change >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
      </span>
    </div>
  </article>
);

/** Assets list / search view */
const AssetsListView: React.FC<{
  assets:      Asset[];
  loading:     boolean;
  searchQuery: string;
  onSearch:    (q: string) => void;
  onSelect:    (asset: Asset) => void;
}> = ({ assets, loading, searchQuery, onSearch, onSelect }) => {
  const filtered = useMemo(
    () => assets.filter(
      (a) =>
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [assets, searchQuery]
  );

  return (
    <div className="assets-list-view">
      <div className="search-section">
        <div className="search-box">
          <Search size={17} aria-hidden />
          <input
            type="text"
            placeholder="Search stocks, crypto, ETFs…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search assets"
          />
        </div>
        <p className="results-count">
          {filtered.length} asset{filtered.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="assets-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="asset-skeleton" aria-hidden />)
        ) : filtered.length > 0 ? (
          filtered.map((asset, i) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              index={i}
              onClick={() => onSelect(asset)}
            />
          ))
        ) : (
          <div className="no-results">
            <Search size={40} aria-hidden />
            <p>No assets found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Order form for a selected asset */
const BuyFormView: React.FC<{
  asset:         Asset;
  onCancel:      () => void;
  onReviewOrder: (order: OrderState) => void;
}> = ({ asset, onCancel, onReviewOrder }) => {
  const [quantity,    setQuantity]    = useState('');
  const [orderType,   setOrderType]   = useState<'market' | 'limit'>('market');
  const [limitPrice,  setLimitPrice]  = useState('');

  const effectivePrice = orderType === 'limit' && limitPrice
    ? parseFloat(limitPrice)
    : asset.price;

  const total = useMemo(
    () => (quantity && parseFloat(quantity) > 0)
      ? effectivePrice * parseFloat(quantity)
      : 0,
    [quantity, effectivePrice]
  );

  const isValid = !!quantity && parseFloat(quantity) > 0 &&
    (orderType === 'market' || (orderType === 'limit' && !!limitPrice && parseFloat(limitPrice) > 0));

  const handleReview = () => {
    if (!isValid) return;
    onReviewOrder({
      asset,
      quantity:   parseFloat(quantity),
      orderType,
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : null,
      total,
    });
  };

  return (
    <div className="buy-form-view">
      {/* Asset header */}
      <div className="selected-asset-header">
        <span className="asset-logo-large" aria-hidden>{asset.logo}</span>
        <div className="asset-header-info">
          <h2>{asset.symbol}</h2>
          <p>{asset.name}</p>
        </div>
        <div className="current-price">
          <span className="price-label">Current Price</span>
          <span className="price-value">${formatPrice(asset.price)}</span>
        </div>
      </div>

      {/* Order type */}
      <div className="order-type-selector" role="group" aria-label="Order type">
        {(['market', 'limit'] as const).map((type) => (
          <button
            key={type}
            className={`order-type-btn ${orderType === type ? 'active' : ''}`}
            onClick={() => setOrderType(type)}
            aria-pressed={orderType === type}
          >
            {type === 'market' ? 'Market Order' : 'Limit Order'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="form-section">
        {/* Quantity */}
        <div className="form-group">
          <label htmlFor="qty">Quantity</label>
          <input
            id="qty"
            type="number"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0.001" step="0.001"
            aria-describedby="qty-suffix"
          />
          <span className="input-suffix" id="qty-suffix">shares</span>
        </div>

        {/* Quick-amount chips */}
        <div className="quick-amounts" role="group" aria-label="Quick amounts">
          {QUICK_AMOUNTS.map((n) => (
            <button
              key={n}
              className="quick-chip"
              onClick={() => setQuantity(String(n))}
              aria-label={`Set quantity to ${n}`}
            >
              {n} share{n > 1 ? 's' : ''}
            </button>
          ))}
        </div>

        {/* Limit price */}
        {orderType === 'limit' && (
          <div className="form-group">
            <label htmlFor="limit-price">Limit Price</label>
            <input
              id="limit-price"
              type="number"
              placeholder={asset.price.toFixed(2)}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              min="0.01" step="0.01"
              aria-describedby="limit-suffix"
            />
            <span className="input-suffix" id="limit-suffix">USD</span>
          </div>
        )}

        {/* Order summary */}
        <div className="order-summary" role="table" aria-label="Order summary">
          <div className="summary-row">
            <span>Shares</span>
            <span>{quantity || '—'}</span>
          </div>
          <div className="summary-row">
            <span>Price per share</span>
            <span>${formatPrice(effectivePrice)}</span>
          </div>
          {orderType === 'limit' && (
            <div className="summary-row">
              <span>Order type</span>
              <span>Limit @ ${limitPrice || '—'}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span className="total-value">${formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button className="cancel-btn" onClick={onCancel} aria-label="Cancel">
          Cancel
        </button>
        <button
          className="buy-btn"
          onClick={handleReview}
          disabled={!isValid}
          aria-disabled={!isValid}
        >
          <ShoppingCart size={17} aria-hidden />
          Review Order
        </button>
      </div>
    </div>
  );
};

/** Confirm purchase modal */
const ConfirmModal: React.FC<{
  order:      OrderState;
  onCancel:   () => void;
  onConfirm:  () => void;
}> = ({ order, onCancel, onConfirm }) => (
  <div
    className="confirmation-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
    onClick={(e) => e.target === e.currentTarget && onCancel()}
  >
    <div className="modal-content">
      <h3 id="confirm-title">Confirm Purchase</h3>

      <div className="confirmation-details">
        <div className="confirm-row">
          <span className="confirm-label">Asset</span>
          <span className="confirm-value">{order.asset.logo} {order.asset.symbol}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">Quantity</span>
          <span className="confirm-value">{order.quantity} shares</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">Order Type</span>
          <span className="confirm-value">{order.orderType === 'market' ? 'Market' : 'Limit'}</span>
        </div>
        {order.orderType === 'limit' && order.limitPrice != null && (
          <div className="confirm-row">
            <span className="confirm-label">Limit Price</span>
            <span className="confirm-value">${formatPrice(order.limitPrice)}</span>
          </div>
        )}
        <div className="confirm-row total-row">
          <span className="confirm-label">Total</span>
          <span className="confirm-value">${formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="modal-actions">
        <button className="cancel-btn" onClick={onCancel}>Cancel</button>
        <button className="confirm-btn" onClick={onConfirm}>
          <Zap size={16} aria-hidden /> Confirm Purchase
        </button>
      </div>
    </div>
  </div>
);

/** Success screen after purchase */
const SuccessOverlay: React.FC<{
  order:         OrderState;
  onBuyMore:     () => void;
  onGoPortfolio: () => void;
}> = ({ order, onBuyMore, onGoPortfolio }) => (
  <div
    className="success-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="success-title"
  >
    <div className="success-card">
      <div className="success-icon" aria-hidden>
        <CheckCircle size={34} />
      </div>
      <h3 id="success-title">Order Placed!</h3>
      <p>
        You bought <strong>{order.quantity} shares</strong> of{' '}
        <strong>{order.asset.symbol}</strong> for{' '}
        <strong>${formatPrice(order.total)}</strong>.
      </p>
      <div className="success-actions">
        <button className="success-primary-btn" onClick={onGoPortfolio}>
          View Portfolio
        </button>
        <button className="success-secondary-btn" onClick={onBuyMore}>
          Buy More Assets
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
type View = 'list' | 'form' | 'confirm' | 'success';

const BuyAssets: React.FC = () => {
  const router = useRouter();

  const [view, setView]               = useState<View>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [pendingOrder, setPendingOrder]   = useState<OrderState | null>(null);

  const [assets, setAssets]   = useState<Asset[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Live quotes for the catalog; assets without a quote are filtered out so
   *  nothing can be bought at a stale price. */
  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const symbols = CATALOG.map(c => c.symbol).join(',');
      const [quoteRes, balRes] = await Promise.all([
        fetch(`/api/prices?symbols=${symbols}`),
        fetch('/api/user/balance'),
      ]);
      if (balRes.ok) {
        const b = await balRes.json();
        if (typeof b?.balance === 'number') setBalance(b.balance);
      }
      if (!quoteRes.ok) throw new Error('quotes');
      const quotes = await quoteRes.json();

      const priced = CATALOG
        .map(c => {
          const q = quotes[c.symbol];
          if (!q || !q.price) return null;
          return {
            ...c,
            price: q.price,
            change: q.change ?? 0,
            changePercent: q.changePercent ?? 0,
          } as Asset;
        })
        .filter(Boolean) as Asset[];

      setAssets(priced);
      setError(priced.length === 0 ? 'Live prices are unavailable right now, so trading is paused.' : null);
    } catch {
      setAssets([]);
      setError('Live prices are unavailable right now, so trading is paused.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  const handleSelectAsset = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setView('form');
  }, []);

  const handleReviewOrder = useCallback((order: OrderState) => {
    setPendingOrder(order);
    setView('confirm');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingOrder || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/orders/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: pendingOrder.asset.symbol,
          name:   pendingOrder.asset.name,
          shares: pendingOrder.quantity,
          // A limit order still executes at the limit price in this build;
          // the server re-validates the total against the balance.
          price:  pendingOrder.limitPrice ?? pendingOrder.asset.price,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Order failed');

      // Reflect the debit immediately; the nav and dashboard refetch on navigation.
      setBalance(b => (b === null ? b : b - pendingOrder.total));
      setView('success');
    } catch (err: any) {
      setError(err?.message || 'We could not place that order. Please try again.');
      setView('form');
    } finally {
      setSubmitting(false);
    }
  }, [pendingOrder, submitting]);

  const handleReset = useCallback(() => {
    setSelectedAsset(null);
    setPendingOrder(null);
    setSearchQuery('');
    setView('list');
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'form')    { setView('list'); setSelectedAsset(null); return; }
    if (view === 'confirm') { setView('form'); return; }
    router.back();
  }, [view, router]);

  return (
    <div className="buy-assets-container">
      {/* Header */}
      <header className="buy-header">
        <button className="back-btn" onClick={handleBack} aria-label="Go back">
          <ArrowLeft size={18} />
        </button>
        <h1>
          {view === 'list'    ? 'Buy Assets'
           : view === 'form'  ? `Buy ${selectedAsset?.symbol ?? ''}`
           : 'Review Order'}
        </h1>
        <div className="header-spacer" aria-hidden />
      </header>

      {error && (
        <div className="buy-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadQuotes}>Retry</button>
        </div>
      )}

      {/* Views */}
      {view === 'list' && (
        <AssetsListView
          assets={assets}
          loading={loading}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onSelect={handleSelectAsset}
        />
      )}

      {view === 'form' && selectedAsset && (
        <BuyFormView
          asset={selectedAsset}
          onCancel={() => setView('list')}
          onReviewOrder={handleReviewOrder}
        />
      )}

      {/* Modals (rendered on top of current view) */}
      {view === 'confirm' && pendingOrder && (
        <ConfirmModal
          order={pendingOrder}
          onCancel={() => setView('form')}
          onConfirm={handleConfirm}
        />
      )}

      {view === 'success' && pendingOrder && (
        <SuccessOverlay
          order={pendingOrder}
          onBuyMore={handleReset}
          onGoPortfolio={() => router.push('/investment')}
        />
      )}
    </div>
  );
};

export default BuyAssets;

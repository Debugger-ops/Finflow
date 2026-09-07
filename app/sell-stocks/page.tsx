"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ArrowLeft, TrendingUp, TrendingDown,
  DollarSign, CheckCircle, Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import './SellAssets.css';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  logo: string;
}

interface SaleOrder {
  holding:    Holding;
  quantity:   number;
  orderType:  'market' | 'limit';
  limitPrice: number | null;
  total:      number;
  profitLoss: number;
}

// Holdings come from /api/portfolio (real positions priced live), never from a
// hardcoded list — you cannot sell shares you do not own.
const SYMBOL_LOGOS: Record<string, string> = {
  AAPL: '🍎', GOOGL: '🔍', MSFT: '🪟', TSLA: '⚡',
  AMZN: '📦', NVDA: '🎮', META: '👤', SPY: '📈', BTC: '₿',
};

const PCT_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.50 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.00 },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function calcGainLoss(h: Holding) {
  const totalCost   = h.avgCost * h.quantity;
  const currentVal  = h.currentPrice * h.quantity;
  const gainLoss    = currentVal - totalCost;
  const gainLossPct = (gainLoss / totalCost) * 100;
  return { gainLoss, gainLossPct, currentVal };
}

// ─────────────────────────────────────────────
// Portfolio summary stats
// ─────────────────────────────────────────────
function PortfolioStats({ holdings }: { holdings: Holding[] }) {
  const totalValue = holdings.reduce((s, h) => s + h.currentPrice * h.quantity, 0);
  const totalPnL   = holdings.reduce((s, h) => {
    const { gainLoss } = calcGainLoss(h);
    return s + gainLoss;
  }, 0);

  return (
    <div className="summary-stats">
      <div className="summary-stat">
        <span className="summary-stat-label">Portfolio Value</span>
        <span className="summary-stat-value">${fmt(totalValue)}</span>
      </div>
      <div className="summary-stat">
        <span className="summary-stat-label">Total P&amp;L</span>
        <span className={`summary-stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
          {totalPnL >= 0 ? '+' : ''}${fmt(Math.abs(totalPnL))}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** Single holding card in the portfolio grid */
const HoldingCard: React.FC<{ holding: Holding; onClick: () => void; index: number }> = ({
  holding, onClick, index,
}) => {
  const { gainLoss, gainLossPct, currentVal } = calcGainLoss(holding);
  const isPositive = gainLoss >= 0;

  return (
    <article
      className="holding-card"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Sell ${holding.name}, current value $${fmt(currentVal)}`}
    >
      <div className="holding-header">
        <div className="holding-info">
          <span className="holding-logo" aria-hidden>{holding.logo}</span>
          <div className="holding-details">
            <h3>{holding.symbol}</h3>
            <p>{holding.name}</p>
          </div>
        </div>
        <div className="holding-value">
          <span className="value">${fmt(currentVal)}</span>
          <span className="quantity">{holding.quantity} shares</span>
        </div>
      </div>

      <div className="holding-stats">
        <div className="stat">
          <span className="label">Avg Cost</span>
          <span className="stat-value">${fmt(holding.avgCost)}</span>
        </div>
        <div className="stat">
          <span className="label">Current</span>
          <span className="stat-value">${fmt(holding.currentPrice)}</span>
        </div>
        <div className="stat">
          <span className="label">Gain / Loss</span>
          <span className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive
              ? <TrendingUp  size={12} aria-hidden />
              : <TrendingDown size={12} aria-hidden />
            }
            {isPositive ? '+' : '-'}${fmt(Math.abs(gainLoss))} ({gainLossPct.toFixed(2)}%)
          </span>
        </div>
      </div>
    </article>
  );
};

/** Holdings portfolio list view */
const HoldingsListView: React.FC<{
  holdings: Holding[];
  loading:  boolean;
  onSelect: (h: Holding) => void;
  onBrowse: () => void;
}> = ({ holdings, loading, onSelect, onBrowse }) => (
  <div className="holdings-list-view">
    <div className="portfolio-summary">
      <div className="summary-text">
        <h2>Your Portfolio</h2>
        <p>{holdings.length > 0 ? 'Select an asset to sell' : 'Nothing to sell yet'}</p>
      </div>
      <PortfolioStats holdings={holdings} />
    </div>

    <div className="holdings-grid">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="holding-skeleton" aria-hidden />)
        : holdings.length > 0
          ? holdings.map((holding, i) => (
              <HoldingCard key={holding.id} holding={holding} index={i} onClick={() => onSelect(holding)} />
            ))
          : (
            <div className="holdings-empty">
              <p>You don't hold any assets yet.</p>
              <button type="button" onClick={onBrowse}>Buy your first asset</button>
            </div>
          )}
    </div>
  </div>
);

/** Sell order form for a selected holding */
const SellFormView: React.FC<{
  holding:       Holding;
  onCancel:      () => void;
  onReviewOrder: (order: SaleOrder) => void;
}> = ({ holding, onCancel, onReviewOrder }) => {
  const [sellQty,    setSellQty]    = useState('');
  const [orderType,  setOrderType]  = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [activeChip, setActiveChip] = useState<number | null>(null);

  const effectivePrice = orderType === 'limit' && limitPrice
    ? parseFloat(limitPrice)
    : holding.currentPrice;

  const qty   = parseFloat(sellQty) || 0;
  const total = useMemo(() => effectivePrice * qty, [effectivePrice, qty]);
  const pl    = useMemo(
    () => (effectivePrice - holding.avgCost) * qty,
    [effectivePrice, holding.avgCost, qty]
  );

  const isValid =
    qty > 0 && qty <= holding.quantity &&
    (orderType === 'market' || (orderType === 'limit' && !!limitPrice && parseFloat(limitPrice) > 0));

  const handleQtyChange = (val: string) => {
    const n = parseFloat(val);
    if (!val || n <= holding.quantity) {
      setSellQty(val);
      setActiveChip(null);
    }
  };

  const applyChip = (pct: number) => {
    const n = +(holding.quantity * pct).toFixed(6);
    setSellQty(String(n));
    setActiveChip(pct);
  };

  const handleReview = () => {
    if (!isValid) return;
    onReviewOrder({ holding, quantity: qty, orderType, limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : null, total, profitLoss: pl });
  };

  return (
    <div className="sell-form-view">
      {/* Header */}
      <div className="selected-holding-header">
        <span className="holding-logo-large" aria-hidden>{holding.logo}</span>
        <div className="holding-header-info">
          <h2>{holding.symbol}</h2>
          <p>{holding.name}</p>
          <span className="shares-owned">You own {holding.quantity} shares</span>
        </div>
        <div className="current-price">
          <span className="price-label">Current Price</span>
          <span className="price-value">${fmt(holding.currentPrice)}</span>
        </div>
      </div>

      {/* Order type */}
      <div className="order-type-selector" role="group" aria-label="Order type">
        {(['market', 'limit'] as const).map((t) => (
          <button
            key={t}
            className={`order-type-btn ${orderType === t ? 'active' : ''}`}
            onClick={() => setOrderType(t)}
            aria-pressed={orderType === t}
          >
            {t === 'market' ? 'Market Order' : 'Limit Order'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="form-section">
        {/* Quantity */}
        <div className="form-group">
          <label htmlFor="sell-qty">Quantity to Sell</label>
          <input
            id="sell-qty"
            type="number"
            placeholder="0"
            value={sellQty}
            onChange={(e) => handleQtyChange(e.target.value)}
            min="0.001"
            max={holding.quantity}
            step="0.001"
            aria-describedby="sell-qty-suffix"
          />
          <span className="input-suffix" id="sell-qty-suffix">of {holding.quantity}</span>
        </div>

        {/* % quick chips */}
        <div className="quick-amounts" role="group" aria-label="Sell percentage presets">
          {PCT_PRESETS.map(({ label, value }) => (
            <button
              key={label}
              className={`quick-chip ${activeChip === value ? 'active' : ''}`}
              onClick={() => applyChip(value)}
              aria-label={`Sell ${label} of holdings`}
              aria-pressed={activeChip === value}
            >
              {label}
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
              placeholder={holding.currentPrice.toFixed(2)}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              min="0.01"
              step="0.01"
              aria-describedby="limit-suffix"
            />
            <span className="input-suffix" id="limit-suffix">USD</span>
          </div>
        )}

        {/* Order Summary */}
        <div className="order-summary" role="table" aria-label="Order summary">
          <div className="summary-row">
            <span>Shares to Sell</span>
            <span>{qty > 0 ? qty : '—'}</span>
          </div>
          <div className="summary-row">
            <span>Price per share</span>
            <span>${fmt(effectivePrice)}</span>
          </div>
          <div className="summary-row">
            <span>Avg Cost per share</span>
            <span>${fmt(holding.avgCost)}</span>
          </div>
          {orderType === 'limit' && limitPrice && (
            <div className="summary-row">
              <span>Order type</span>
              <span>Limit @ ${limitPrice}</span>
            </div>
          )}
          <div className={`summary-row profit-loss ${pl >= 0 ? 'positive' : 'negative'}`}>
            <span>Estimated Profit / Loss</span>
            <span>{pl >= 0 ? '+' : ''}${fmt(pl)}</span>
          </div>
          <div className="summary-row total">
            <span>Total Sale Amount</span>
            <span className="total-value">${fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button className="cancel-btn" onClick={onCancel}>Cancel</button>
        <button
          className="sell-btn"
          onClick={handleReview}
          disabled={!isValid}
          aria-disabled={!isValid}
        >
          <DollarSign size={16} aria-hidden />
          Review Sell Order
        </button>
      </div>
    </div>
  );
};

/** Confirm sale modal */
const ConfirmModal: React.FC<{
  order:     SaleOrder;
  onCancel:  () => void;
  onConfirm: () => void;
}> = ({ order, onCancel, onConfirm }) => (
  <div
    className="confirmation-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
    onClick={(e) => e.target === e.currentTarget && onCancel()}
  >
    <div className="modal-content">
      <h3 id="confirm-title">Confirm Sale</h3>

      <div className="confirmation-details">
        <div className="confirm-row">
          <span className="confirm-label">Asset</span>
          <span className="confirm-value">{order.holding.logo} {order.holding.symbol}</span>
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
            <span className="confirm-value">${fmt(order.limitPrice)}</span>
          </div>
        )}
        <div className={`confirm-row profit-loss-row ${order.profitLoss >= 0 ? 'positive' : 'negative'}`}>
          <span className="confirm-label">Est. Profit / Loss</span>
          <span className="confirm-value">
            {order.profitLoss >= 0 ? '+' : ''}${fmt(order.profitLoss)}
          </span>
        </div>
        <div className="confirm-row total-row">
          <span className="confirm-label">Total</span>
          <span className="confirm-value">${fmt(order.total)}</span>
        </div>
      </div>

      <div className="modal-actions">
        <button className="cancel-btn" onClick={onCancel}>Cancel</button>
        <button className="confirm-btn" onClick={onConfirm}>
          <Zap size={15} aria-hidden /> Confirm Sale
        </button>
      </div>
    </div>
  </div>
);

/** Success screen */
const SuccessOverlay: React.FC<{
  order:         SaleOrder;
  onSellMore:    () => void;
  onGoPortfolio: () => void;
}> = ({ order, onSellMore, onGoPortfolio }) => (
  <div className="success-overlay" role="dialog" aria-modal="true" aria-labelledby="success-title">
    <div className="success-card">
      <div className="success-icon" aria-hidden>
        <CheckCircle size={34} />
      </div>
      <h3 id="success-title">Order Placed!</h3>
      <p>
        You sold <strong>{order.quantity} shares</strong> of{' '}
        <strong>{order.holding.symbol}</strong> for{' '}
        <strong>${fmt(order.total)}</strong>
        {order.profitLoss !== 0 && (
          <>
            {' '}with a{' '}
            <strong style={{ color: order.profitLoss >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
              {order.profitLoss >= 0 ? '+' : ''}${fmt(order.profitLoss)} P&amp;L
            </strong>
          </>
        )}.
      </p>
      <div className="success-actions">
        <button className="success-primary-btn" onClick={onGoPortfolio}>
          View Portfolio
        </button>
        <button className="success-secondary-btn" onClick={onSellMore}>
          Sell More Assets
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
type View = 'list' | 'form' | 'confirm' | 'success';

const SellAssets: React.FC = () => {
  const router = useRouter();

  const [view, setView]                   = useState<View>('list');
  const [selectedHolding, setSelected]    = useState<Holding | null>(null);
  const [pendingOrder, setPendingOrder]   = useState<SaleOrder | null>(null);

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Real positions, priced live by /api/portfolio. */
  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error('portfolio');
      const json = await res.json();
      if (!json?.success) throw new Error('portfolio');

      setHoldings((json.data.positions ?? []).map((pos: any) => ({
        id: pos.symbol,
        symbol: pos.symbol,
        name: pos.name || pos.symbol,
        quantity: pos.shares,
        avgCost: pos.avgCost,
        currentPrice: pos.price,
        logo: SYMBOL_LOGOS[pos.symbol] ?? '💠',
      })));
      setError(null);
    } catch {
      setHoldings([]);
      setError("We couldn't load your holdings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  const handleSelectHolding = useCallback((h: Holding) => {
    setSelected(h);
    setView('form');
  }, []);

  const handleReviewOrder = useCallback((order: SaleOrder) => {
    setPendingOrder(order);
    setView('confirm');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingOrder || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/orders/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: pendingOrder.holding.symbol,
          name:   pendingOrder.holding.name,
          shares: pendingOrder.quantity,
          price:  pendingOrder.limitPrice ?? pendingOrder.holding.currentPrice,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Sale failed');
      await loadPortfolio();
      setView('success');
    } catch (err: any) {
      setError(err?.message || 'We could not place that sale. Please try again.');
      setView('form');
    } finally {
      setSubmitting(false);
    }
  }, [pendingOrder, submitting]);

  const handleReset = useCallback(() => {
    setSelected(null);
    setPendingOrder(null);
    setView('list');
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'form')    { setView('list'); setSelected(null); return; }
    if (view === 'confirm') { setView('form'); return; }
    router.back();
  }, [view, router]);

  return (
    <div className="sell-assets-container">
      {/* Header */}
      <header className="sell-header">
        <button className="back-btn" onClick={handleBack} aria-label="Go back">
          <ArrowLeft size={18} />
        </button>
        <h1>
          {view === 'list'    ? 'Sell Assets'
           : view === 'form'  ? `Sell ${selectedHolding?.symbol ?? ''}`
           : 'Review Sale'}
        </h1>
        <div className="header-spacer" aria-hidden />
      </header>

      {/* Views */}
      {error && (
        <div className="sell-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadPortfolio}>Retry</button>
        </div>
      )}

      {view === 'list' && (
        <HoldingsListView
          holdings={holdings}
          loading={loading}
          onSelect={handleSelectHolding}
          onBrowse={() => router.push('/buy-stocks')}
        />
      )}

      {view === 'form' && selectedHolding && (
        <SellFormView
          holding={selectedHolding}
          onCancel={() => setView('list')}
          onReviewOrder={handleReviewOrder}
        />
      )}

      {/* Modals */}
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
          onSellMore={handleReset}
          onGoPortfolio={() => router.push('/investment')}
        />
      )}
    </div>
  );
};

export default SellAssets;

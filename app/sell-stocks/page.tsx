"use client";

import React, { useState, useCallback, useMemo } from 'react';
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

// ─────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────
const HOLDINGS: Holding[] = [
  { id: '1', symbol: 'AAPL',  name: 'Apple Inc.',       quantity: 10,  avgCost:  165.50, currentPrice:  178.45, logo: '🍎' },
  { id: '2', symbol: 'MSFT',  name: 'Microsoft Corp.',  quantity:  5,  avgCost:  380.20, currentPrice:  412.34, logo: '🪟' },
  { id: '3', symbol: 'NVDA',  name: 'NVIDIA Corp.',     quantity:  3,  avgCost:  720.00, currentPrice:  878.45, logo: '🎮' },
  { id: '4', symbol: 'TSLA',  name: 'Tesla Inc.',       quantity:  8,  avgCost:  255.30, currentPrice:  248.92, logo: '⚡' },
  { id: '5', symbol: 'AMZN',  name: 'Amazon.com Inc.',  quantity: 12,  avgCost:  168.75, currentPrice:  178.23, logo: '📦' },
  { id: '6', symbol: 'BTC',   name: 'Bitcoin',          quantity:  0.5, avgCost: 64_500.00, currentPrice: 67_234.50, logo: '₿' },
];

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
function PortfolioStats() {
  const totalValue = HOLDINGS.reduce((s, h) => s + h.currentPrice * h.quantity, 0);
  const totalPnL   = HOLDINGS.reduce((s, h) => {
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
const HoldingsListView: React.FC<{ onSelect: (h: Holding) => void }> = ({ onSelect }) => (
  <div className="holdings-list-view">
    <div className="portfolio-summary">
      <div className="summary-text">
        <h2>Your Portfolio</h2>
        <p>Select an asset to sell</p>
      </div>
      <PortfolioStats />
    </div>

    <div className="holdings-grid">
      {HOLDINGS.map((holding, i) => (
        <HoldingCard key={holding.id} holding={holding} index={i} onClick={() => onSelect(holding)} />
      ))}
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

  const handleSelectHolding = useCallback((h: Holding) => {
    setSelected(h);
    setView('form');
  }, []);

  const handleReviewOrder = useCallback((order: SaleOrder) => {
    setPendingOrder(order);
    setView('confirm');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingOrder) return;
    // TODO: replace with real API call
    // await fetch('/api/orders/sell', { method: 'POST', body: JSON.stringify(pendingOrder) });
    console.log('Sale confirmed:', pendingOrder);
    setView('success');
  }, [pendingOrder]);

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
      {view === 'list' && <HoldingsListView onSelect={handleSelectHolding} />}

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

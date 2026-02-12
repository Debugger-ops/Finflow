"use client";
import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import './SellAssets.css';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  logo: string;
}

const SellAssets: React.FC = () => {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [sellQuantity, setSellQuantity] = useState<string>('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Sample portfolio holdings
  const holdings: Holding[] = [
    { id: '1', symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, avgCost: 165.50, currentPrice: 178.45, logo: '🍎' },
    { id: '2', symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 5, avgCost: 380.20, currentPrice: 412.34, logo: '🪟' },
    { id: '3', symbol: 'NVDA', name: 'NVIDIA Corp.', quantity: 3, avgCost: 720.00, currentPrice: 878.45, logo: '🎮' },
    { id: '4', symbol: 'TSLA', name: 'Tesla Inc.', quantity: 8, avgCost: 255.30, currentPrice: 248.92, logo: '⚡' },
    { id: '5', symbol: 'AMZN', name: 'Amazon.com Inc.', quantity: 12, avgCost: 168.75, currentPrice: 178.23, logo: '📦' },
    { id: '6', symbol: 'BTC', name: 'Bitcoin', quantity: 0.5, avgCost: 64500.00, currentPrice: 67234.50, logo: '₿' },
  ];

  const calculateGainLoss = (holding: Holding) => {
    const totalCost = holding.avgCost * holding.quantity;
    const currentValue = holding.currentPrice * holding.quantity;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = (gainLoss / totalCost) * 100;
    return { gainLoss, gainLossPercent };
  };

  const handleSell = () => {
    if (selectedHolding && sellQuantity && parseFloat(sellQuantity) > 0) {
      setShowConfirmation(true);
    }
  };

  const confirmSale = () => {
    console.log('Sale confirmed:', {
      holding: selectedHolding,
      quantity: parseFloat(sellQuantity),
      orderType,
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : null,
      total: calculateSaleTotal()
    });
    
    setShowConfirmation(false);
    setSelectedHolding(null);
    setSellQuantity('');
    setLimitPrice('');
    alert('Sell order placed successfully!');
  };

  const calculateSaleTotal = () => {
    if (!selectedHolding || !sellQuantity) return 0;
    const price = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : selectedHolding.currentPrice;
    return price * parseFloat(sellQuantity);
  };

  const calculateProfitLoss = () => {
    if (!selectedHolding || !sellQuantity) return 0;
    const quantity = parseFloat(sellQuantity);
    const salePrice = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : selectedHolding.currentPrice;
    return (salePrice - selectedHolding.avgCost) * quantity;
  };

  return (
    <div className="sell-assets-container">
      <header className="sell-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Sell Assets</h1>
        <div className="header-spacer"></div>
      </header>

      {!selectedHolding ? (
        <div className="holdings-list-view">
          <div className="portfolio-summary">
            <h2>Your Portfolio</h2>
            <p>Select an asset to sell</p>
          </div>

          <div className="holdings-grid">
            {holdings.map((holding) => {
              const { gainLoss, gainLossPercent } = calculateGainLoss(holding);
              const currentValue = holding.currentPrice * holding.quantity;
              
              return (
                <div
                  key={holding.id}
                  className="holding-card"
                  onClick={() => setSelectedHolding(holding)}
                >
                  <div className="holding-header">
                    <div className="holding-info">
                      <span className="holding-logo">{holding.logo}</span>
                      <div className="holding-details">
                        <h3>{holding.symbol}</h3>
                        <p>{holding.name}</p>
                      </div>
                    </div>
                    <div className="holding-value">
                      <span className="value">${currentValue.toFixed(2)}</span>
                      <span className="quantity">{holding.quantity} shares</span>
                    </div>
                  </div>
                  
                  <div className="holding-stats">
                    <div className="stat">
                      <span className="label">Avg Cost</span>
                      <span className="value">${holding.avgCost.toFixed(2)}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Current</span>
                      <span className="value">${holding.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Gain/Loss</span>
                      <span className={`value ${gainLoss >= 0 ? 'positive' : 'negative'}`}>
                        {gainLoss >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        ${Math.abs(gainLoss).toFixed(2)} ({gainLossPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="sell-form-view">
          <div className="selected-holding-header">
            <span className="holding-logo-large">{selectedHolding.logo}</span>
            <div className="holding-header-info">
              <h2>{selectedHolding.symbol}</h2>
              <p>{selectedHolding.name}</p>
              <span className="shares-owned">You own {selectedHolding.quantity} shares</span>
            </div>
            <div className="current-price">
              <span className="price-label">Current Price</span>
              <span className="price-value">${selectedHolding.currentPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="order-type-selector">
            <button
              className={`order-type-btn ${orderType === 'market' ? 'active' : ''}`}
              onClick={() => setOrderType('market')}
            >
              Market Order
            </button>
            <button
              className={`order-type-btn ${orderType === 'limit' ? 'active' : ''}`}
              onClick={() => setOrderType('limit')}
            >
              Limit Order
            </button>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Quantity to Sell</label>
              <input
                type="number"
                placeholder="0"
                value={sellQuantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (parseFloat(value) <= selectedHolding.quantity) {
                    setSellQuantity(value);
                  }
                }}
                min="0"
                max={selectedHolding.quantity}
                step="0.001"
              />
              <span className="input-suffix">of {selectedHolding.quantity}</span>
            </div>

            <div className="quick-amounts">
              <button onClick={() => setSellQuantity((selectedHolding.quantity * 0.25).toString())}>25%</button>
              <button onClick={() => setSellQuantity((selectedHolding.quantity * 0.5).toString())}>50%</button>
              <button onClick={() => setSellQuantity((selectedHolding.quantity * 0.75).toString())}>75%</button>
              <button onClick={() => setSellQuantity(selectedHolding.quantity.toString())}>100%</button>
            </div>

            {orderType === 'limit' && (
              <div className="form-group">
                <label>Limit Price</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <span className="input-suffix">USD</span>
              </div>
            )}

            <div className="order-summary">
              <div className="summary-row">
                <span>Shares to Sell</span>
                <span>{sellQuantity || '0'}</span>
              </div>
              <div className="summary-row">
                <span>Price per share</span>
                <span>
                  ${orderType === 'limit' && limitPrice 
                    ? parseFloat(limitPrice).toFixed(2) 
                    : selectedHolding.currentPrice.toFixed(2)}
                </span>
              </div>
              <div className="summary-row">
                <span>Average Cost per share</span>
                <span>${selectedHolding.avgCost.toFixed(2)}</span>
              </div>
              <div className={`summary-row profit-loss ${calculateProfitLoss() >= 0 ? 'positive' : 'negative'}`}>
                <span>Estimated Profit/Loss</span>
                <span>
                  {calculateProfitLoss() >= 0 ? '+' : ''}${calculateProfitLoss().toFixed(2)}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total Sale Amount</span>
                <span>${calculateSaleTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setSelectedHolding(null)}>
              Cancel
            </button>
            <button 
              className="sell-btn" 
              onClick={handleSell}
              disabled={!sellQuantity || parseFloat(sellQuantity) <= 0 || parseFloat(sellQuantity) > selectedHolding.quantity}
            >
              <DollarSign size={18} />
              Review Sell Order
            </button>
          </div>
        </div>
      )}

      {showConfirmation && selectedHolding && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Sale</h3>
            <div className="confirmation-details">
              <p><strong>Asset:</strong> {selectedHolding.symbol}</p>
              <p><strong>Quantity:</strong> {sellQuantity} shares</p>
              <p><strong>Order Type:</strong> {orderType.toUpperCase()}</p>
              {orderType === 'limit' && <p><strong>Limit Price:</strong> ${limitPrice}</p>}
              <p className={`profit-loss ${calculateProfitLoss() >= 0 ? 'positive' : 'negative'}`}>
                <strong>Profit/Loss:</strong> {calculateProfitLoss() >= 0 ? '+' : ''}${calculateProfitLoss().toFixed(2)}
              </p>
              <p className="total-amount"><strong>Total:</strong> ${calculateSaleTotal().toFixed(2)}</p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
              <button className="confirm-btn sell" onClick={confirmSale}>
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellAssets;
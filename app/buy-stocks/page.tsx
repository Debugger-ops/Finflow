"use client";
import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowLeft, ShoppingCart } from 'lucide-react';
import './BuyAssets.css';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  logo: string;
}

const BuyAssets: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Sample assets data
  const assets: Asset[] = [
    { id: '1', symbol: 'AAPL', name: 'Apple Inc.', price: 178.45, change: 2.34, changePercent: 1.33, logo: '🍎' },
    { id: '2', symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.87, change: -1.23, changePercent: -0.85, logo: '🔍' },
    { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', price: 412.34, change: 5.67, changePercent: 1.39, logo: '🪟' },
    { id: '4', symbol: 'TSLA', name: 'Tesla Inc.', price: 248.92, change: -3.45, changePercent: -1.37, logo: '⚡' },
    { id: '5', symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.23, change: 1.89, changePercent: 1.07, logo: '📦' },
    { id: '6', symbol: 'NVDA', name: 'NVIDIA Corp.', price: 878.45, change: 12.34, changePercent: 1.42, logo: '🎮' },
    { id: '7', symbol: 'META', name: 'Meta Platforms', price: 485.67, change: 8.92, changePercent: 1.87, logo: '👤' },
    { id: '8', symbol: 'BTC', name: 'Bitcoin', price: 67234.50, change: -234.12, changePercent: -0.35, logo: '₿' },
  ];

  const filteredAssets = assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBuy = () => {
    if (selectedAsset && quantity && parseFloat(quantity) > 0) {
      setShowConfirmation(true);
    }
  };

  const confirmPurchase = () => {
    // Here you would integrate with your backend API
    console.log('Purchase confirmed:', {
      asset: selectedAsset,
      quantity: parseFloat(quantity),
      orderType,
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : null,
      total: calculateTotal()
    });
    
    // Reset form
    setShowConfirmation(false);
    setSelectedAsset(null);
    setQuantity('');
    setLimitPrice('');
    alert('Order placed successfully!');
  };

  const calculateTotal = () => {
    if (!selectedAsset || !quantity) return 0;
    const price = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : selectedAsset.price;
    return price * parseFloat(quantity);
  };

  return (
    <div className="buy-assets-container">
      <header className="buy-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Buy Assets</h1>
        <div className="header-spacer"></div>
      </header>

      {!selectedAsset ? (
        <div className="assets-list-view">
          <div className="search-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search stocks, crypto, ETFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="assets-grid">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="asset-card"
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="asset-info">
                  <span className="asset-logo">{asset.logo}</span>
                  <div className="asset-details">
                    <h3>{asset.symbol}</h3>
                    <p>{asset.name}</p>
                  </div>
                </div>
                <div className="asset-price">
                  <span className="price">${asset.price.toLocaleString()}</span>
                  <span className={`change ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                    {asset.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {asset.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="buy-form-view">
          <div className="selected-asset-header">
            <span className="asset-logo-large">{selectedAsset.logo}</span>
            <div className="asset-header-info">
              <h2>{selectedAsset.symbol}</h2>
              <p>{selectedAsset.name}</p>
            </div>
            <div className="current-price">
              <span className="price-label">Current Price</span>
              <span className="price-value">${selectedAsset.price.toLocaleString()}</span>
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
              <label>Quantity</label>
              <input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="0.001"
              />
              <span className="input-suffix">shares</span>
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
                <span>Shares</span>
                <span>{quantity || '0'}</span>
              </div>
              <div className="summary-row">
                <span>Price per share</span>
                <span>
                  ${orderType === 'limit' && limitPrice 
                    ? parseFloat(limitPrice).toFixed(2) 
                    : selectedAsset.price.toFixed(2)}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setSelectedAsset(null)}>
              Cancel
            </button>
            <button 
              className="buy-btn" 
              onClick={handleBuy}
              disabled={!quantity || parseFloat(quantity) <= 0}
            >
              <ShoppingCart size={18} />
              Review Order
            </button>
          </div>
        </div>
      )}

      {showConfirmation && selectedAsset && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Purchase</h3>
            <div className="confirmation-details">
              <p><strong>Asset:</strong> {selectedAsset.symbol}</p>
              <p><strong>Quantity:</strong> {quantity} shares</p>
              <p><strong>Order Type:</strong> {orderType.toUpperCase()}</p>
              {orderType === 'limit' && <p><strong>Limit Price:</strong> ${limitPrice}</p>}
              <p className="total-amount"><strong>Total:</strong> ${calculateTotal().toFixed(2)}</p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={confirmPurchase}>
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyAssets;
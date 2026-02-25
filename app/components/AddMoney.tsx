'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './AddMoney.css';

interface AddMoneyProps {
  goalId: string;
  onClose: () => void;
  onContribute: (goalId: string, amount: number) => void; // new
}

export default function AddMoney({ goalId, onClose, onContribute }: AddMoneyProps) {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAddMoney = async () => {
    const numAmount = Number(amount);

    if (!amount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/goals/${goalId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add money');
      }

      // ✅ Update the parent state immediately
      onContribute(goalId, numAmount);

      // Close modal
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <button
          className="closeButton"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="title">Add Money to Goal</h2>

        <div className="formGroup">
          <label htmlFor="amount" className="label">Amount ($)</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input"
            min="0"
            step="0.01"
            autoFocus
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="buttonGroup">
          <button
            onClick={handleAddMoney}
            disabled={loading}
            className="submitButton"
          >
            {loading ? 'Adding...' : 'Add Money'}
          </button>

          <button
            onClick={onClose}
            className="cancelButton"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

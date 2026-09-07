"use client";

/**
 * Pay Bills — backed by /api/bills. Bills live in the database against the
 * signed-in user, and paying one debits the real balance and writes a
 * Transaction (category "bills") so it lands in history and the reports.
 * This screen used to hold four hardcoded bills and fake the payment with a
 * setTimeout.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Zap, Search, ArrowLeft, Check, ChevronRight, Calendar, AlertCircle,
  TrendingDown, Plus, Trash2, RefreshCw, X,
} from 'lucide-react';
import './payBills.css';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  logo: string;
  status: 'pending' | 'paid';
  autopay: boolean;
  paidAt: string | null;
}

const CATEGORY_LOGOS: Record<string, string> = {
  Utilities: '⚡', Internet: '🌐', Finance: '💳', Water: '💧',
  Rent: '🏠', Phone: '📱', Insurance: '🛡️', Subscription: '🎬', Other: '🧾',
};

const emptyDraft = () => ({
  name: '', category: 'Utilities', amount: '',
  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
});

const PayBills: React.FC = () => {
  const router = useRouter();
  const { status } = useSession();

  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaying, setIsPaying]         = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [bills, setBills]     = useState<Bill[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft]     = useState(emptyDraft());
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsRes, balRes] = await Promise.all([
        fetch('/api/bills'),
        fetch('/api/user/balance'),
      ]);
      if (!billsRes.ok) throw new Error('bills');
      const json = await billsRes.json();
      setBills(json?.data?.bills ?? []);
      if (balRes.ok) {
        const b = await balRes.json();
        if (typeof b?.balance === 'number') setBalance(b.balance);
      }
    } catch {
      setError("We couldn't load your bills. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (status === 'authenticated') load(); }, [status, load]);

  const filteredBills = bills.filter(bill =>
    bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingBills = bills.filter(b => b.status === 'pending');
  const totalDue = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / 86400000);
  };

  const handlePayBill = (bill: Bill) => {
    setError(null);
    setSelectedBill(bill);
    setIsPaying(true);
  };

  /** Real payment: the API debits the balance and records the transaction. */
  const confirmPayment = async () => {
    if (!selectedBill) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/bills/${selectedBill.id}/pay`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Payment failed');

      setBills(prev => prev.map(b =>
        b.id === selectedBill.id ? { ...b, status: 'paid', paidAt: new Date().toISOString() } : b));
      if (typeof json?.data?.balance === 'number') setBalance(json.data.balance);

      setIsSuccess(true);
      setTimeout(() => {
        setIsPaying(false);
        setSelectedBill(null);
        setIsSuccess(false);
      }, 2200);
    } catch (err: any) {
      setError(err?.message || 'Payment failed. Please try again.');
      setIsPaying(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelPayment = () => {
    setIsPaying(false);
    setSelectedBill(null);
  };

  const addBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          amount: Number(draft.amount),
          logo: CATEGORY_LOGOS[draft.category] ?? '🧾',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Could not add the bill');
      setBills(prev => [...prev, json.data].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setDraft(emptyDraft());
      setAddOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Could not add the bill');
    } finally {
      setSaving(false);
    }
  };

  const deleteBill = async (id: string) => {
    const previous = bills;
    setBills(prev => prev.filter(b => b.id !== id));
    const res = await fetch(`/api/bills/${id}`, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) { setBills(previous); setError("Couldn't remove that bill."); }
  };

  return (
    <div className="pay-bills-container has-app-nav">
      <div className="pay-bills-header">
        <button
          className="back-button"
          onClick={() => router.push("/dashboard")}
          aria-label="Go back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="header-content">
          <h1 className="page-title">Pay Bills</h1>
          <p className="page-subtitle">
            {balance !== null
              ? `Available balance $${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Manage and pay your bills'}
          </p>
        </div>
        <button type="button" className="add-bill-button" onClick={() => setAddOpen(o => !o)}>
          {addOpen ? <X size={18} /> : <Plus size={18} />}
          <span>{addOpen ? 'Close' : 'Add bill'}</span>
        </button>
      </div>

      {error && (
        <div className="bills-banner" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button type="button" onClick={load}><RefreshCw size={13} /> Retry</button>
        </div>
      )}

      {addOpen && (
        <form className="add-bill-form" onSubmit={addBill}>
          <div className="add-bill-grid">
            <label>
              <span>Biller</span>
              <input
                required maxLength={80} value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="Electric Company"
              />
            </label>
            <label>
              <span>Category</span>
              <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
                {Object.keys(CATEGORY_LOGOS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span>Amount</span>
              <input
                required type="number" min="0.01" step="0.01" inputMode="decimal"
                value={draft.amount}
                onChange={e => setDraft({ ...draft, amount: e.target.value })}
                placeholder="125.50"
              />
            </label>
            <label>
              <span>Due date</span>
              <input
                required type="date" value={draft.dueDate}
                onChange={e => setDraft({ ...draft, dueDate: e.target.value })}
              />
            </label>
          </div>
          <button type="submit" className="add-bill-submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add bill'}
          </button>
        </form>
      )}

      {!isPaying ? (
        <>
          <div className="search-section">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search bills by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="bills-summary">
            <div className="summary-card total-due">
              <div className="summary-icon">
                <TrendingDown size={24} />
              </div>
              <div className="summary-info">
                <span className="summary-label">Total Due</span>
                <span className="summary-amount">${totalDue.toFixed(2)}</span>
              </div>
            </div>
            <div className="summary-card pending-count">
              <div className="summary-icon">
                <Calendar size={24} />
              </div>
              <div className="summary-info">
                <span className="summary-label">Pending Bills</span>
                <span className="summary-count">{pendingBills.length}</span>
              </div>
            </div>
          </div>

          <div className="bills-list">
            <div className="section-header">
              <h2 className="section-title">Upcoming Bills</h2>
              {pendingBills.length > 0 && (
                <span className="bills-count">{filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'}</span>
              )}
            </div>

            {loading ? (
              <div className="bills-grid" aria-hidden>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bill-skeleton" />)}
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Search size={48} />
                </div>
                <h3 className="empty-title">{searchTerm ? 'No bills found' : 'No bills yet'}</h3>
                <p className="empty-message">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Add a bill and FinFlow will track the due date and pay it from your balance.'}
                </p>
                {!searchTerm && (
                  <button type="button" className="add-bill-submit" onClick={() => setAddOpen(true)}>
                    <Plus size={16} /> Add your first bill
                  </button>
                )}
              </div>
            ) : (
              <div className="bills-grid">
                {filteredBills.map((bill) => {
                  const daysUntil = getDaysUntilDue(bill.dueDate);
                  const overdue = isOverdue(bill.dueDate);

                  return (
                    <div 
                      key={bill.id} 
                      className={`bill-card ${bill.status} ${overdue ? 'overdue' : ''}`}
                    >
                      {overdue && bill.status === 'pending' && (
                        <div className="overdue-badge">
                          <AlertCircle size={14} />
                          Overdue
                        </div>
                      )}
                      
                      <div className="bill-header">
                        <div className="bill-logo">{bill.logo}</div>
                        <div className="bill-info">
                          <h3 className="bill-name">{bill.name}</h3>
                          <span className="bill-category">{bill.category}</span>
                        </div>
                        <button
                          type="button"
                          className="bill-delete"
                          aria-label={`Remove ${bill.name}`}
                          onClick={() => deleteBill(bill.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="bill-details">
                        <div className="bill-due">
                          <Calendar size={16} />
                          <span className="bill-due-date">
                            {bill.status === 'paid' ? 'Paid on ' : 'Due '} 
                            {new Date(bill.dueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {bill.status === 'pending' && (
                          <div className={`days-until ${overdue ? 'overdue-text' : daysUntil <= 3 ? 'urgent' : ''}`}>
                            {overdue 
                              ? `${Math.abs(daysUntil)} days overdue` 
                              : daysUntil === 0 
                                ? 'Due today' 
                                : `${daysUntil} days left`
                            }
                          </div>
                        )}
                      </div>

                      <div className="bill-footer">
                        <span className="bill-amount">${bill.amount.toFixed(2)}</span>
                        {bill.status === 'pending' ? (
                          <button
                            onClick={() => handlePayBill(bill)}
                            className="pay-button"
                            disabled={balance !== null && balance < bill.amount}
                            title={balance !== null && balance < bill.amount ? 'Not enough balance' : undefined}
                          >
                            {balance !== null && balance < bill.amount ? 'Low balance' : 'Pay Now'}
                            <ChevronRight size={16} />
                          </button>
                        ) : (
                          <span className="paid-badge">
                            <Check size={16} />
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="payment-confirmation">
          {!isSuccess ? (
            <>
              <div className="confirmation-card">
                <div className="confirmation-icon">
                  <Zap size={48} />
                </div>
                <h2 className="confirmation-title">Confirm Payment</h2>
                <p className="confirmation-subtitle">Please review the details below</p>

                <div className="confirmation-details">
                  <div className="detail-row">
                    <span className="detail-label">Biller</span>
                    <span className="detail-value">{selectedBill?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{selectedBill?.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Due Date</span>
                    <span className="detail-value">
                      {selectedBill && new Date(selectedBill.dueDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Paid from</span>
                    <span className="detail-value">
                      Balance{balance !== null ? ` · $${balance.toFixed(2)} available` : ''}
                    </span>
                  </div>
                  <div className="detail-row total">
                    <span className="detail-label">Amount to Pay</span>
                    <span className="detail-value amount">${selectedBill?.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="confirmation-actions">
                  <button 
                    onClick={confirmPayment} 
                    className="confirm-button"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="spinner"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Confirm Payment
                      </>
                    )}
                  </button>
                  <button 
                    onClick={cancelPayment} 
                    className="cancel-button"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="success-animation">
              <div className="success-icon-wrapper">
                <div className="success-icon-large">
                  <Check size={64} />
                </div>
                <div className="success-ripple"></div>
                <div className="success-ripple delay"></div>
              </div>
              <h2 className="success-title">Payment Successful!</h2>
              <p className="success-message">
                Your payment of ${selectedBill?.amount.toFixed(2)} to {selectedBill?.name} has been processed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayBills;
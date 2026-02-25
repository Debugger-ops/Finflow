"use client";
import React, { useState } from 'react';
import { Zap, Search, ArrowLeft, Check, ChevronRight, Calendar, AlertCircle, TrendingDown } from 'lucide-react';
import './payBills.css';
import { useRouter } from "next/navigation";

interface Bill {
  id: number;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  logo: string;
  status: 'pending' | 'paid';
}

const PayBills: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const [bills, setBills] = useState<Bill[]>([
    {
      id: 1,
      name: 'Electric Company',
      category: 'Utilities',
      amount: 125.50,
      dueDate: '2026-02-10',
      logo: '⚡',
      status: 'pending',
    },
    {
      id: 2,
      name: 'Internet Provider',
      category: 'Utilities',
      amount: 79.99,
      dueDate: '2026-02-12',
      logo: '🌐',
      status: 'pending',
    },
    {
      id: 3,
      name: 'Credit Card',
      category: 'Finance',
      amount: 450.00,
      dueDate: '2026-02-15',
      logo: '💳',
      status: 'pending',
    },
    {
      id: 4,
      name: 'Water & Sewage',
      category: 'Utilities',
      amount: 62.30,
      dueDate: '2026-02-08',
      logo: '💧',
      status: 'pending',
    },
  ]);

  const filteredBills = bills.filter(bill =>
    bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingBills = bills.filter(b => b.status === 'pending');
  const totalDue = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);

  // Check if bill is overdue
  const isOverdue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Get days until due
  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsPaying(true);
  };

  const confirmPayment = async () => {
    if (selectedBill) {
      setIsProcessing(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setBills(bills.map(bill =>
        bill.id === selectedBill.id ? { ...bill, status: 'paid' } : bill
      ));
      
      setIsProcessing(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsPaying(false);
        setSelectedBill(null);
        setIsSuccess(false);
      }, 2500);
    }
  };

  const cancelPayment = () => {
    setIsPaying(false);
    setSelectedBill(null);
  };

  return (
    <div className="pay-bills-container">
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
          <p className="page-subtitle">Manage and pay your bills</p>
        </div>
      </div>

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

            {filteredBills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Search size={48} />
                </div>
                <h3 className="empty-title">No bills found</h3>
                <p className="empty-message">
                  {searchTerm ? 'Try adjusting your search terms' : 'You have no pending bills'}
                </p>
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
                          >
                            Pay Now
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
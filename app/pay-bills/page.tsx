"use client";
import React, { useState } from 'react';
import { Zap, Search, ArrowLeft, Check, ChevronRight } from 'lucide-react';
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

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsPaying(true);
  };

  const confirmPayment = () => {
    if (selectedBill) {
      setBills(bills.map(bill =>
        bill.id === selectedBill.id ? { ...bill, status: 'paid' } : bill
      ));
      setIsSuccess(true);
      setTimeout(() => {
        setIsPaying(false);
        setSelectedBill(null);
        setIsSuccess(false);
      }, 2000);
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
>
  <ArrowLeft size={20} />
</button>
        <h1 className="page-title">Pay Bills</h1>
      </div>

      {!isPaying ? (
        <>
          <div className="search-section">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="bills-summary">
            <div className="summary-card">
              <span className="summary-label">Total Due</span>
              <span className="summary-amount">
                ${bills.filter(b => b.status === 'pending').reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Pending Bills</span>
              <span className="summary-count">{bills.filter(b => b.status === 'pending').length}</span>
            </div>
          </div>

          <div className="bills-list">
            <h2 className="section-title">Upcoming Bills</h2>
            {filteredBills.length === 0 ? (
              <div className="empty-state">
                <p>No bills found</p>
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill.id} className={`bill-card ${bill.status}`}>
                  <div className="bill-logo">{bill.logo}</div>
                  <div className="bill-info">
                    <h3 className="bill-name">{bill.name}</h3>
                    <span className="bill-category">{bill.category}</span>
                    <span className="bill-due-date">Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="bill-action">
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
              ))
            )}
          </div>
        </>
      ) : (
        <div className="payment-confirmation">
          {!isSuccess ? (
            <>
              <div className="confirmation-icon">
                <Zap size={48} />
              </div>
              <h2 className="confirmation-title">Confirm Payment</h2>
              <div className="confirmation-details">
                <div className="detail-row">
                  <span className="detail-label">Biller:</span>
                  <span className="detail-value">{selectedBill?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">${selectedBill?.amount.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Due Date:</span>
                  <span className="detail-value">
                    {selectedBill && new Date(selectedBill.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="confirmation-actions">
                <button onClick={confirmPayment} className="confirm-button">
                  Confirm Payment
                </button>
                <button onClick={cancelPayment} className="cancel-button">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="success-animation">
              <div className="success-icon-large">
                <Check size={64} />
              </div>
              <h2 className="success-title">Payment Successful!</h2>
              <p className="success-message">Your bill has been paid</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayBills;
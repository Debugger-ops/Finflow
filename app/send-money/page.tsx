"use client";
import React, { useState, useEffect } from 'react';
import { 
  Send, User, DollarSign, ArrowLeft, Check, AlertCircle, 
  Clock, CreditCard, Smartphone, Building2, Calendar,
  TrendingUp, Search, Filter, ChevronRight, Star,
  Shield, Zap, Users, Globe
} from 'lucide-react';
import './sendMoney.css';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Contact {
  id: number;
  name: string;
  email: string;
  avatar: string;
  isFavorite?: boolean;
  lastTransaction?: string;
}

interface Transaction {
  id: number;
  recipient: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'sent' | 'received';
}

const SendMoney: React.FC = () => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    note: '',
    paymentMethod: 'bank',
    scheduleDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  // FIX #1: Real transaction history state (was hardcoded before)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  // Fetch balance only after session is loaded
  useEffect(() => {
    if (status === "authenticated") {
      const fetchBalance = async () => {
        try {
          const res = await fetch("/api/user/balance", {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch balance");
          const data = await res.json();
          setBalance(Number(data.balance) || 0);
        } catch {
          setBalance(47832.50);
        }
      };
      fetchBalance();
    }
  }, [status]);

  // FIX #1: Fetch real transaction history when History tab is opened
  useEffect(() => {
    if (activeTab === 'history' && status === "authenticated") {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const res = await fetch("/api/transactions/history", {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch history");
          const data = await res.json();
          setRecentTransactions(data.transactions || []);
        } catch {
          // Fallback to empty array if API not available
          setRecentTransactions([]);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab, status]);

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    router.push("/login");
    return null;
  }

  const recentContacts: Contact[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: 'JD', isFavorite: true, lastTransaction: '2 days ago' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', avatar: 'SS', isFavorite: true, lastTransaction: '5 days ago' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ', lastTransaction: '1 week ago' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', avatar: 'ED', lastTransaction: '2 weeks ago' },
    { id: 5, name: 'David Wilson', email: 'david@example.com', avatar: 'DW', isFavorite: true, lastTransaction: '3 weeks ago' },
  ];

  const quickAmounts = [50, 100, 200, 500];

  const paymentMethods = [
    { id: 'bank', name: 'Bank Account', icon: Building2, fee: 'Free', time: '1-3 days' },
    { id: 'card', name: 'Debit Card', icon: CreditCard, fee: '$0.50', time: 'Instant' },
    { id: 'wallet', name: 'Digital Wallet', icon: Smartphone, fee: 'Free', time: 'Instant' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const validateForm = () => {
    if (!formData.recipient || !/\S+@\S+\.\S+/.test(formData.recipient)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return false;
    }
    if (parseFloat(formData.amount) > balance) {
      setError("Insufficient balance.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !validateForm()) return;
    setShowConfirm(true);
  };

  const confirmSend = async () => {
  if (!formData.recipient.trim()) {
    setError("Recipient email is required.");
    return;
  }

  const sentAmount = parseFloat(formData.amount);
  if (isNaN(sentAmount) || sentAmount <= 0) {
    setError("Enter a valid amount.");
    return;
  }

  if (sentAmount > balance) {
    setError("Insufficient balance.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    console.log("Sending transaction:", {
      recipientEmail: formData.recipient,
      amount: sentAmount,
      note: formData.note,
      paymentMethod: formData.paymentMethod,
      scheduleDate: formData.scheduleDate,
    });

    const res = await fetch("/api/transactions/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmail: formData.recipient.trim(),
        amount: sentAmount,
        note: formData.note,
        paymentMethod: formData.paymentMethod,
        scheduleDate: formData.scheduleDate || null,
      }),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Transaction failed");

    // Update frontend balance
    setBalance(prev => prev - sentAmount);

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        recipient: "",
        amount: "",
        note: "",
        paymentMethod: 'bank',
        scheduleDate: ''
      });
      setSelectedContact(null);
      router.push("/dashboard");
    }, 2000);
  } catch (err: any) {
    setError(err.message || "Transaction failed. Please try again.");
  } finally {
    setLoading(false);
  }
};
  const selectContact = (contact: Contact) => {
    setFormData({ ...formData, recipient: contact.email });
    setSelectedContact(contact);
  };

  const setQuickAmount = (amount: number) => {
    if (amount > balance) {
      setError("Insufficient balance.");
      return;
    }
    setFormData({ ...formData, amount: amount.toString() });
  };

  const filteredContacts = recentContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteContacts = recentContacts.filter(c => c.isFavorite);

  return (
    <div className="send-money-container dark-mode">
      {/* Header */}
      <div className="send-money-header">
        <button className="back-button" onClick={() => router.push("/dashboard")} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Send Money</h1>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Filter">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Balance Display */}
      {balance !== null && (
        <div className="balance-card">
          <div className="balance-info">
            <span className="balance-label">Available Balance</span>
            <h2 className="balance-amount">${balance.toFixed(2)}</h2>
          </div>
          <div className="balance-badge">
            <TrendingUp size={16} />
            <span>+12.5%</span>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {isSuccess && (
        <div className="alert-message success">
          <Check size={20} />
          <span>Money sent successfully!</span>
        </div>
      )}

      {error && (
        <div className="alert-message error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
          // FIX #6: Clear error when switching tabs
          onClick={() => { setActiveTab('send'); setError(null); }}
        >
          <Send size={18} />
          <span>Send Money</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); setError(null); }}
        >
          <Clock size={18} />
          <span>History</span>
        </button>
      </div>

      {activeTab === 'send' ? (
        <div className="send-money-content">
          {/* Favorite Contacts */}
          {favoriteContacts.length > 0 && (
            <div className="favorites-section">
              <div className="section-header">
                <Star size={16} className="star-icon" />
                <h2 className="section-title">Favorites</h2>
              </div>
              <div className="favorites-list">
                {favoriteContacts.map((contact) => (
                  <button
                    key={contact.id}
                    className={`favorite-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                    onClick={() => selectContact(contact)}
                  >
                    <div className="favorite-avatar">{contact.avatar}</div>
                    <span className="favorite-name">{contact.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="main-content-grid">
            {/* Recent Contacts */}
            <div className="contacts-section">
              <div className="section-header">
                <h2 className="section-title">Recent Contacts</h2>
                <button className="view-all-btn">
                  View All <ChevronRight size={16} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="search-bar">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="contacts-list">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    className={`contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                    onClick={() => selectContact(contact)}
                  >
                    <div className="contact-avatar">{contact.avatar}</div>
                    <div className="contact-info">
                      <div className="contact-header">
                        <span className="contact-name">{contact.name}</span>
                        {contact.isFavorite && <Star size={12} className="favorite-star" />}
                      </div>
                      <span className="contact-email">{contact.email}</span>
                      {contact.lastTransaction && (
                        <span className="last-transaction">Last: {contact.lastTransaction}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Send Money Form */}
            <div className="form-section">
              <form className="send-money-form" onSubmit={handleSubmit}>
                {/* Recipient */}
                <div className="form-group">
                  <label htmlFor="recipient">Recipient</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input
                      type="email"
                      id="recipient"
                      name="recipient"
                      placeholder="Enter email or phone number"
                      value={formData.recipient}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  {selectedContact && (
                    <div className="selected-contact-badge">
                      <div className="badge-avatar">{selectedContact.avatar}</div>
                      <span>{selectedContact.name}</span>
                      <button
                        type="button"
                        className="clear-selection"
                        onClick={() => {
                          setSelectedContact(null);
                          setFormData({ ...formData, recipient: '' });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <div className="input-wrapper amount-input">
                    <DollarSign className="input-icon" size={20} />
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Quick Amounts */}
                  <div className="quick-amounts">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className="quick-amount-btn"
                        onClick={() => setQuickAmount(amount)}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="form-group">
                  <label>Payment Method</label>
                  <div className="payment-methods">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        className={`payment-method-btn ${formData.paymentMethod === method.id ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                      >
                        <method.icon size={20} />
                        <div className="method-info">
                          <span className="method-name">{method.name}</span>
                          <span className="method-details">{method.fee} • {method.time}</span>
                        </div>
                        {formData.paymentMethod === method.id && (
                          <div className="check-icon">
                            <Check size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule Date (Optional) */}
                <div className="form-group">
                  <label htmlFor="scheduleDate">Schedule Payment (Optional)</label>
                  <div className="input-wrapper">
                    <Calendar className="input-icon" size={20} />
                    <input
                      type="date"
                      id="scheduleDate"
                      name="scheduleDate"
                      value={formData.scheduleDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="form-group">
                  <label htmlFor="note">Note (Optional)</label>
                  <textarea
                    id="note"
                    name="note"
                    placeholder="What's this for?"
                    rows={3}
                    value={formData.note}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Security Notice */}
                <div className="security-notice">
                  <Shield size={16} />
                  <span>Your transaction is secured with end-to-end encryption</span>
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Money</span>
                    </>
                  )}
                </button>
              </form>

              {/* Transaction Summary */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="transaction-summary">
                  <h3>Transaction Summary</h3>
                  <div className="summary-row">
                    <span>Amount</span>
                    <span>${parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Fee</span>
                    <span>{paymentMethods.find(m => m.id === formData.paymentMethod)?.fee || 'Free'}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Transaction History */
        // FIX #1: Render real fetched transactions instead of hardcoded ones
        <div className="history-content">
          <div className="history-header">
            <h2 className="section-title">Recent Transactions</h2>
            <button className="export-btn">
              <Globe size={16} />
              Export
            </button>
          </div>

          {historyLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Loading transactions...</span>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="empty-state">
              <Clock size={40} />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="transactions-list">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-card">
                  <div className="transaction-left">
                    <div className={`transaction-icon ${transaction.type}`}>
                      {transaction.type === 'sent' ? <Send size={20} /> : <TrendingUp size={20} />}
                    </div>
                    <div className="transaction-info">
                      <h4>{transaction.recipient}</h4>
                      <span className="transaction-date">{transaction.date}</span>
                    </div>
                  </div>
                  <div className="transaction-right">
                    <span className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'sent' ? '-' : '+'}${transaction.amount.toFixed(2)}
                    </span>
                    <span className={`status-badge ${transaction.status}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowConfirm(false)}></div>
          <div className="confirm-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Confirm Transaction</h3>
                <button className="close-btn" onClick={() => setShowConfirm(false)}>×</button>
              </div>

              <div className="modal-body">
                <div className="confirmation-details">
                  <div className="detail-row">
                    <span className="detail-label">Recipient</span>
                    <span className="detail-value">{formData.recipient}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Amount</span>
                    <span className="detail-value amount">${parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment Method</span>
                    <span className="detail-value">
                      {paymentMethods.find(m => m.id === formData.paymentMethod)?.name}
                    </span>
                  </div>
                  {formData.scheduleDate && (
                    <div className="detail-row">
                      <span className="detail-label">Scheduled For</span>
                      <span className="detail-value">{formData.scheduleDate}</span>
                    </div>
                  )}
                  {formData.note && (
                    <div className="detail-row">
                      <span className="detail-label">Note</span>
                      <span className="detail-value">{formData.note}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button className="confirm-btn" onClick={confirmSend}>
                  <Shield size={16} />
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SendMoney;
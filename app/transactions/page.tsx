// app/transactions/page.tsx
'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Download, 
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Home,
  Car,
  Coffee,
  Smartphone,
  Heart,
  Music,
  Utensils,
  Plane,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import './transactions.css';

interface Transaction {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  icon: any;
  color: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
}

const TransactionsPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Extended transactions data
  const allTransactions: Transaction[] = [
    {
      id: '1',
      name: 'Amazon Purchase',
      category: 'Shopping',
      date: 'Feb 10, 2026',
      amount: -127.50,
      icon: ShoppingBag,
      color: 'blue',
      status: 'completed',
      paymentMethod: 'Visa ••1234'
    },
    {
      id: '2',
      name: 'Salary Deposit',
      category: 'Income',
      date: 'Feb 9, 2026',
      amount: 5000.00,
      icon: ArrowDownLeft,
      color: 'green',
      status: 'completed',
      paymentMethod: 'Direct Deposit'
    },
    {
      id: '3',
      name: 'Rent Payment',
      category: 'Housing',
      date: 'Feb 8, 2026',
      amount: -1500.00,
      icon: Home,
      color: 'purple',
      status: 'completed',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: '4',
      name: 'Uber Ride',
      category: 'Transportation',
      date: 'Feb 7, 2026',
      amount: -24.30,
      icon: Car,
      color: 'gray',
      status: 'completed',
      paymentMethod: 'Mastercard ••5678'
    },
    {
      id: '5',
      name: 'Starbucks',
      category: 'Food & Drink',
      date: 'Feb 7, 2026',
      amount: -8.45,
      icon: Coffee,
      color: 'brown',
      status: 'completed',
      paymentMethod: 'Apple Pay'
    },
    {
      id: '6',
      name: 'Apple Store',
      category: 'Electronics',
      date: 'Feb 6, 2026',
      amount: -899.00,
      icon: Smartphone,
      color: 'blue',
      status: 'pending',
      paymentMethod: 'Visa ••1234'
    },
    {
      id: '7',
      name: 'Gym Membership',
      category: 'Health',
      date: 'Feb 5, 2026',
      amount: -49.99,
      icon: Heart,
      color: 'red',
      status: 'completed',
      paymentMethod: 'Auto-Pay'
    },
    {
      id: '8',
      name: 'Spotify Premium',
      category: 'Entertainment',
      date: 'Feb 4, 2026',
      amount: -9.99,
      icon: Music,
      color: 'green',
      status: 'completed',
      paymentMethod: 'PayPal'
    },
    {
      id: '9',
      name: 'Freelance Payment',
      category: 'Income',
      date: 'Feb 3, 2026',
      amount: 750.00,
      icon: ArrowDownLeft,
      color: 'green',
      status: 'completed',
      paymentMethod: 'PayPal'
    },
    {
      id: '10',
      name: 'Restaurant',
      category: 'Food & Drink',
      date: 'Feb 2, 2026',
      amount: -65.40,
      icon: Utensils,
      color: 'orange',
      status: 'completed',
      paymentMethod: 'Visa ••1234'
    },
    {
      id: '11',
      name: 'Flight Booking',
      category: 'Travel',
      date: 'Feb 1, 2026',
      amount: -450.00,
      icon: Plane,
      color: 'blue',
      status: 'completed',
      paymentMethod: 'Mastercard ••5678'
    },
    {
      id: '12',
      name: 'Electricity Bill',
      category: 'Utilities',
      date: 'Jan 31, 2026',
      amount: -120.00,
      icon: Zap,
      color: 'yellow',
      status: 'completed',
      paymentMethod: 'Auto-Pay'
    }
  ];

  // Filter transactions
  const filteredTransactions = allTransactions.filter((transaction) => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' ? true :
                         selectedFilter === 'income' ? transaction.amount > 0 :
                         selectedFilter === 'expense' ? transaction.amount < 0 :
                         transaction.status === selectedFilter;
    
    const matchesCategory = selectedCategory === 'all' ? true : 
                           transaction.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesFilter && matchesCategory;
  });

  // Calculate summary
  const totalIncome = allTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = allTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleExport = () => {
    // Export functionality
    alert('Exporting transactions...');
  };

  return (
    <div className="transactions-page">
      <div className="transactions-container">
        {/* Header */}
        <div className="page-header">
          <button className="back-button" onClick={() => router.back()}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="header-content">
            <h1>All Transactions</h1>
            <p>Manage and review all your transactions</p>
          </div>
          <button className="export-button" onClick={handleExport}>
            <Download size={18} />
            Export
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card income">
            <div className="summary-icon">
              <ArrowDownLeft size={24} />
            </div>
            <div className="summary-details">
              <p className="summary-label">Total Income</p>
              <h3 className="summary-value">${totalIncome.toFixed(2)}</h3>
              <span className="summary-change positive">+12.5%</span>
            </div>
          </div>

          <div className="summary-card expense">
            <div className="summary-icon">
              <ArrowUpRight size={24} />
            </div>
            <div className="summary-details">
              <p className="summary-label">Total Expenses</p>
              <h3 className="summary-value">${totalExpenses.toFixed(2)}</h3>
              <span className="summary-change negative">+8.3%</span>
            </div>
          </div>

          <div className="summary-card balance">
            <div className="summary-icon">
              <ArrowDownLeft size={24} />
            </div>
            <div className="summary-details">
              <p className="summary-label">Net Balance</p>
              <h3 className="summary-value">${(totalIncome - totalExpenses).toFixed(2)}</h3>
              <span className="summary-change positive">+5.2%</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select 
              className="filter-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            <select 
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="shopping">Shopping</option>
              <option value="income">Income</option>
              <option value="housing">Housing</option>
              <option value="transportation">Transportation</option>
              <option value="food & drink">Food & Drink</option>
              <option value="electronics">Electronics</option>
              <option value="health">Health</option>
              <option value="entertainment">Entertainment</option>
              <option value="travel">Travel</option>
              <option value="utilities">Utilities</option>
            </select>

            <select 
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="transactions-list-container">
          <div className="list-header">
            <h2>
              {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="transactions-list">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="transaction-row">
                <div className="transaction-left">
                  <div className={`transaction-icon ${transaction.color}`}>
                    <transaction.icon size={20} />
                  </div>
                  <div className="transaction-info">
                    <h4>{transaction.name}</h4>
                    <div className="transaction-meta">
                      <span className="category">{transaction.category}</span>
                      <span className="separator">•</span>
                      <span className="date">{transaction.date}</span>
                      <span className="separator">•</span>
                      <span className="payment-method">{transaction.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                <div className="transaction-right">
                  <div className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                    {transaction.amount > 0 ? '+' : ''}
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                  <span className={`status-badge ${transaction.status}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="empty-state">
                <p>No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
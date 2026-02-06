"use client";

import React, { useState, useEffect } from 'react';
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Send, Download,
  CreditCard, Zap, ShoppingBag, Coffee, Car, Home, Smartphone,
  Plus, Search, Bell, User, Menu, X, Eye, EyeOff, ChevronRight, BarChart3, LineChart
} from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import './dashboard.css';

// Types
interface Transaction {
  id: number;
  name: string;
  category: string;
  amount: number;
  date: string;
  icon: React.ElementType;
  color: 'amber' | 'emerald' | 'blue' | 'purple' | 'red' | 'indigo';
}

interface Category {
  name: string;
  amount: number;
  percent: number;
  color: 'amber' | 'blue' | 'purple' | 'indigo';
  icon: React.ElementType;
}

interface Goal {
  name: string;
  current: number;
  target: number;
  color: 'emerald' | 'blue' | 'purple';
}

interface QuickAction {
  name: string;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'amber' | 'emerald';
  href: string;
}


const Dashboard: React.FC = () => {
  const [balanceVisible, setBalanceVisible] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'investments'>('overview');

  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  

  useEffect(() => {
    setIsClient(true);

    // Redirect if unauthenticated
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Wait until session is loaded on client
  if (!isClient || status === "loading") {
    return <div>Loading...</div>;
  }

  // If somehow no session, return nothing (redirect already triggered)
  if (!session) return null;

  

  // Data
  const balance = 47832.50;
  const monthlyIncome = 8500;
  const monthlyExpenses = 4670;

  const transactions: Transaction[] = [
    { 
      id: 1, 
      name: 'Starbucks Coffee', 
      category: 'Food', 
      amount: -12.50, 
      date: '2 hours ago', 
      icon: Coffee, 
      color: 'amber' 
    },
    { 
      id: 2, 
      name: 'Salary Deposit', 
      category: 'Income', 
      amount: 8500, 
      date: '1 day ago', 
      icon: TrendingUp, 
      color: 'emerald' 
    },
    { 
      id: 3, 
      name: 'Amazon Purchase', 
      category: 'Shopping', 
      amount: -156.80, 
      date: '2 days ago', 
      icon: ShoppingBag, 
      color: 'blue' 
    },
    { 
      id: 4, 
      name: 'Uber Ride', 
      category: 'Transport', 
      amount: -24.30, 
      date: '3 days ago', 
      icon: Car, 
      color: 'purple' 
    },
    { 
      id: 5, 
      name: 'Netflix Subscription', 
      category: 'Entertainment', 
      amount: -15.99, 
      date: '5 days ago', 
      icon: Smartphone, 
      color: 'red' 
    },
    { 
      id: 6, 
      name: 'Rent Payment', 
      category: 'Housing', 
      amount: -1500, 
      date: '1 week ago', 
      icon: Home, 
      color: 'indigo' 
    },
  ];

  const categories: Category[] = [
    { name: 'Food & Dining', amount: 890, percent: 32, color: 'amber', icon: Coffee },
    { name: 'Shopping', amount: 650, percent: 23, color: 'blue', icon: ShoppingBag },
    { name: 'Transport', amount: 420, percent: 15, color: 'purple', icon: Car },
    { name: 'Housing', amount: 1500, percent: 54, color: 'indigo', icon: Home },
  ];

  const goals: Goal[] = [
    { name: 'Emergency Fund', current: 8500, target: 15000, color: 'emerald' },
    { name: 'Vacation Fund', current: 3200, target: 5000, color: 'blue' },
    { name: 'New Laptop', current: 850, target: 2000, color: 'purple' },
  ];

const quickActions: QuickAction[] = [
  { name: 'Send Money', icon: Send, color: 'blue', href: '/send-money' },
  { name: 'Investments', icon: LineChart, color: 'emerald', href: '/investment' },

  { name: 'Pay Bills', icon: Zap, color: 'amber', href: '/pay-bills' },
  { name: 'Add Card', icon: CreditCard, color: 'emerald', href: '/add-card' },
];


  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    setSelectedPeriod(period);
    
  };

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="main-nav-tabs">
  
</div>

          <div className="header-left">
            <button 
              className="menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="logo-section">
              <div className="logo-icon">
                <Wallet size={20} />
              </div>
              <div className="logo-text">
                <h1>FinFlow</h1>
                <p>Financial Freedom</p>
              </div>
            </div>
          </div>

          <div className="header-right">
            <button className="search-btn">
              <Search size={18} />
              <span>Search...</span>
            </button>
            <button className="notification-btn" aria-label="Notifications">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
           <div className="user-menu">
  <div className="user-avatar" onClick={() => setProfileOpen(!profileOpen)}>
    {session.user?.image 
      ? <img src={session.user.image} alt="Avatar" className="avatar-img" />
      : <User size={16} />
    }
  </div>
  <div className="user-info">
    <p>{session.user?.name ?? session.user?.email}</p>
    <span>Premium</span>
  </div>

  {profileOpen && (
    <div className="profile-dropdown">
      <button onClick={() => router.push("/profile")}>Profile</button>
      <button onClick={() => signOut({ callbackUrl: "/login" })}>Logout</button>
    </div>
  )}
</div>
          </div>
        </div>
      </header>
    <div className="overview-section">
      
    </div>
      <div className="dashboard-container">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-bg-effect"></div>
          <div className="balance-bg-effect-2"></div>
          
          <div className="balance-content">
            <div className="balance-header">
              <div className="balance-info">
                <p>Total Balance</p>
                <div className="balance-amount-row">
                  <h2 className="balance-amount">
                    {balanceVisible 
                      ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                      : '••••••'
                    }
                  </h2>
                  <button 
                    className="visibility-toggle"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    aria-label="Toggle balance visibility"
                  >
                    {balanceVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
              <div className="balance-badge">
                <TrendingUp size={16} />
                <span>+12.5%</span>
              </div>
            </div>

            <div className="balance-stats">
              <div className="stat-box">
                <div className="stat-label">
                  <ArrowDownRight size={18} />
                  Income
                </div>
                <div className="stat-value">
                  ${monthlyIncome.toLocaleString()}
                </div>
                <div className="stat-change positive">
                  +5.2% from last month
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">
                  <ArrowUpRight size={18} />
                  Expenses
                </div>
                <div className="stat-value">
                  ${monthlyExpenses.toLocaleString()}
                </div>
                <div className="stat-change negative">
                  -2.1% from last month
                </div>
              </div>
            </div>

            {/* Quick Actions */}
           <div className="quick-actions">
  {quickActions.map((action, idx) => (
    <button
      key={idx}
      className="action-btn"
      onClick={() => router.push(action.href)}
    >
      <div className={`action-icon ${action.color}`}>
        <action.icon size={20} />
      </div>
      <p>{action.name}</p>
    </button>
  ))}
</div>

          </div>
        </div>

        {/* Period Selector */}
        <div className="period-selector-row">
          <h3 className="section-title">Activity Overview</h3>
          <div className="period-tabs">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`period-tab ${selectedPeriod === period ? 'active' : ''}`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="main-grid">
          {/* Recent Transactions */}
          <div className="transactions-card">
            <div className="card-header">
              <h3 className="card-title">Recent Transactions</h3>
              <button className="view-all-btn">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="transaction-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-left">
                    <div className={`transaction-icon ${transaction.color}`}>
                      <transaction.icon size={20} />
                    </div>
                    <div className="transaction-details">
                      <h4>{transaction.name}</h4>
                      <div className="transaction-meta">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{transaction.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                    {transaction.amount > 0 ? '+' : ''}
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Categories */}
            <div className="categories-card">
              <div className="card-header">
                <h3 className="card-title">Top Categories</h3>
              </div>
              <div className="category-list">
                {categories.map((category, idx) => (
                  <div key={idx} className="category-item">
                    <div className="category-row">
                      <div className="category-left">
                        <div className={`category-icon ${category.color}`}>
                          <category.icon size={14} />
                        </div>
                        <span className="category-name">{category.name}</span>
                      </div>
                      <span className="category-amount">${category.amount}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${category.color}`}
                        style={{ width: `${category.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals */}

<div className="goals-card clickable" onClick={() => router.push('/dashboard/goals')}>
  <div className="goals-header">
    <h3 className="card-title">Goals</h3>
    <button 
      className="add-goal-btn" 
      aria-label="Add goal"
      onClick={(e) => {
        e.stopPropagation(); // Prevent navigating when clicking the + button
        router.push('/Goals'); // Open full Goals page
      }}
    >
      <Plus size={16} style={{ color: '#10b981' }} />
    </button>
  </div>

  <div className="goals-list">
    {goals.slice(0, 3).map((goal, idx) => { // Show only first 3 goals as preview
      const progress = (goal.current / goal.target) * 100;
      return (
        <div key={idx} className="goal-item">
          <div className="goal-header">
            <p className="goal-name">{goal.name}</p>
            <span className="goal-percentage">{Math.round(progress)}%</span>
          </div>
          <div className="goal-progress">
            <div className="progress-bar">
              <div 
                className={`progress-fill ${goal.color}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <p className="goal-stats">
            ${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}
          </p>
        </div>
      );
    })}
  </div>

  <button 
    className="view-all-goals-btn"
    onClick={(e) => {
      e.stopPropagation();
      router.push('/Goals');
    }}
  >
    View All Goals
  </button>
</div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
"use client";

import React, { useState, useEffect } from 'react';
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Send, Download,
  CreditCard, Zap, ShoppingBag, Coffee, Car, Home, Smartphone,
  Plus, Search, Bell, User, Menu, X, Eye, EyeOff, ChevronRight, 
  BarChart3, LineChart, PiIcon, Calendar, DollarSign, Target,
  Award, AlertCircle, CheckCircle, Clock, RefreshCw, Settings,
  Filter, Download as DownloadIcon, Share2, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationSystem from '../components/NotificationSystem';
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
  _id: string;
  name: string;
  current: number;
  target: number;
  category: string;
}

interface QuickAction {
  name: string;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'amber' | 'emerald';
  href: string;
}

interface BudgetItem {
  category: string;
  spent: number;
  limit: number;
  icon: React.ElementType;
  color: 'amber' | 'blue' | 'purple' | 'red';
}

interface Insight {
  id: number;
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  icon: React.ElementType;
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
  const [goals, setGoals] = useState<Goal[]>([]);
const data = [
  { name: 'Shopping', value: 300 },
  { name: 'Transport', value: 200 },
  { name: 'Food & Dining', value: 300 },
  { name: 'Housing', value: 400 },
];

const COLORS = ['#0088FE', '#7200c4', '#FFBB28', '#4816de'];
const [showChart, setShowChart] = useState(false);
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await fetch("/api/goals");
        const data = await res.json();

        const normalized = data.map((g: any) => ({
          ...g,
          current: g.current ?? 0,
          target: g.target ?? 0,
        }));

        setGoals(normalized);
      } catch (err) {
        console.error("Failed to fetch goals", err);
      }
    };

    fetchGoals();
  }, []);

  useEffect(() => {
    setIsClient(true);

    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (!isClient || status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) return null;

  const goalColorMap: Record<string, string> = {
    emergency: 'emerald',
    travel: 'blue',
    transportation: 'purple',
    housing: 'indigo',
    education: 'amber',
    health: 'red',
    business: 'purple',
    tech: 'blue',
  };

  // Data
  const balance = 47832.50;
  const monthlyIncome = 8500;
  const monthlyExpenses = 4670;
  const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1);

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

  const budgets: BudgetItem[] = [
    { category: 'Groceries', spent: 450, limit: 600, icon: ShoppingBag, color: 'blue' },
    { category: 'Dining Out', spent: 380, limit: 400, icon: Coffee, color: 'amber' },
    { category: 'Transportation', spent: 220, limit: 300, icon: Car, color: 'blue' },
    { category: 'Entertainment', spent: 180, limit: 200, icon: Smartphone, color: 'purple' },
  ];

  const insights: Insight[] = [
    {
      id: 1,
      type: 'success',
      title: 'Great Savings This Month!',
      description: `You've saved ${savingsRate}% of your income this month`,
      icon: CheckCircle
    },
    {
      id: 2,
      type: 'warning',
      title: 'Dining Budget Alert',
      description: 'Youve spent 95% of your dining budget',
      icon: AlertCircle
    },
    {
      id: 3,
      type: 'info',
      title: 'Recurring Payment Due',
      description: 'Netflix subscription renews in 2 days',
      icon: Clock
    }
  ];

  const quickActions: QuickAction[] = [
    { name: 'Send Money', icon: Send, color: 'blue', href: '/send-money' },
    { name: 'Investments', icon: LineChart, color: 'emerald', href: '/investment' },
    { name: 'Pay Bills', icon: Zap, color: 'amber', href: '/pay-bills' },
    { name: 'Add Card', icon: CreditCard, color: 'purple', href: '/add-card' },
  ];

  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    setSelectedPeriod(period);
  };

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="header-content">
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
            
  {open && <NotificationSystem />}
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

        {/* Financial Insights Section */}
        <div className="insights-section">
          <div className="insights-header">
            <div className="insights-title">
              <Sparkles size={20} />
              <h3>Financial Insights</h3>
            </div>
            <button className="refresh-btn">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="insights-grid">
            {insights.map((insight) => (
              <div key={insight.id} className={`insight-card ${insight.type}`}>
                <div className="insight-icon">
                  <insight.icon size={20} />
                </div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </div>
              </div>
            ))}
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
              <div className="card-actions">
                <button className="icon-btn" aria-label="Filter">
                  <Filter size={16} />
                </button>
                <button 
  className="view-all-btn"
  onClick={() => router.push('/transactions')}
>
  View All <ChevronRight size={16} />
</button>
              </div>
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
            {/* Budget Tracker */}
            <div className="budget-card">
              <div className="card-header">
                <h3 className="card-title">Budget Tracker</h3>
                <button className="dd" aria-label="Settings"icon-btn>
                  <Settings size={16} />
                </button>
              </div>
              <div className="budget-list">
                {budgets.map((budget, idx) => {
                  const percentage = (budget.spent / budget.limit) * 100;
                  const isNearLimit = percentage >= 90;
                  return (
                    <div key={idx} className="budget-item">
                      <div className="budget-row">
                        <div className="budget-left">
                          <div className={`budget-icon ${budget.color}`}>
                            <budget.icon size={14} />
                          </div>
                          <span className="budget-name">{budget.category}</span>
                        </div>
                        <span className={`budget-amount ${isNearLimit ? 'warning' : ''}`}>
                          ${budget.spent} / ${budget.limit}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${budget.color} ${isNearLimit ? 'warning' : ''}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="budget-remaining">
                        ${budget.limit - budget.spent} remaining
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Categories */}
            <div className="categories-card">
              <div className="card-header">
                <h3 className="card-title">Top Categories</h3>
                <button
        className="icon-btn"
        aria-label="View chart"
        onClick={() => setShowChart(!showChart)}
      >
        <PiIcon size={16} />
      </button>
         {showChart && (
        <div style={{ width: 300, height: 300, marginTop: 20 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
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
            <div className="goals-card clickable" onClick={() => router.push('/Goals')}>
              <div className="goals-header">
                <h3 className="card-title">Goals</h3>
                <button 
                  className="add-goal-btn" 
                  aria-label="Add goal"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/Goals');
                  }}
                >
                  <Plus size={16} style={{ color: '#10b981' }} />
                </button>
              </div>

              <div className="goals-list">
                {goals.slice(0, 3).map((goal) => {
                  const progress = (goal.current / goal.target) * 100;
                  const color = goalColorMap[goal.category] ?? 'emerald';

                  return (
                    <div key={goal._id} className="goal-item">
                      <div className="goal-header">
                        <p className="goal-name">{goal.name}</p>
                        <span className="goal-percentage">{Math.round(progress)}%</span>
                      </div>

                      <div className="goal-progress">
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${color}`}
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

              <div
                className="view-all-goals-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/Goals');
                }}
              >
                View All Goals
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
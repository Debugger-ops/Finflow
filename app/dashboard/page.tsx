"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Send,
  CreditCard, Zap, ShoppingBag, Coffee, Car, Home, Smartphone,
  Plus, Search, Bell, User, Menu, X, Eye, EyeOff, ChevronRight,
  LineChart, PiIcon, AlertCircle, CheckCircle, Clock, RefreshCw,
  Settings, Filter, Sparkles, TrendingDown, Activity, Globe,
  Briefcase, Bitcoin, BarChart2, Star, Gift, Layers, ChevronUp,
  ChevronDown, ArrowRight, Percent, Shield, Flame, Calendar,
  DollarSign, PieChart as PieChartIcon, Banknote, Landmark,
  CircleDollarSign, Coins, WalletCards
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
  LineChart as ReLineChart, Line
} from 'recharts';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationSystem from '../components/NotificationSystem';
import './dashboard.css';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Transaction {
  id: number; name: string; category: string; amount: number;
  date: string; icon: React.ElementType;
  color: 'amber' | 'emerald' | 'blue' | 'purple' | 'red' | 'indigo';
}
interface Category {
  name: string; amount: number; percent: number;
  color: 'amber' | 'blue' | 'purple' | 'indigo'; icon: React.ElementType;
}
interface Goal {
  _id: string; name: string; current: number; target: number; category: string;
}
interface QuickAction {
  name: string; icon: React.ElementType; color: 'blue'|'purple'|'amber'|'emerald'; href: string;
}
interface BudgetItem {
  category: string; spent: number; limit: number;
  icon: React.ElementType; color: 'amber'|'blue'|'purple'|'red';
}
interface Insight {
  id: number; type: 'warning'|'success'|'info';
  title: string; description: string; icon: React.ElementType;
}
interface Investment {
  name: string; ticker: string; value: number; change: number;
  changeAmt: number; color: string; icon: React.ElementType;
}
interface CryptoAsset {
  name: string; symbol: string; amount: number; value: number;
  change: number; color: string;
}

// ─────────────────────────────────────────────────────────────
// Chart data
// ─────────────────────────────────────────────────────────────
const spendingTrendData = [
  { month: 'Aug', income: 8200, expenses: 5100 },
  { month: 'Sep', income: 8500, expenses: 4800 },
  { month: 'Oct', income: 8100, expenses: 5400 },
  { month: 'Nov', income: 9000, expenses: 4600 },
  { month: 'Dec', income: 8700, expenses: 5200 },
  { month: 'Jan', income: 8500, expenses: 4670 },
];

const weeklySpendData = [
  { day: 'Mon', amount: 120 }, { day: 'Tue', amount: 340 },
  { day: 'Wed', amount: 80 },  { day: 'Thu', amount: 220 },
  { day: 'Fri', amount: 580 }, { day: 'Sat', amount: 460 },
  { day: 'Sun', amount: 190 },
];

const pieData = [
  { name: 'Shopping',    value: 300 },
  { name: 'Transport',   value: 200 },
  { name: 'Food',        value: 300 },
  { name: 'Housing',     value: 400 },
  { name: 'Entertainment', value: 120 },
];
const PIE_COLORS = ['#60a5fa', '#a78bfa', '#fbbf24', '#818cf8', '#34d399'];

// ─────────────────────────────────────────────────────────────
// Custom Chart Tooltips
// ─────────────────────────────────────────────────────────────
const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: '0.8rem', fontWeight: 600 }}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 600 }}>
        ${payload[0].value}
      </p>
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p style={{ fontWeight: 600 }}>{payload[0].name}</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Animated Counter
// ─────────────────────────────────────────────────────────────
const AnimatedNumber: React.FC<{ value: number; prefix?: string; decimals?: number }> = ({
  value, prefix = '', decimals = 0
}) => {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = Date.now();
    const duration = 1200;
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * ease);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);
  return (
    <span>{prefix}{display.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}</span>
  );
};

// ─────────────────────────────────────────────────────────────
// Stat Card (top summary row)
// ─────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: number; prefix?: string; change: number;
  icon: React.ElementType; color: string; delay?: string;
}> = ({ label, value, prefix = '$', change, icon: Icon, color, delay = '0s' }) => (
  <div className="stat-card" style={{ animationDelay: delay }}>
    <div className="stat-card-top">
      <div className="stat-card-icon" style={{ '--card-color': color } as any}>
        <Icon size={16} />
      </div>
      <span className={`stat-card-badge ${change >= 0 ? 'pos' : 'neg'}`}>
        {change >= 0 ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {Math.abs(change)}%
      </span>
    </div>
    <div className="stat-card-value">
      <AnimatedNumber value={value} prefix={prefix} decimals={prefix === '$' ? 0 : 1} />
    </div>
    <p className="stat-card-label">{label}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [balanceVisible, setBalanceVisible]   = useState(true);
  const [sidebarOpen,    setSidebarOpen]       = useState(false);
  const [profileOpen,    setProfileOpen]       = useState(false);
  const [notifOpen,      setNotifOpen]         = useState(false);
  const [selectedPeriod, setSelectedPeriod]   = useState<'week'|'month'|'year'>('month');
  const [showChart,      setShowChart]         = useState(false);
  const [activeTab,      setActiveTab]         = useState<'overview'|'analytics'|'investments'>('overview');
  const [goals,          setGoals]             = useState<Goal[]>([]);
  const [isClient,       setIsClient]          = useState(false);

  const router  = useRouter();
  const { data: session, status } = useSession();

  // ── Goals fetch
  useEffect(() => {
    fetch("/api/goals").then(r => r.json()).then((data: any[]) =>
      setGoals(data.map(g => ({ ...g, current: g.current ?? 0, target: g.target ?? 0 })))
    ).catch(console.error);
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // ── Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.user-menu'))     setProfileOpen(false);
      if (!(e.target as HTMLElement).closest('.notif-wrapper')) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isClient || status === 'loading') return (
    <div className="loading-screen">
      <div className="loading-logo"><Wallet size={28} /></div>
      <p>Loading your finances…</p>
    </div>
  );
  if (!session) return null;

  // ─────────── Static data ───────────
  const balance         = 47_832.50;
  const monthlyIncome   = 8_500;
  const monthlyExpenses = 4_670;
  const savingsRate     = ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100);

  const goalColorMap: Record<string, string> = {
    emergency:'emerald', travel:'blue', transportation:'purple',
    housing:'indigo',    education:'amber', health:'red',
    business:'purple',   tech:'blue',
  };

  const transactions: Transaction[] = [
    { id:1, name:'Starbucks Coffee',     category:'Food',          amount:-12.50,   date:'2h ago',   icon:Coffee,      color:'amber'   },
    { id:2, name:'Salary Deposit',        category:'Income',        amount:8_500,    date:'1d ago',   icon:TrendingUp,  color:'emerald' },
    { id:3, name:'Amazon Purchase',       category:'Shopping',      amount:-156.80,  date:'2d ago',   icon:ShoppingBag, color:'blue'    },
    { id:4, name:'Uber Ride',             category:'Transport',     amount:-24.30,   date:'3d ago',   icon:Car,         color:'purple'  },
    { id:5, name:'Netflix Subscription',  category:'Entertainment', amount:-15.99,   date:'5d ago',   icon:Smartphone,  color:'red'     },
    { id:6, name:'Rent Payment',          category:'Housing',       amount:-1_500,   date:'1w ago',   icon:Home,        color:'indigo'  },
    { id:7, name:'Freelance Payment',     category:'Income',        amount:1_200,    date:'1w ago',   icon:Briefcase,   color:'emerald' },
    { id:8, name:'Grocery Store',         category:'Food',          amount:-89.40,   date:'1w ago',   icon:ShoppingBag, color:'amber'   },
  ];

  const categories: Category[] = [
    { name:'Food & Dining', amount:890,   percent:32, color:'amber',  icon:Coffee      },
    { name:'Shopping',      amount:650,   percent:23, color:'blue',   icon:ShoppingBag },
    { name:'Transport',     amount:420,   percent:15, color:'purple', icon:Car         },
    { name:'Housing',       amount:1_500, percent:54, color:'indigo', icon:Home        },
  ];

  const budgets: BudgetItem[] = [
    { category:'Groceries',      spent:450, limit:600, icon:ShoppingBag, color:'blue'   },
    { category:'Dining Out',     spent:380, limit:400, icon:Coffee,      color:'amber'  },
    { category:'Transportation', spent:220, limit:300, icon:Car,         color:'blue'   },
    { category:'Entertainment',  spent:180, limit:200, icon:Smartphone,  color:'purple' },
  ];

  const insights: Insight[] = [
    { id:1, type:'success', title:'Great Savings!',       description:`You've saved ${savingsRate.toFixed(1)}% of your income this month.`,    icon:CheckCircle },
    { id:2, type:'warning', title:'Dining Budget Alert',  description:'Youve spent 95% of your dining budget — only $20 left.',               icon:AlertCircle },
    { id:3, type:'info',    title:'Subscription Due',     description:'Netflix renews in 2 days. Review your subscriptions.',                  icon:Clock       },
  ];

  const quickActions: QuickAction[] = [
    { name:'Send',        icon:Send,       color:'blue',    href:'/send-money' },
    { name:'Invest',      icon:LineChart,  color:'emerald', href:'/investment' },
    { name:'Pay Bills',   icon:Zap,        color:'amber',   href:'/pay-bills'  },
    { name:'Add Card',    icon:CreditCard, color:'purple',  href:'/add-card'   },
  ];

  const investments: Investment[] = [
    { name:'Apple Inc.',      ticker:'AAPL',   value:12_450, change:+2.3,  changeAmt:+280,  color:'#60a5fa',  icon:Globe       },
    { name:'Tesla',           ticker:'TSLA',   value:8_200,  change:-1.2,  changeAmt:-99,   color:'#f87171',  icon:Activity    },
    { name:'S&P 500 ETF',     ticker:'SPY',    value:15_600, change:+0.8,  changeAmt:+124,  color:'#34d399',  icon:BarChart2   },
    { name:'Nvidia Corp.',    ticker:'NVDA',   value:6_800,  change:+4.1,  changeAmt:+268,  color:'#a78bfa',  icon:Layers      },
  ];

  const cryptos: CryptoAsset[] = [
    { name:'Bitcoin',  symbol:'BTC', amount:0.42,  value:26_880, change:+3.2,  color:'#f59e0b' },
    { name:'Ethereum', symbol:'ETH', amount:2.1,   value:4_725,  change:+1.8,  color:'#818cf8' },
    { name:'Solana',   symbol:'SOL', amount:15.5,  value:1_240,  change:-0.6,  color:'#34d399' },
  ];

  const summaryStats = [
    { label:'Net Worth',     value:102_430, change:+8.4,  icon:CircleDollarSign, color:'#6d7eff' },
    { label:'Savings Rate',  value:45.1,    change:+2.1,  icon:Percent,          color:'#34d399', prefix:'', suffix:'%' },
    { label:'Investments',   value:43_050,  change:+12.3, icon:TrendingUp,       color:'#a78bfa' },
    { label:'Monthly Saved', value:3_830,   change:+5.2,  icon:Coins,            color:'#fbbf24' },
  ];

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ──────────── HEADER ──────────── */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu">
              {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <div className="logo-section">
              <div className="logo-icon"><Wallet size={17}/></div>
              <div className="logo-text">
                <h1>FinFlow</h1>
                <p>Financial Freedom</p>
              </div>
            </div>
          </div>

          {/* Nav tabs (desktop) */}
          <nav className="header-nav">
            {(['overview','analytics','investments'] as const).map(tab => (
              <button
                key={tab}
                className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          <div className="header-right">
            <button className="search-btn" aria-label="Search">
              <Search size={14}/>
              <span>Search…</span>
            </button>
            <div className="notif-wrapper">
              <button className="notif-btn" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
                <Bell size={17}/>
                <span className="notif-dot"/>
              </button>
              {notifOpen && <NotificationSystem/>}
            </div>
            <div className="user-menu">
              <div className="user-avatar" onClick={() => setProfileOpen(!profileOpen)}>
                {session.user?.image
                  ? <img src={session.user.image} alt="Avatar" className="avatar-img"/>
                  : <User size={15}/>}
              </div>
              <div className="user-info" onClick={() => setProfileOpen(!profileOpen)}>
                <p>{session.user?.name ?? session.user?.email}</p>
                <span>⭐ Premium</span>
              </div>
              {profileOpen && (
                <div className="profile-dropdown">
                  <button onClick={() => router.push('/profile')}>
                    <User size={13}/> Profile
                  </button>
                  <button onClick={() => router.push('/settings')}>
                    <Settings size={13}/> Settings
                  </button>
                  <div className="dropdown-divider"/>
                  <button className="logout-btn" onClick={() => signOut({ callbackUrl:'/login' })}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ──────────── MAIN ──────────── */}
      <main className="dashboard-container">

        {/* ── Welcome banner ── */}
        <div className="welcome-row">
          <div>
            <h2 className="welcome-heading">
              Good morning, {session.user?.name?.split(' ')[0] ?? 'there'} 👋
            </h2>
            <p className="welcome-sub">Here's your financial summary for January 2025</p>
          </div>
          <div className="welcome-actions">
            <button className="btn-outline" onClick={() => router.push('/reports')}>
              <BarChart2 size={14}/> View Report
            </button>
            <button className="btn-primary" onClick={() => router.push('/Goals')}>
              <Plus size={14}/> New Goal
            </button>
          </div>
        </div>

        {/* ── Top stats row ── */}
        <div className="stats-row">
          {summaryStats.map((s, i) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              prefix={s.prefix !== undefined ? s.prefix : '$'}
              change={s.change}
              icon={s.icon}
              color={s.color}
              delay={`${i * 0.08}s`}
            />
          ))}
        </div>

        {/* ── Hero balance card ── */}
        <div className="balance-card">
          <div className="balance-mesh" aria-hidden/>
          <div className="balance-orb1"  aria-hidden/>
          <div className="balance-orb2"  aria-hidden/>

          <div className="balance-content">
            <div className="balance-header">
              <div className="balance-info">
                <p className="balance-eyebrow">Total Balance</p>
                <div className="balance-amount-row">
                  <h2 className="balance-amount">
                    {balanceVisible
                      ? <AnimatedNumber value={balance} prefix="$" decimals={2}/>
                      : '•••••••'}
                  </h2>
                  <button className="visibility-toggle" onClick={() => setBalanceVisible(!balanceVisible)}>
                    {balanceVisible ? <Eye size={17}/> : <EyeOff size={17}/>}
                  </button>
                </div>
                <div className="balance-meta">
                  <span className="balance-change-pill">
                    <TrendingUp size={12}/> +$4,210 this month
                  </span>
                  <span className="balance-date">Updated just now</span>
                </div>
              </div>
              <div className="balance-right-col">
                <div className="balance-badge"><TrendingUp size={13}/> +12.5% YTD</div>
                <div className="balance-mini-chart">
                  {[40,55,45,70,60,80,75,90,85,95].map((h,i) => (
                    <div key={i} className="mini-bar" style={{ height:`${h}%`, animationDelay:`${i*0.05}s` }}/>
                  ))}
                </div>
              </div>
            </div>

            <div className="balance-stats">
              <div className="stat-box">
                <div className="stat-label"><ArrowDownRight size={13}/> Income</div>
                <div className="stat-value"><AnimatedNumber value={monthlyIncome} prefix="$"/></div>
                <div className="stat-change positive">↑ +5.2% from last month</div>
              </div>
              <div className="stat-box">
                <div className="stat-label"><ArrowUpRight size={13}/> Expenses</div>
                <div className="stat-value"><AnimatedNumber value={monthlyExpenses} prefix="$"/></div>
                <div className="stat-change negative">↓ −2.1% from last month</div>
              </div>
              <div className="stat-box highlight-box">
                <div className="stat-label"><Flame size={13}/> Saved</div>
                <div className="stat-value saved-value"><AnimatedNumber value={monthlyIncome - monthlyExpenses} prefix="$"/></div>
                <div className="stat-change positive">↑ {savingsRate.toFixed(1)}% savings rate</div>
              </div>
            </div>

            <div className="quick-actions">
              {quickActions.map((a, i) => (
                <button key={i} className="action-btn" onClick={() => router.push(a.href)}>
                  <div className={`action-icon ${a.color}`}><a.icon size={17}/></div>
                  <p>{a.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Charts section ── */}
        {(activeTab === 'overview' || activeTab === 'analytics') && (
          <div className="charts-grid">
            {/* Income vs Expenses area chart */}
            <div className="chart-card wide-chart">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Income vs Expenses</h3>
                  <p className="card-subtitle">Last 6 months</p>
                </div>
                <div className="period-tabs">
                  {(['week','month','year'] as const).map(p => (
                    <button key={p} onClick={() => setSelectedPeriod(p)}
                      className={`period-tab ${selectedPeriod === p ? 'active':''}`}>
                      {p.charAt(0).toUpperCase()+p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={spendingTrendData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#34d399" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fill:'#4a5270', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#4a5270', fontSize:11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<AreaTooltip/>}/>
                  <Area type="monotone" dataKey="income"   name="Income"
                    stroke="#34d399" strokeWidth={2} fill="url(#incGrad)"/>
                  <Area type="monotone" dataKey="expenses" name="Expenses"
                    stroke="#818cf8" strokeWidth={2} fill="url(#expGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <div className="legend-item"><span style={{background:'#34d399'}}/>Income</div>
                <div className="legend-item"><span style={{background:'#818cf8'}}/>Expenses</div>
              </div>
            </div>

            {/* Weekly spending bar chart */}
            <div className="chart-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Weekly Spending</h3>
                  <p className="card-subtitle">This week · $1,990 total</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklySpendData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                  <XAxis dataKey="day" tick={{ fill:'#4a5270', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#4a5270', fontSize:11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`}/>
                  <Tooltip content={<BarTooltip/>}/>
                  <Bar dataKey="amount" radius={[6,6,0,0]}>
                    {weeklySpendData.map((_, i) => (
                      <Cell key={i}
                        fill={_ === weeklySpendData[4] ? '#818cf8' : 'rgba(129,140,248,0.3)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Insights ── */}
        <section className="insights-section">
          <div className="insights-header">
            <div className="insights-title">
              <Sparkles size={17}/><h3>AI Insights</h3>
              <span className="ai-badge">Powered by AI</span>
            </div>
            <button className="refresh-btn"><RefreshCw size={14}/></button>
          </div>
          <div className="insights-grid">
            {insights.map(ins => (
              <div key={ins.id} className={`insight-card ${ins.type}`}>
                <div className="insight-icon"><ins.icon size={16}/></div>
                <div className="insight-content">
                  <h4>{ins.title}</h4>
                  <p>{ins.description}</p>
                </div>
                <button className="insight-action">
                  <ArrowRight size={13}/>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Main content grid ── */}
        <div className="main-grid">

          {/* Left column */}
          <div className="left-col">

            {/* Transactions */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent Transactions</h3>
                  <p className="card-subtitle">{transactions.length} this month</p>
                </div>
                <div className="card-actions">
                  <button className="icon-btn"><Filter size={14}/></button>
                  <button className="view-all-btn" onClick={() => router.push('/transactions')}>
                    View All <ChevronRight size={13}/>
                  </button>
                </div>
              </div>
              <div className="transaction-list">
                {transactions.map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <div className="transaction-left">
                      <div className={`transaction-icon ${tx.color}`}><tx.icon size={17}/></div>
                      <div className="transaction-details">
                        <h4>{tx.name}</h4>
                        <div className="transaction-meta">
                          <span className="tx-cat-pill">{tx.category}</span>
                          <span>{tx.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`transaction-amount ${tx.amount > 0 ? 'positive':'negative'}`}>
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Investments (show in overview + investments tab) */}
            {(activeTab === 'overview' || activeTab === 'investments') && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Portfolio</h3>
                    <p className="card-subtitle">Total · <strong style={{color:'var(--text-primary)'}}>$43,050</strong></p>
                  </div>
                  <button className="view-all-btn" onClick={() => router.push('/investment')}>
                    Manage <ChevronRight size={13}/>
                  </button>
                </div>
                <div className="investment-list">
                  {investments.map((inv, i) => (
                    <div key={i} className="investment-item">
                      <div className="inv-icon" style={{ '--inv-color': inv.color } as any}>
                        <inv.icon size={15}/>
                      </div>
                      <div className="inv-details">
                        <h4>{inv.name}</h4>
                        <span className="inv-ticker">{inv.ticker}</span>
                      </div>
                      <div className="inv-mini-line">
                        {[60,65,58,72,68,75,70,82].map((h,j) => (
                          <span key={j} className="inv-line-seg"
                            style={{ height:`${h}%`, background:inv.change>=0?'var(--emerald)':'var(--red)', opacity:0.4+(j*0.07) }}/>
                        ))}
                      </div>
                      <div className="inv-value">
                        <p className="inv-amount">${inv.value.toLocaleString()}</p>
                        <span className={`inv-change ${inv.change >= 0 ? 'pos':'neg'}`}>
                          {inv.change >= 0 ? '+' : ''}{inv.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crypto (investments tab) */}
            {activeTab === 'investments' && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Crypto Holdings</h3>
                    <p className="card-subtitle">Total · $32,845</p>
                  </div>
                  <span className="live-badge"><span className="live-dot"/>Live</span>
                </div>
                <div className="crypto-list">
                  {cryptos.map((c, i) => (
                    <div key={i} className="crypto-item">
                      <div className="crypto-icon" style={{ background: c.color + '22', color: c.color }}>
                        <Bitcoin size={15}/>
                      </div>
                      <div className="crypto-info">
                        <h4>{c.name}</h4>
                        <span>{c.amount} {c.symbol}</span>
                      </div>
                      <div className="crypto-value">
                        <p>${c.value.toLocaleString()}</p>
                        <span className={c.change >= 0 ? 'pos':'neg'}>
                          {c.change >= 0 ? '+':''}{c.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="right-sidebar">

            {/* Budget Tracker */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Budget Tracker</h3>
                <button className="icon-btn"><Settings size={14}/></button>
              </div>
              <div className="budget-list">
                {budgets.map((b, i) => {
                  const pct = (b.spent / b.limit) * 100;
                  const near = pct >= 90;
                  return (
                    <div key={i} className="budget-item">
                      <div className="budget-row">
                        <div className="budget-left">
                          <div className={`budget-icon ${b.color}`}><b.icon size={12}/></div>
                          <span className="budget-name">{b.category}</span>
                        </div>
                        <span className={`budget-amount ${near ? 'warning':''}`}>
                          ${b.spent} <span className="budget-sep">/</span> ${b.limit}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill ${near?'warning':b.color}`}
                          style={{ width:`${Math.min(pct,100)}%` }}/>
                      </div>
                      <div className="budget-footer">
                        <span className={`budget-pct ${near?'warning':''}`}>{pct.toFixed(0)}% used</span>
                        <span className="budget-remaining">${b.limit - b.spent} left</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Categories + optional pie */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Top Categories</h3>
                <button className="icon-btn" onClick={() => setShowChart(!showChart)}
                  title="Toggle chart" aria-label="Toggle pie chart">
                  <PiIcon size={14}/>
                </button>
              </div>

              {showChart && (
                <div className="pie-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="category-list">
                {categories.map((cat, i) => (
                  <div key={i} className="category-item">
                    <div className="category-row">
                      <div className="category-left">
                        <div className={`category-icon ${cat.color}`}><cat.icon size={12}/></div>
                        <span className="category-name">{cat.name}</span>
                      </div>
                      <span className="category-amount">${cat.amount.toLocaleString()}</span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${cat.color}`} style={{ width:`${cat.percent}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="card goals-card" onClick={() => router.push('/Goals')}>
              <div className="card-header">
                <h3 className="card-title">Goals</h3>
                <button className="add-goal-btn" aria-label="Add goal"
                  onClick={e => { e.stopPropagation(); router.push('/Goals'); }}>
                  <Plus size={13} style={{ color:'var(--emerald)' }}/>
                </button>
              </div>
              <div className="goals-list">
                {goals.length === 0
                  ? <p className="empty-goals">No goals yet — add your first!</p>
                  : goals.slice(0,3).map(goal => {
                      const pct = Math.min((goal.current / goal.target) * 100, 100);
                      const color = goalColorMap[goal.category] ?? 'emerald';
                      return (
                        <div key={goal._id} className="goal-item">
                          <div className="goal-row">
                            <p className="goal-name">{goal.name}</p>
                            <span className="goal-pct">{Math.round(pct)}%</span>
                          </div>
                          <div className="progress-track">
                            <div className={`progress-fill ${color}`} style={{ width:`${pct}%` }}/>
                          </div>
                          <p className="goal-stats">${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}</p>
                        </div>
                      );
                    })
                }
              </div>
              <div className="view-all-goals" onClick={e => { e.stopPropagation(); router.push('/Goals'); }}>
                View All Goals <ArrowRight size={13}/>
              </div>
            </div>

            {/* Quick credit/account cards */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">My Cards</h3>
                <button className="icon-btn" onClick={() => router.push('/add-card')}>
                  <Plus size={14}/>
                </button>
              </div>
              <div className="cards-list">
                <div className="mini-card blue-card">
                  <div className="mini-card-top">
                    <WalletCards size={16}/>
                    <span>Visa</span>
                  </div>
                  <p className="mini-card-num">•••• •••• •••• 4821</p>
                  <div className="mini-card-bottom">
                    <span>Balance</span>
                    <strong>$3,240.00</strong>
                  </div>
                </div>
                <div className="mini-card purple-card">
                  <div className="mini-card-top">
                    <WalletCards size={16}/>
                    <span>Mastercard</span>
                  </div>
                  <p className="mini-card-num">•••• •••• •••• 9304</p>
                  <div className="mini-card-bottom">
                    <span>Balance</span>
                    <strong>$1,870.50</strong>
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

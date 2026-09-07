"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Send,
  CreditCard, Zap, ShoppingBag, Coffee, Car, Smartphone, Plus,
  ChevronRight, LineChart, PiIcon, AlertCircle, CheckCircle, RefreshCw,
  Filter, Sparkles, Globe, Bitcoin, BarChart2, Layers, ChevronUp,
  ChevronDown, ArrowRight, Percent, Flame, Eye, EyeOff,
  PieChart as PieChartIcon, CircleDollarSign, Coins, WalletCards
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
  LineChart as ReLineChart, Line
} from 'recharts';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import './dashboard.css';

// ─────────────────────────────────────────────────────────────
// API shapes — everything on this screen is fetched, not invented.
//   /api/user/balance          → available balance
//   /api/transactions/summary  → income / expenses / trend / weekly / categories
//   /api/transactions/history  → recent activity
//   /api/portfolio             → live holdings, P/L, allocation
//   /api/cards                 → saved cards
//   /api/goals                 → the user's savings goals
// ─────────────────────────────────────────────────────────────
type AccentColor = 'amber' | 'emerald' | 'blue' | 'purple' | 'red' | 'indigo';

interface ApiTx {
  id: string; recipient: string; amount: number; currency: string;
  date: string; status: string; type: 'sent' | 'received';
  note?: string; paymentMethod: string; category: string;
}
interface Summary {
  month: { income: number; expenses: number; net: number; savingsRate: number };
  trend: { month: string; income: number; expenses: number }[];
  weekly: { day: string; amount: number }[];
  categories: { category: string; amount: number; percent: number; previous: number }[];
}
interface Position {
  symbol: string; name: string; assetType: string; shares: number; avgCost: number;
  price: number; marketValue: number; costBasis: number;
  unrealizedPL: number; unrealizedPLPercent: number; dayChangePercent: number;
}
interface Portfolio {
  positions: Position[];
  totals: { marketValue: number; costBasis: number; totalPL: number; totalPLPercent: number; dayPL: number };
  allocation: { symbol: string; percent: number }[];
}
interface ApiCard {
  id: string; cardName: string; brand: string; last4: string;
  cardType: string; frozen: boolean; isDefault: boolean;
}
interface Goal {
  _id: string; name: string; current: number; target: number; category: string;
}
interface Transaction {
  id: string; name: string; category: string; amount: number;
  date: string; icon: React.ElementType; color: AccentColor;
}
interface Category {
  name: string; amount: number; percent: number; previous: number;
  color: AccentColor; icon: React.ElementType;
}
interface Insight {
  id: number; type: 'warning' | 'success' | 'info';
  title: string; description: string; icon: React.ElementType;
}
interface QuickAction {
  name: string; icon: React.ElementType; color: 'blue' | 'purple' | 'amber' | 'emerald'; href: string;
}

// Transaction categories are a fixed enum in the Transaction model — this maps
// each one to the icon/colour the UI already styled.
const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: AccentColor }> = {
  food:          { label: 'Food & Dining',  icon: Coffee,      color: 'amber'   },
  shopping:      { label: 'Shopping',       icon: ShoppingBag, color: 'blue'    },
  transport:     { label: 'Transport',      icon: Car,         color: 'purple'  },
  bills:         { label: 'Bills',          icon: Zap,         color: 'red'     },
  entertainment: { label: 'Entertainment',  icon: Smartphone,  color: 'indigo'  },
  income:        { label: 'Income',         icon: TrendingUp,  color: 'emerald' },
  investment:    { label: 'Investment',     icon: LineChart,   color: 'purple'  },
  transfer:      { label: 'Transfer',       icon: Send,        color: 'blue'    },
  other:         { label: 'Other',          icon: Layers,      color: 'indigo'  },
};
const catMeta = (c?: string) => CATEGORY_META[c ?? 'other'] ?? CATEGORY_META.other;

const ASSET_ICON: Record<string, React.ElementType> = {
  crypto: Bitcoin, etf: BarChart2, stock: Globe,
};
const ASSET_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#818cf8'];
const PIE_COLORS = ['#60a5fa', '#a78bfa', '#fbbf24', '#818cf8', '#34d399', '#fb7185'];

const money = (n: number, decimals = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const relativeDate = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  if (s < 2592000) return `${Math.floor(s / 604800)}w ago`;
  return new Date(iso).toLocaleDateString();
};

/** Percent change guarded against a zero/absent baseline. */
const pctChange = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;

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
  const [selectedPeriod, setSelectedPeriod]   = useState<'week'|'month'|'year'>('month');
  const [showChart,      setShowChart]         = useState(false);
  const [activeTab,      setActiveTab]         = useState<'overview'|'analytics'|'investments'>('overview');
  const [goals,          setGoals]             = useState<Goal[]>([]);
  const [isClient,       setIsClient]          = useState(false);

  // ── Live account data
  const [balance,   setBalance]   = useState(0);
  const [summary,   setSummary]   = useState<Summary | null>(null);
  const [apiTxs,    setApiTxs]    = useState<ApiTx[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [cards,     setCards]     = useState<ApiCard[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const router  = useRouter();
  const { data: session, status } = useSession();

  // ── Load everything the dashboard renders, in parallel.
  const loadData = useCallback(async () => {
    setLoadError(null);
    const json = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} → ${res.status}`);
      return res.json();
    };

    const [bal, sum, hist, pf, cds, gls] = await Promise.allSettled([
      json('/api/user/balance'),
      json('/api/transactions/summary'),
      json('/api/transactions/history?limit=8'),
      json('/api/portfolio'),
      json('/api/cards'),
      json('/api/goals'),
    ]);

    if (bal.status  === 'fulfilled') setBalance(Number(bal.value?.balance ?? 0));
    if (sum.status  === 'fulfilled' && sum.value?.success) setSummary(sum.value.data);
    if (hist.status === 'fulfilled') setApiTxs(hist.value?.transactions ?? []);
    if (pf.status   === 'fulfilled' && pf.value?.success) setPortfolio(pf.value.data);
    if (cds.status  === 'fulfilled' && cds.value?.success) setCards(cds.value.data ?? []);
    if (gls.status  === 'fulfilled' && Array.isArray(gls.value)) {
      setGoals(gls.value.map((g: any) => ({ ...g, current: g.current ?? 0, target: g.target ?? 0 })));
    }

    // Surface a problem rather than silently showing zeroes everywhere.
    if ([bal, sum, hist, pf].every(r => r.status === 'rejected')) {
      setLoadError("We couldn't reach your account data. Check your connection and try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadData();
  }, [status, loadData]);

  useEffect(() => {
    setIsClient(true);
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (!isClient || status === 'loading') return (
    <div className="loading-screen">
      <div className="loading-logo"><Wallet size={28} /></div>
      <p>Loading your finances…</p>
    </div>
  );
  if (!session) return null;

  // ─────────── Derived from live data ───────────
  const monthlyIncome   = summary?.month.income   ?? 0;
  const monthlyExpenses = summary?.month.expenses ?? 0;
  const monthlyNet      = summary?.month.net      ?? 0;
  const savingsRate     = summary?.month.savingsRate ?? 0;

  const trendData  = summary?.trend  ?? [];
  const weeklyData = summary?.weekly ?? [];
  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.amount, 0);
  const peakDay = weeklyData.reduce<{ day: string; amount: number } | null>(
    (best, d) => (!best || d.amount > best.amount ? d : best), null);

  // Month-over-month deltas straight out of the 6-month trend.
  const prevMonth = trendData.length >= 2 ? trendData[trendData.length - 2] : null;
  const incomeChange   = pctChange(monthlyIncome,   prevMonth?.income   ?? 0);
  const expensesChange = pctChange(monthlyExpenses, prevMonth?.expenses ?? 0);
  const prevNet        = (prevMonth?.income ?? 0) - (prevMonth?.expenses ?? 0);
  const savedChange    = pctChange(monthlyNet, prevNet);

  const goalColorMap: Record<string, string> = {
    emergency:'emerald', travel:'blue', transportation:'purple',
    housing:'indigo',    education:'amber', health:'red',
    business:'purple',   tech:'blue',
  };

  const transactions: Transaction[] = apiTxs.map(tx => {
    const meta = catMeta(tx.category);
    return {
      id: tx.id,
      name: tx.recipient || (tx.type === 'received' ? 'Incoming transfer' : 'Payment'),
      category: meta.label,
      amount: tx.type === 'sent' ? -tx.amount : tx.amount,
      date: relativeDate(tx.date),
      icon: tx.type === 'received' ? TrendingUp : meta.icon,
      color: tx.type === 'received' ? 'emerald' : meta.color,
    };
  });

  const categories: Category[] = (summary?.categories ?? []).slice(0, 5).map(c => {
    const meta = catMeta(c.category);
    return { name: meta.label, amount: c.amount, percent: c.percent, previous: c.previous, color: meta.color, icon: meta.icon };
  });

  const pieData = categories.map(c => ({ name: c.name, value: c.amount }));

  // "Budget" here is last month's spend in the same category — a real baseline
  // instead of a made-up limit. Categories with no history last month are skipped.
  const comparisons = categories.filter(c => c.previous > 0).slice(0, 4);

  const positions = portfolio?.positions ?? [];
  const portfolioValue = portfolio?.totals.marketValue ?? 0;
  const portfolioPLPct = portfolio?.totals.totalPLPercent ?? 0;

  const investments = positions
    .filter(pos => pos.assetType !== 'crypto')
    .slice(0, 5)
    .map((pos, i) => ({
      name: pos.name || pos.symbol,
      ticker: pos.symbol,
      value: pos.marketValue,
      change: pos.unrealizedPLPercent,
      changeAmt: pos.unrealizedPL,
      color: ASSET_COLORS[i % ASSET_COLORS.length],
      icon: ASSET_ICON[pos.assetType] ?? Globe,
    }));

  const cryptos = positions
    .filter(pos => pos.assetType === 'crypto')
    .map((pos, i) => ({
      name: pos.name || pos.symbol,
      symbol: pos.symbol,
      amount: pos.shares,
      value: pos.marketValue,
      change: pos.unrealizedPLPercent,
      color: ASSET_COLORS[(i + 2) % ASSET_COLORS.length],
    }));
  const cryptoValue = cryptos.reduce((sum, c) => sum + c.value, 0);

  const netWorth = balance + portfolioValue;

  const quickActions: QuickAction[] = [
    { name:'Send',        icon:Send,       color:'blue',    href:'/send-money' },
    { name:'Invest',      icon:LineChart,  color:'emerald', href:'/investment' },
    { name:'Pay Bills',   icon:Zap,        color:'amber',   href:'/pay-bills'  },
    { name:'Add Card',    icon:CreditCard, color:'purple',  href:'/add-card'   },
  ];

  // Insights are computed from this month's real numbers.
  const insights: Insight[] = [];
  if (summary) {
    if (monthlyIncome > 0) {
      insights.push(savingsRate >= 20
        ? { id:1, type:'success', title:'Strong savings rate',
            description:`You kept ${savingsRate.toFixed(1)}% of what came in this month — $${money(monthlyNet)} saved.`,
            icon:CheckCircle }
        : { id:1, type:'warning', title:'Savings rate is low',
            description:`Only ${savingsRate.toFixed(1)}% of this month's income is left over. Trimming your top category would help most.`,
            icon:AlertCircle });
    }
    const top = categories[0];
    if (top) {
      const delta = pctChange(top.amount, top.previous);
      insights.push({
        id:2,
        type: delta > 25 ? 'warning' : 'info',
        title: `${top.name} is your biggest spend`,
        description: top.previous > 0
          ? `$${money(top.amount)} this month, ${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta).toFixed(0)}% on last month.`
          : `$${money(top.amount)} this month — ${top.percent.toFixed(0)}% of everything you spent.`,
        icon: delta > 25 ? AlertCircle : PieChartIcon,
      });
    }
    if (portfolio && positions.length > 0) {
      insights.push({
        id:3,
        type: portfolioPLPct >= 0 ? 'success' : 'info',
        title: portfolioPLPct >= 0 ? 'Portfolio is up' : 'Portfolio is down',
        description: `${positions.length} holding${positions.length === 1 ? '' : 's'} worth $${money(portfolioValue)}, ${portfolioPLPct >= 0 ? '+' : ''}${portfolioPLPct.toFixed(1)}% against cost.`,
        icon: portfolioPLPct >= 0 ? TrendingUp : TrendingDown,
      });
    }
  }
  if (insights.length === 0) {
    insights.push({ id:0, type:'info', title:'No activity yet',
      description:'Send or receive money and your insights will build from your real transactions.',
      icon:Sparkles });
  }

  const summaryStats = [
    { label:'Net Worth',     value:netWorth,        change:portfolioPLPct,  icon:CircleDollarSign, color:'#6d7eff' },
    { label:'Savings Rate',  value:savingsRate,     change:savedChange,     icon:Percent,          color:'#34d399', prefix:'', suffix:'%' },
    { label:'Investments',   value:portfolioValue,  change:portfolioPLPct,  icon:TrendingUp,       color:'#a78bfa' },
    { label:'Monthly Saved', value:monthlyNet,      change:savedChange,     icon:Coins,            color:'#fbbf24' },
  ];

  // Mini sparkline on the balance card, scaled to this week's real spend.
  const weeklyPeak = Math.max(...weeklyData.map(d => d.amount), 1);
  const miniBars = weeklyData.length
    ? weeklyData.map(d => Math.max(8, Math.round((d.amount / weeklyPeak) * 100)))
    : [];

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* The global header/nav now lives in <AppNav /> (app/components/AppNav.tsx),
          mounted once in the root layout — this page no longer ships its own. */}


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

        {loadError && (
          <div className="data-banner" role="alert">
            <AlertCircle size={15}/>
            <span>{loadError}</span>
            <button type="button" onClick={() => { setLoading(true); loadData(); }}>
              <RefreshCw size={13}/> Retry
            </button>
          </div>
        )}

        {/* Section switcher — was in the page's old header, now part of the page
            body so the shared nav stays the only global chrome. */}
        <div className="section-tabs" role="tablist" aria-label="Dashboard sections">
          {(['overview','analytics','investments'] as const).map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`section-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
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
                  <span className={`balance-change-pill ${monthlyNet < 0 ? 'neg' : ''}`}>
                    {monthlyNet >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                    {monthlyNet >= 0 ? '+' : '−'}${money(Math.abs(monthlyNet), 2)} this month
                  </span>
                  <span className="balance-date">{loading ? 'Refreshing…' : 'Updated just now'}</span>
                </div>
              </div>
              <div className="balance-right-col">
                {positions.length > 0 && (
                  <div className={`balance-badge ${portfolioPLPct < 0 ? 'neg' : ''}`}>
                    {portfolioPLPct >= 0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                    {portfolioPLPct >= 0 ? '+' : ''}{portfolioPLPct.toFixed(1)}% portfolio
                  </div>
                )}
                {miniBars.length > 0 && (
                  <div className="balance-mini-chart" aria-hidden>
                    {miniBars.map((h,i) => (
                      <div key={i} className="mini-bar" style={{ height:`${h}%`, animationDelay:`${i*0.05}s` }}/>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="balance-stats">
              <div className="stat-box">
                <div className="stat-label"><ArrowDownRight size={13}/> Income</div>
                <div className="stat-value"><AnimatedNumber value={monthlyIncome} prefix="$"/></div>
                <div className={`stat-change ${incomeChange >= 0 ? 'positive' : 'negative'}`}>
                  {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomeChange).toFixed(1)}% from last month
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label"><ArrowUpRight size={13}/> Expenses</div>
                <div className="stat-value"><AnimatedNumber value={monthlyExpenses} prefix="$"/></div>
                <div className={`stat-change ${expensesChange <= 0 ? 'positive' : 'negative'}`}>
                  {expensesChange <= 0 ? '↓' : '↑'} {Math.abs(expensesChange).toFixed(1)}% from last month
                </div>
              </div>
              <div className="stat-box highlight-box">
                <div className="stat-label"><Flame size={13}/> Saved</div>
                <div className="stat-value saved-value"><AnimatedNumber value={monthlyNet} prefix="$"/></div>
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
                  <p className="card-subtitle">Last 6 months of real activity</p>
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
                <AreaChart data={trendData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
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
                  <p className="card-subtitle">Last 7 days · ${money(weeklyTotal, 2)} total</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                  <XAxis dataKey="day" tick={{ fill:'#4a5270', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#4a5270', fontSize:11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`}/>
                  <Tooltip content={<BarTooltip/>}/>
                  <Bar dataKey="amount" radius={[6,6,0,0]}>
                    {weeklyData.map((d, i) => (
                      <Cell key={i} fill={d.day === peakDay?.day ? '#818cf8' : 'rgba(129,140,248,0.3)'}/>
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
                  <p className="card-subtitle">
                    {transactions.length > 0 ? `Your latest ${transactions.length}` : 'Nothing yet'}
                  </p>
                </div>
                <div className="card-actions">
                  <button className="icon-btn"><Filter size={14}/></button>
                  <button className="view-all-btn" onClick={() => router.push('/transactions')}>
                    View All <ChevronRight size={13}/>
                  </button>
                </div>
              </div>
              <div className="transaction-list">
                {!loading && transactions.length === 0 && (
                  <p className="empty-state">
                    No transactions yet. <button type="button" className="link-btn" onClick={() => router.push('/send-money')}>Send your first payment</button>.
                  </p>
                )}
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
                    <p className="card-subtitle">Total · <strong style={{color:'var(--text-primary)'}}>${money(portfolioValue, 2)}</strong></p>
                  </div>
                  <button className="view-all-btn" onClick={() => router.push('/investment')}>
                    Manage <ChevronRight size={13}/>
                  </button>
                </div>
                <div className="investment-list">
                  {!loading && investments.length === 0 && (
                    <p className="empty-state">
                      No holdings yet. <button type="button" className="link-btn" onClick={() => router.push('/buy-stocks')}>Buy your first asset</button>.
                    </p>
                  )}
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
                        <p className="inv-amount">${money(inv.value, 2)}</p>
                        <span className={`inv-change ${inv.change >= 0 ? 'pos':'neg'}`}>
                          {inv.change >= 0 ? '+' : ''}{inv.change.toFixed(1)}%
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
                    <p className="card-subtitle">Total · ${money(cryptoValue, 2)}</p>
                  </div>
                  <span className="live-badge"><span className="live-dot"/>Live</span>
                </div>
                <div className="crypto-list">
                  {!loading && cryptos.length === 0 && (
                    <p className="empty-state">No crypto holdings yet.</p>
                  )}
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
                        <p>${money(c.value, 2)}</p>
                        <span className={c.change >= 0 ? 'pos':'neg'}>
                          {c.change >= 0 ? '+':''}{c.change.toFixed(1)}%
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

            {/* Spending vs. last month — real baselines from /api/transactions/summary,
                which is why this replaced the old hardcoded "budget limits" card. */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Spending vs. Last Month</h3>
                  <p className="card-subtitle">Same categories, same point in the month</p>
                </div>
              </div>
              <div className="budget-list">
                {!loading && comparisons.length === 0 && (
                  <p className="empty-state">Not enough history yet — this fills in after a second month of activity.</p>
                )}
                {comparisons.map((c, i) => {
                  const pct = c.previous > 0 ? (c.amount / c.previous) * 100 : 0;
                  const over = pct > 100;
                  const diff = c.amount - c.previous;
                  return (
                    <div key={i} className="budget-item">
                      <div className="budget-row">
                        <div className="budget-left">
                          <div className={`budget-icon ${c.color}`}><c.icon size={12}/></div>
                          <span className="budget-name">{c.name}</span>
                        </div>
                        <span className={`budget-amount ${over ? 'warning':''}`}>
                          ${money(c.amount)} <span className="budget-sep">vs</span> ${money(c.previous)}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill ${over ? 'warning' : c.color}`}
                          style={{ width:`${Math.min(pct,100)}%` }}/>
                      </div>
                      <div className="budget-footer">
                        <span className={`budget-pct ${over ? 'warning':''}`}>{pct.toFixed(0)}% of last month</span>
                        <span className="budget-remaining">
                          {diff >= 0 ? '+' : '−'}${money(Math.abs(diff))}
                        </span>
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
                {!loading && categories.length === 0 && (
                  <p className="empty-state">No spending recorded this month.</p>
                )}
                {categories.map((cat, i) => (
                  <div key={i} className="category-item">
                    <div className="category-row">
                      <div className="category-left">
                        <div className={`category-icon ${cat.color}`}><cat.icon size={12}/></div>
                        <span className="category-name">{cat.name}</span>
                      </div>
                      <span className="category-amount">${money(cat.amount, 2)}</span>
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
                {!loading && cards.length === 0 && (
                  <p className="empty-state">
                    No cards saved. <button type="button" className="link-btn" onClick={() => router.push('/add-card')}>Add one</button>.
                  </p>
                )}
                {cards.slice(0, 3).map((c, i) => (
                  <div key={c.id} className={`mini-card ${i % 2 === 0 ? 'blue-card' : 'purple-card'} ${c.frozen ? 'is-frozen' : ''}`}>
                    <div className="mini-card-top">
                      <WalletCards size={16}/>
                      <span>{c.brand ? c.brand.charAt(0).toUpperCase() + c.brand.slice(1) : 'Card'}</span>
                      {c.isDefault && <span className="mini-card-tag">Default</span>}
                    </div>
                    <p className="mini-card-num">•••• •••• •••• {c.last4}</p>
                    <div className="mini-card-bottom">
                      <span>{c.cardName}</span>
                      <strong>{c.frozen ? 'Frozen' : c.cardType}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

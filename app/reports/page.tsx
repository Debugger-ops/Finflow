"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Download, Share2, Calendar, TrendingUp, TrendingDown,
  DollarSign, ShoppingBag, Coffee, Car, Home, Smartphone, Zap,
  ChevronDown, BarChart2, PieChart as PieIcon, Activity,
  ArrowUpRight, ArrowDownRight, Wallet, Star, Target, Flame,
  CheckCircle, AlertCircle, RefreshCw, Filter, FileText,
  Layers, Globe, Briefcase, CreditCard, Percent, CircleDollarSign,
  Clock, ChevronRight, Award, Sparkles
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart,
  Pie, Legend, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { useRouter } from "next/navigation";
import "./reports.css";

// ─────────────────────────────────────
// Data
// ─────────────────────────────────────
const monthlyData = [
  { month: "Jul", income: 7800, expenses: 5200, savings: 2600, net: 2600 },
  { month: "Aug", income: 8200, expenses: 5100, savings: 3100, net: 3100 },
  { month: "Sep", income: 8500, expenses: 4800, savings: 3700, net: 3700 },
  { month: "Oct", income: 8100, expenses: 5400, savings: 2700, net: 2700 },
  { month: "Nov", income: 9000, expenses: 4600, savings: 4400, net: 4400 },
  { month: "Dec", income: 8700, expenses: 5200, savings: 3500, net: 3500 },
  { month: "Jan", income: 8500, expenses: 4670, savings: 3830, net: 3830 },
];

const categoryData = [
  { name: "Housing",    amount: 1500, budget: 1500, pct: 100, color: "#818cf8", icon: Home       },
  { name: "Food",       amount: 890,  budget: 1000, pct: 89,  color: "#fbbf24", icon: Coffee     },
  { name: "Shopping",   amount: 650,  budget: 600,  pct: 108, color: "#60a5fa", icon: ShoppingBag},
  { name: "Transport",  amount: 420,  budget: 500,  pct: 84,  color: "#a78bfa", icon: Car        },
  { name: "Utilities",  amount: 280,  budget: 300,  pct: 93,  color: "#34d399", icon: Zap        },
  { name: "Entertainment",amount:280, budget: 300,  pct: 93,  color: "#f87171", icon: Smartphone },
  { name: "Other",      amount: 650,  budget: 700,  pct: 93,  color: "#fb923c", icon: Layers     },
];

const pieData = categoryData.map(c => ({ name: c.name, value: c.amount, color: c.color }));

const weeklyData = [
  { week: "W1", amount: 980  },
  { week: "W2", amount: 1240 },
  { week: "W3", amount: 860  },
  { week: "W4", amount: 1590 },
];

const radarData = [
  { subject: "Food",     A: 89,  fullMark: 100 },
  { subject: "Shopping", A: 108, fullMark: 100 },
  { subject: "Transport",A: 84,  fullMark: 100 },
  { subject: "Utilities",A: 93,  fullMark: 100 },
  { subject: "Housing",  A: 100, fullMark: 100 },
  { subject: "Fun",      A: 93,  fullMark: 100 },
];

const topMerchants = [
  { name: "Rent / Housing",   amount: 1500, count: 1, icon: Home,        color: "#818cf8" },
  { name: "Amazon",           amount: 342,  count: 8, icon: ShoppingBag, color: "#60a5fa" },
  { name: "Grocery Store",    amount: 286,  count: 6, icon: ShoppingBag, color: "#fbbf24" },
  { name: "Uber",             amount: 198,  count: 9, icon: Car,         color: "#a78bfa" },
  { name: "Netflix",          amount: 16,   count: 1, icon: Smartphone,  color: "#f87171" },
];

const savingsHistory = [
  { month: "Jul", rate: 33 }, { month: "Aug", rate: 38 },
  { month: "Sep", rate: 44 }, { month: "Oct", rate: 33 },
  { month: "Nov", rate: 49 }, { month: "Dec", rate: 40 },
  { month: "Jan", rate: 45 },
];

const cashflowDays = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  flow: Math.round((Math.random() - 0.42) * 600),
}));

// ─────────────────────────────────────
// Custom tooltips
// ─────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-tooltip">
      <p className="rpt-tooltip-label">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: "0.78rem", fontWeight: 600 }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const SimpleTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-tooltip">
      <p className="rpt-tooltip-label">{label}</p>
      <p style={{ color: "#818cf8", fontSize: "0.78rem", fontWeight: 600 }}>
        ${payload[0]?.value?.toLocaleString()}
      </p>
    </div>
  );
};

const RateTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-tooltip">
      <p className="rpt-tooltip-label">{label}</p>
      <p style={{ color: "#34d399", fontSize: "0.78rem", fontWeight: 600 }}>
        {payload[0]?.value}% saved
      </p>
    </div>
  );
};

// ─────────────────────────────────────
// Animated counter
// ─────────────────────────────────────
const AnimNum: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number }> = ({
  value, prefix = "", suffix = "", decimals = 0,
}) => {
  const [n, setN] = useState(0);
  const r = useRef<number>(0);
  useEffect(() => {
    const start = Date.now(), dur = 1100;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setN(value * e);
      if (p < 1) r.current = requestAnimationFrame(tick);
    };
    r.current = requestAnimationFrame(tick);
    return () => { if (r.current) cancelAnimationFrame(r.current); };
  }, [value]);
  return (
    <span>{prefix}{n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
  );
};

// ─────────────────────────────────────
// Main Page
// ─────────────────────────────────────
const ReportsPage: React.FC = () => {
  const router = useRouter();
  const [period, setPeriod] = useState<"3m" | "6m" | "1y">("6m");
  const [activeSection, setActiveSection] = useState<"overview" | "spending" | "cashflow" | "trends">("overview");
  const [exportOpen, setExportOpen] = useState(false);

  const totalIncome   = 59800;
  const totalExpenses = 35370;
  const totalSavings  = totalIncome - totalExpenses;
  const avgSavingsRate = 40.7;
  const netWorthGrowth = 12.5;

  const kpiCards = [
    { label: "Total Income",    value: totalIncome,   change: +5.2,  prefix: "$", color: "#34d399", icon: TrendingUp   },
    { label: "Total Expenses",  value: totalExpenses, change: -2.1,  prefix: "$", color: "#f87171", icon: TrendingDown },
    { label: "Net Savings",     value: totalSavings,  change: +14.3, prefix: "$", color: "#818cf8", icon: Wallet       },
    { label: "Savings Rate",    value: avgSavingsRate,change: +2.4,  prefix: "",  suffix: "%", color: "#fbbf24", icon: Percent },
  ];

  const insights = [
    { type: "success", icon: CheckCircle, title: "Best savings month", desc: "November had your highest savings rate at 49% — great discipline!" },
    { type: "warning", icon: AlertCircle, title: "Shopping over budget", desc: "Shopping exceeded budget by 8% ($50 over). Consider reviewing subscriptions." },
    { type: "info",    icon: Sparkles,    title: "Savings milestone", desc: "You're on track to hit $25,000 in savings by March 2025." },
  ];

  return (
    <div className="rpt-shell">

      {/* ── HEADER ── */}
      <header className="rpt-header">
        <div className="rpt-header-inner">
          <div className="rpt-header-left">
            <button className="rpt-back-btn" onClick={() => router.push("/")}>
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div className="rpt-header-divider" />
            <div className="rpt-title-group">
              <div className="rpt-logo"><FileText size={16} /></div>
              <div>
                <h1 className="rpt-heading">Financial Report</h1>
                <p className="rpt-subheading">January 2025 · Updated just now</p>
              </div>
            </div>
          </div>

          <div className="rpt-header-right">
            {/* Period selector */}
            <div className="rpt-period-tabs">
              {(["3m", "6m", "1y"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`rpt-period-tab ${period === p ? "active" : ""}`}>
                  {p === "3m" ? "3 Months" : p === "6m" ? "6 Months" : "1 Year"}
                </button>
              ))}
            </div>

            {/* Export */}
            <div className="rpt-export-wrap" style={{ position: "relative" }}>
              <button className="rpt-export-btn" onClick={() => setExportOpen(!exportOpen)}>
                <Download size={14} /> Export <ChevronDown size={12} />
              </button>
              {exportOpen && (
                <div className="rpt-export-menu">
                  <button><FileText size={13} /> PDF Report</button>
                  <button><BarChart2 size={13} /> Excel / CSV</button>
                  <button><Share2 size={13} /> Share Link</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section nav */}
        <div className="rpt-section-nav">
          {(["overview", "spending", "cashflow", "trends"] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`rpt-section-tab ${activeSection === s ? "active" : ""}`}>
              {s === "overview"  && <BarChart2 size={14} />}
              {s === "spending"  && <PieIcon size={14} />}
              {s === "cashflow"  && <Activity size={14} />}
              {s === "trends"    && <TrendingUp size={14} />}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="rpt-main">

        {/* ── KPI CARDS ── */}
        <div className="rpt-kpi-row">
          {kpiCards.map((k, i) => (
            <div className="rpt-kpi-card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="rpt-kpi-top">
                <div className="rpt-kpi-icon" style={{ background: k.color + "22", color: k.color }}>
                  <k.icon size={16} />
                </div>
                <span className={`rpt-kpi-badge ${k.change >= 0 ? "pos" : "neg"}`}>
                  {k.change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {Math.abs(k.change)}%
                </span>
              </div>
              <div className="rpt-kpi-value" style={{ color: k.color }}>
                <AnimNum value={k.value} prefix={k.prefix} suffix={k.suffix ?? ""} decimals={k.suffix === "%" ? 1 : 0} />
              </div>
              <p className="rpt-kpi-label">{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── AI INSIGHTS ── */}
        <section className="rpt-insights-row">
          {insights.map((ins, i) => (
            <div key={i} className={`rpt-insight ${ins.type}`}>
              <div className="rpt-insight-icon"><ins.icon size={15} /></div>
              <div>
                <h4>{ins.title}</h4>
                <p>{ins.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── OVERVIEW SECTION ── */}
        {(activeSection === "overview" || activeSection === "trends") && (
          <>
            {/* Main area chart */}
            <div className="rpt-card rpt-card-wide">
              <div className="rpt-card-header">
                <div>
                  <h2 className="rpt-card-title">Income vs Expenses vs Savings</h2>
                  <p className="rpt-card-sub">Monthly breakdown for {period === "3m" ? "3" : period === "6m" ? "6" : "12"} months</p>
                </div>
                <div className="rpt-legend">
                  <span><i style={{ background: "#34d399" }} />Income</span>
                  <span><i style={{ background: "#818cf8" }} />Expenses</span>
                  <span><i style={{ background: "#fbbf24" }} />Savings</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    {[["inc","#34d399"],["exp","#818cf8"],["sav","#fbbf24"]].map(([id, c]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={c} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={c} stopOpacity={0}    />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#404870", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#404870", fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area type="monotone" dataKey="income"   name="Income"   stroke="#34d399" strokeWidth={2} fill="url(#inc)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#818cf8" strokeWidth={2} fill="url(#exp)" />
                  <Area type="monotone" dataKey="savings"  name="Savings"  stroke="#fbbf24" strokeWidth={2} fill="url(#sav)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Savings rate line + weekly bar */}
            <div className="rpt-two-col">
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div>
                    <h2 className="rpt-card-title">Savings Rate Trend</h2>
                    <p className="rpt-card-sub">Monthly % of income saved</p>
                  </div>
                  <span className="rpt-tag emerald">Avg {avgSavingsRate}%</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={savingsHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#404870", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#404870", fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${v}%`} domain={[20, 60]} />
                    <Tooltip content={<RateTooltip />} />
                    <Line type="monotone" dataKey="rate" stroke="#34d399" strokeWidth={2.5}
                      dot={{ r: 4, fill: "#34d399", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#34d399" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div>
                    <h2 className="rpt-card-title">Weekly Breakdown</h2>
                    <p className="rpt-card-sub">Jan 2025 spending by week</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis dataKey="week" tick={{ fill: "#404870", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#404870", fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `$${v}`} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="amount" radius={[7, 7, 0, 0]}>
                      {weeklyData.map((_, i) => (
                        <Cell key={i} fill={i === 3 ? "#818cf8" : "rgba(129,140,248,0.28)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="rpt-week-note">Week 4 was your highest-spend week</p>
              </div>
            </div>
          </>
        )}

        {/* ── SPENDING SECTION ── */}
        {(activeSection === "spending" || activeSection === "overview") && (
          <>
            <div className="rpt-two-col">
              {/* Pie chart */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div>
                    <h2 className="rpt-card-title">Spending by Category</h2>
                    <p className="rpt-card-sub">Total: ${totalExpenses.toLocaleString()}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90} paddingAngle={3} stroke="none">
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, ""]}
                      contentStyle={{ background: "#0f1221", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "#eef0ff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="rpt-pie-legend">
                  {pieData.map((d, i) => (
                    <div key={i} className="rpt-pie-legend-item">
                      <span style={{ background: d.color }} />
                      <p>{d.name}</p>
                      <strong>${d.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget vs actual bars */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div>
                    <h2 className="rpt-card-title">Budget vs Actual</h2>
                    <p className="rpt-card-sub">This month's performance</p>
                  </div>
                  <div className="rpt-legend-sm">
                    <span><i style={{ background: "#818cf8" }} />Spent</span>
                    <span><i style={{ background: "rgba(255,255,255,0.1)" }} />Budget</span>
                  </div>
                </div>
                <div className="rpt-budget-bars">
                  {categoryData.map((c, i) => (
                    <div key={i} className="rpt-budget-row">
                      <div className="rpt-budget-label">
                        <div className="rpt-budget-icon" style={{ background: c.color + "22", color: c.color }}>
                          <c.icon size={11} />
                        </div>
                        <span>{c.name}</span>
                      </div>
                      <div className="rpt-budget-bar-wrap">
                        <div className="rpt-budget-track">
                          <div className="rpt-budget-fill" style={{
                            width: `${Math.min(c.pct, 100)}%`,
                            background: c.pct > 100 ? "#f87171" : c.color,
                          }} />
                        </div>
                        <div className="rpt-budget-nums">
                          <span className={c.pct > 100 ? "over" : ""}>${c.amount}</span>
                          <span className="rpt-budget-limit">/ ${c.budget}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top merchants */}
            <div className="rpt-card">
              <div className="rpt-card-header">
                <div>
                  <h2 className="rpt-card-title">Top Merchants</h2>
                  <p className="rpt-card-sub">Where your money goes</p>
                </div>
                <span className="rpt-tag indigo">This month</span>
              </div>
              <div className="rpt-merchants">
                {topMerchants.map((m, i) => (
                  <div key={i} className="rpt-merchant-row">
                    <div className="rpt-merchant-rank">#{i + 1}</div>
                    <div className="rpt-merchant-icon" style={{ background: m.color + "22", color: m.color }}>
                      <m.icon size={15} />
                    </div>
                    <div className="rpt-merchant-info">
                      <h4>{m.name}</h4>
                      <span>{m.count} transaction{m.count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="rpt-merchant-bar-wrap">
                      <div className="rpt-merchant-track">
                        <div className="rpt-merchant-fill"
                          style={{ width: `${(m.amount / topMerchants[0].amount) * 100}%`, background: m.color }} />
                      </div>
                    </div>
                    <div className="rpt-merchant-amount">
                      <strong>${m.amount.toLocaleString()}</strong>
                      <span>{((m.amount / totalExpenses) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── CASHFLOW SECTION ── */}
        {activeSection === "cashflow" && (
          <>
            <div className="rpt-card rpt-card-wide">
              <div className="rpt-card-header">
                <div>
                  <h2 className="rpt-card-title">Daily Cash Flow — January 2025</h2>
                  <p className="rpt-card-sub">Positive = money in · Negative = money out</p>
                </div>
                <div className="rpt-legend-sm">
                  <span><i style={{ background: "#34d399" }} />Inflow</span>
                  <span><i style={{ background: "#f87171" }} />Outflow</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashflowDays} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={true} vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#404870", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v % 5 === 0 ? `${v}` : ""} />
                  <YAxis tick={{ fill: "#404870", fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const val = payload[0].value as number;
                    return (
                      <div className="rpt-tooltip">
                        <p className="rpt-tooltip-label">Day {label}</p>
                        <p style={{ color: val >= 0 ? "#34d399" : "#f87171", fontWeight: 600, fontSize: "0.78rem" }}>
                          {val >= 0 ? "+" : ""}${val}
                        </p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="flow" radius={[3, 3, 0, 0]}>
                    {cashflowDays.map((d, i) => (
                      <Cell key={i} fill={d.flow >= 0 ? "rgba(52,211,153,0.7)" : "rgba(248,113,113,0.6)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cashflow stats */}
            <div className="rpt-three-col">
              {[
                { label: "Total Inflow",  value: 9700,  color: "#34d399", icon: ArrowDownRight },
                { label: "Total Outflow", value: 5870,  color: "#f87171", icon: ArrowUpRight   },
                { label: "Net Flow",      value: 3830,  color: "#818cf8", icon: Activity       },
              ].map((s, i) => (
                <div key={i} className="rpt-flow-card">
                  <div className="rpt-flow-icon" style={{ background: s.color + "18", color: s.color }}>
                    <s.icon size={18} />
                  </div>
                  <div className="rpt-flow-value" style={{ color: s.color }}>
                    <AnimNum value={s.value} prefix="$" />
                  </div>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TRENDS SECTION ── */}
        {activeSection === "trends" && (
          <>
            {/* Radar */}
            <div className="rpt-two-col">
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div>
                    <h2 className="rpt-card-title">Budget Health Radar</h2>
                    <p className="rpt-card-sub">% of budget used per category</p>
                  </div>
                  <span className="rpt-tag amber">Jan 2025</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#7f8db0", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 120]} tick={{ fill: "#404870", fontSize: 9 }}
                      tickFormatter={v => `${v}%`} />
                    <Radar name="Usage" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip formatter={(v: any) => [`${v}%`, "Budget used"]}
                      contentStyle={{ background: "#0f1221", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Month-over-month */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div>
                    <h2 className="rpt-card-title">Month-over-Month</h2>
                    <p className="rpt-card-sub">Change vs December 2024</p>
                  </div>
                </div>
                <div className="rpt-mom-list">
                  {[
                    { label: "Income",     change: -2.3, arrow: "down" },
                    { label: "Expenses",   change: +10.2,arrow: "up"   },
                    { label: "Savings",    change: +9.4, arrow: "up"   },
                    { label: "Savings %",  change: +4.8, arrow: "up"   },
                    { label: "Shopping",   change: -15.6,arrow: "down" },
                    { label: "Food",       change: +3.1, arrow: "up"   },
                  ].map((m, i) => {
                    const isGood = (m.label === "Income" || m.label === "Savings" || m.label === "Savings %" || m.label === "Shopping")
                      ? m.change >= 0
                      : m.change <= 0;
                    return (
                      <div key={i} className="rpt-mom-row">
                        <span className="rpt-mom-label">{m.label}</span>
                        <div className="rpt-mom-bar-wrap">
                          <div className="rpt-mom-track">
                            <div className="rpt-mom-fill" style={{
                              width: `${Math.min(Math.abs(m.change) * 4, 100)}%`,
                              background: isGood ? "#34d399" : "#f87171",
                              marginLeft: m.change < 0 ? "auto" : undefined,
                            }} />
                          </div>
                        </div>
                        <span className={`rpt-mom-val ${isGood ? "pos" : "neg"}`}>
                          {m.change > 0 ? "+" : ""}{m.change}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Projection */}
            <div className="rpt-card rpt-projection-card">
              <div className="rpt-card-header">
                <div>
                  <h2 className="rpt-card-title">Savings Projection</h2>
                  <p className="rpt-card-sub">If current rate continues</p>
                </div>
                <span className="rpt-tag brand">AI Forecast</span>
              </div>
              <div className="rpt-projection-body">
                <div className="rpt-projection-milestones">
                  {[
                    { label: "By March 2025",   amount: 25_000, icon: Target,  color: "#818cf8" },
                    { label: "By June 2025",    amount: 35_000, icon: Award,   color: "#34d399" },
                    { label: "By Dec 2025",     amount: 60_000, icon: Star,    color: "#fbbf24" },
                  ].map((m, i) => (
                    <div key={i} className="rpt-milestone">
                      <div className="rpt-milestone-icon" style={{ background: m.color + "18", color: m.color }}>
                        <m.icon size={20} />
                      </div>
                      <div>
                        <p className="rpt-milestone-amount" style={{ color: m.color }}>
                          <AnimNum value={m.amount} prefix="$" />
                        </p>
                        <p className="rpt-milestone-label">{m.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rpt-projection-note">
                  <Sparkles size={14} />
                  <p>Based on your {avgSavingsRate}% average savings rate over the past 6 months. Keep going!</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── FOOTER SUMMARY ── */}
        <div className="rpt-footer-summary">
          <div className="rpt-footer-left">
            <Clock size={13} />
            <span>Report generated · January 31, 2025</span>
          </div>
          <div className="rpt-footer-right">
            <button className="rpt-export-btn-sm" onClick={() => window.print()}>
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ReportsPage;
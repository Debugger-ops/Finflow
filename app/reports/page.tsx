"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useSession } from "next-auth/react";
import "./reports.css";

// ─────────────────────────────────────
// Shapes returned by /api/reports — every figure on this page is computed
// from the signed-in user's completed transactions.
// ─────────────────────────────────────
interface ReportSeries { month: string; income: number; expenses: number; savings: number; net: number }
interface ReportCategory { category: string; amount: number; previous: number; pct: number; share: number }
interface ReportMerchant { name: string; amount: number; count: number }
interface ReportData {
  period: string;
  totals: {
    income: number; expenses: number; savings: number; avgSavingsRate: number;
    incomeChange: number; expensesChange: number; savingsChange: number; rateChange: number;
  };
  series: ReportSeries[];
  savingsHistory: { month: string; rate: number }[];
  categories: ReportCategory[];
  topMerchants: ReportMerchant[];
  weekly: { week: string; amount: number }[];
  cashflow: { day: number; flow: number }[];
}

const CATEGORY_STYLE: Record<string, { label: string; color: string; icon: any }> = {
  food:          { label: "Food & Drink",  color: "#fbbf24", icon: Coffee },
  shopping:      { label: "Shopping",      color: "#60a5fa", icon: ShoppingBag },
  transport:     { label: "Transport",     color: "#a78bfa", icon: Car },
  bills:         { label: "Bills",         color: "#34d399", icon: Zap },
  entertainment: { label: "Entertainment", color: "#f87171", icon: Smartphone },
  income:        { label: "Income",        color: "#34d399", icon: TrendingUp },
  investment:    { label: "Investment",    color: "#818cf8", icon: Briefcase },
  transfer:      { label: "Transfer",      color: "#60a5fa", icon: Globe },
  other:         { label: "Other",         color: "#fb923c", icon: Layers },
};
const catStyle = (c?: string) => CATEGORY_STYLE[c ?? "other"] ?? CATEGORY_STYLE.other;

const MERCHANT_COLORS = ["#818cf8", "#60a5fa", "#fbbf24", "#a78bfa", "#f87171"];

const money = (n: number, decimals = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

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
  const { status } = useSession();
  const [period, setPeriod] = useState<"3m" | "6m" | "1y">("6m");
  const [activeSection, setActiveSection] = useState<"overview" | "spending" | "cashflow" | "trends">("overview");
  const [exportOpen, setExportOpen] = useState(false);

  const [report, setReport]   = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      if (!res.ok) throw new Error("report");
      const json = await res.json();
      if (!json?.success) throw new Error("report");
      setReport(json.data);
    } catch {
      setError("We couldn't build your report. Please try again.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { if (status === "authenticated") loadReport(); }, [status, loadReport]);

  // Close the export menu on an outside click.
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".rpt-export-wrap")) setExportOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [exportOpen]);

  // ── Derived view models ──
  const monthlyData    = report?.series ?? [];
  const savingsHistory = report?.savingsHistory ?? [];
  const weeklyData     = report?.weekly ?? [];
  const cashflowDays   = report?.cashflow ?? [];

  const totalIncome    = report?.totals.income ?? 0;
  const totalExpenses  = report?.totals.expenses ?? 0;
  const totalSavings   = report?.totals.savings ?? 0;
  const avgSavingsRate = report?.totals.avgSavingsRate ?? 0;

  const categoryData = (report?.categories ?? []).map(c => {
    const st = catStyle(c.category);
    return { name: st.label, amount: c.amount, budget: c.previous, pct: c.pct, share: c.share, color: st.color, icon: st.icon };
  });
  const pieData = categoryData.map(c => ({ name: c.name, value: c.amount, color: c.color }));

  const topMerchants = (report?.topMerchants ?? []).map((m, i) => ({
    ...m, icon: Briefcase, color: MERCHANT_COLORS[i % MERCHANT_COLORS.length],
  }));

  // Radar compares this month against last month per category (100 = level).
  const radarData = categoryData
    .filter(c => c.budget > 0)
    .slice(0, 6)
    .map(c => ({ subject: c.name, A: Math.min(c.pct, 200), fullMark: 100 }));

  const monthSpend = categoryData.reduce((s, c) => s + c.amount, 0);

  const inflow  = cashflowDays.reduce((s, d) => s + Math.max(d.flow, 0), 0);
  const outflow = cashflowDays.reduce((s, d) => s + Math.min(d.flow, 0), 0);

  const cur  = monthlyData[monthlyData.length - 1];
  const prev = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
  const pctDelta = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : 0);

  const momRows = report && cur && prev ? [
    { label: "Income",    change: pctDelta(cur.income, prev.income),     goodWhenUp: true },
    { label: "Expenses",  change: pctDelta(cur.expenses, prev.expenses), goodWhenUp: false },
    { label: "Savings",   change: pctDelta(cur.savings, prev.savings),   goodWhenUp: true },
    { label: "Savings %", change: report.totals.rateChange,              goodWhenUp: true },
    ...categoryData.filter(c => c.budget > 0).slice(0, 2).map(c => ({
      label: c.name, change: pctDelta(c.amount, c.budget), goodWhenUp: false,
    })),
  ] : [];

  const peakWeek = weeklyData.reduce<{ week: string; amount: number } | null>(
    (best, w) => (!best || w.amount > best.amount ? w : best), null);

  const bestMonth = savingsHistory.reduce<{ month: string; rate: number } | null>(
    (best, m) => (!best || m.rate > best.rate ? m : best), null);
  const topCategory = categoryData[0];

  const kpiCards = [
    { label: "Total Income",   value: totalIncome,    change: report?.totals.incomeChange   ?? 0, prefix: "$", color: "#34d399", icon: TrendingUp   },
    { label: "Total Expenses", value: totalExpenses,  change: report?.totals.expensesChange ?? 0, prefix: "$", color: "#f87171", icon: TrendingDown },
    { label: "Net Savings",    value: totalSavings,   change: report?.totals.savingsChange  ?? 0, prefix: "$", color: "#818cf8", icon: Wallet       },
    { label: "Avg Savings Rate", value: avgSavingsRate, change: report?.totals.rateChange   ?? 0, prefix: "",  suffix: "%", color: "#fbbf24", icon: Percent },
  ];

  // Insights read off the same numbers the charts use.
  const insights: { type: string; icon: any; title: string; desc: string }[] = [];
  if (report) {
    if (bestMonth && bestMonth.rate > 0) {
      insights.push({ type: "success", icon: CheckCircle, title: "Best savings month",
        desc: `${bestMonth.month} was your strongest, saving ${bestMonth.rate.toFixed(1)}% of what came in.` });
    }
    if (topCategory) {
      const over = topCategory.budget > 0 && topCategory.pct > 100;
      insights.push({
        type: over ? "warning" : "info",
        icon: over ? AlertCircle : PieIcon,
        title: over ? `${topCategory.name} is up on last month` : `${topCategory.name} leads your spending`,
        desc: topCategory.budget > 0
          ? `$${money(topCategory.amount)} this month vs $${money(topCategory.budget)} last — ${topCategory.pct}% of it.`
          : `$${money(topCategory.amount)} so far, ${topCategory.share.toFixed(0)}% of this month's spend.`,
      });
    }
    if (avgSavingsRate > 0 && totalSavings > 0) {
      const monthsTracked = monthlyData.length || 1;
      const perMonth = totalSavings / monthsTracked;
      insights.push({ type: "info", icon: Sparkles, title: "Savings pace",
        desc: `At $${money(perMonth)} saved per month you'd add about $${money(perMonth * 12)} over a year.` });
    }
  }
  if (insights.length === 0 && !loading) {
    insights.push({ type: "info", icon: Sparkles, title: "Not enough history yet",
      desc: "Once you have a few completed transactions this report fills in automatically." });
  }

  return (
    <div className="rpt-shell">

      {/* ── HEADER ── */}
      <header className="rpt-header">
        <div className="rpt-header-inner">
          <div className="rpt-header-left">
            <button className="rpt-back-btn" onClick={() => router.push("/dashboard")}>
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div className="rpt-header-divider" />
            <div className="rpt-title-group">
              <div className="rpt-logo"><FileText size={16} /></div>
              <div>
                <h1 className="rpt-heading">Financial Report</h1>
                <p className="rpt-subheading">
                  {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} ·{" "}
                  {loading ? "Building report…" : "Updated just now"}
                </p>
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
                  <button onClick={() => { setExportOpen(false); window.print(); }}>
                    <FileText size={13} /> Print / PDF
                  </button>
                  <button onClick={() => { setExportOpen(false); window.location.href = "/api/transactions/history?format=csv&limit=100&range=year"; }}>
                    <BarChart2 size={13} /> Transactions CSV
                  </button>
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

      <main className="rpt-main has-app-nav">

        {error && (
          <div className="rpt-banner" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button type="button" onClick={loadReport}><RefreshCw size={13} /> Retry</button>
          </div>
        )}

        {!loading && !error && monthlyData.every(m => m.income === 0 && m.expenses === 0) && (
          <div className="rpt-banner info" role="status">
            <Sparkles size={16} />
            <span>No completed transactions in this period yet — the charts below will fill in as you use FinFlow.</span>
          </div>
        )}

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
                {peakWeek && peakWeek.amount > 0 && (
                  <p className="rpt-week-note">{peakWeek.week} was your highest-spend week (${money(peakWeek.amount)})</p>
                )}
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
                    <p className="rpt-card-sub">This month: ${money(monthSpend, 2)}</p>
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
                    <h2 className="rpt-card-title">This Month vs Last</h2>
                    <p className="rpt-card-sub">Same categories, real baselines</p>
                  </div>
                  <div className="rpt-legend-sm">
                    <span><i style={{ background: "#818cf8" }} />This month</span>
                    <span><i style={{ background: "rgba(255,255,255,0.1)" }} />Last month</span>
                  </div>
                </div>
                <div className="rpt-budget-bars">
                  {!loading && categoryData.length === 0 && (
                    <p className="rpt-empty">No spending recorded this month.</p>
                  )}
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
                          <span className={c.pct > 100 ? "over" : ""}>${money(c.amount)}</span>
                          <span className="rpt-budget-limit">
                            {c.budget > 0 ? `/ $${money(c.budget)} last month` : "· no history"}
                          </span>
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
                <span className="rpt-tag indigo">{period === "3m" ? "Last 3 months" : period === "6m" ? "Last 6 months" : "Last year"}</span>
              </div>
              <div className="rpt-merchants">
                {!loading && topMerchants.length === 0 && (
                  <p className="rpt-empty">No outgoing payments in this period.</p>
                )}
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
                          style={{ width: `${topMerchants[0].amount ? (m.amount / topMerchants[0].amount) * 100 : 0}%`, background: m.color }} />
                      </div>
                    </div>
                    <div className="rpt-merchant-amount">
                      <strong>${money(m.amount, 2)}</strong>
                      <span>{totalExpenses ? ((m.amount / totalExpenses) * 100).toFixed(1) : "0.0"}%</span>
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
                  <h2 className="rpt-card-title">
                    Daily Cash Flow — {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
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
                { label: "Total Inflow",  value: inflow,                    color: "#34d399", icon: ArrowDownRight },
                { label: "Total Outflow", value: Math.abs(outflow),         color: "#f87171", icon: ArrowUpRight   },
                { label: "Net Flow",      value: inflow + outflow,          color: "#818cf8", icon: Activity       },
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
                    <h2 className="rpt-card-title">Category Movement</h2>
                    <p className="rpt-card-sub">This month as a % of last month (100 = level)</p>
                  </div>
                  <span className="rpt-tag amber">
                    {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#7f8db0", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 200]} tick={{ fill: "#404870", fontSize: 9 }}
                      tickFormatter={v => `${v}%`} />
                    <Radar name="Usage" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip formatter={(v: any) => [`${v}%`, "vs last month"]}
                      contentStyle={{ background: "#0f1221", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Month-over-month */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div>
                    <h2 className="rpt-card-title">Month-over-Month</h2>
                    <p className="rpt-card-sub">
                      {prev ? `Change vs ${prev.month}` : "Change vs the previous month"}
                    </p>
                  </div>
                </div>
                <div className="rpt-mom-list">
                  {!loading && momRows.length === 0 && (
                    <p className="rpt-empty">Needs two months of activity to compare.</p>
                  )}
                  {momRows.map((m, i) => {
                    const isGood = m.goodWhenUp ? m.change >= 0 : m.change <= 0;
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
                  {(() => {
                    const perMonth = monthlyData.length ? totalSavings / monthlyData.length : 0;
                    const at = (months: number) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + months);
                      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                    };
                    return [
                      { label: `By ${at(3)}`,  amount: Math.max(0, perMonth * 3),  icon: Target, color: "#818cf8" },
                      { label: `By ${at(6)}`,  amount: Math.max(0, perMonth * 6),  icon: Award,  color: "#34d399" },
                      { label: `By ${at(12)}`, amount: Math.max(0, perMonth * 12), icon: Star,   color: "#fbbf24" },
                    ];
                  })().map((m, i) => (
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
                  <p>
                    Projected from your ${money(monthlyData.length ? totalSavings / monthlyData.length : 0)} average monthly
                    saving over the last {monthlyData.length || 0} month{monthlyData.length === 1 ? "" : "s"}
                    ({avgSavingsRate}% average savings rate). Not a guarantee — just your current pace.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── FOOTER SUMMARY ── */}
        <div className="rpt-footer-summary">
          <div className="rpt-footer-left">
            <Clock size={13} />
            <span>Report generated · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
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
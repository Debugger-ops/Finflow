"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Send, User, DollarSign, ArrowLeft, Check, AlertCircle,
  Clock, CreditCard, Smartphone, Building2, Calendar,
  TrendingUp, Search, Filter, ChevronRight, Star,
  Shield, Globe, X, Copy, RefreshCw, ChevronDown,
  Zap, Users, SplitSquareVertical, Download, Bell,
  Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Repeat2,
} from "lucide-react";
import "./sendMoney.css";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type PaymentMethodId = "bank" | "card" | "wallet";
type TransactionStatus = "completed" | "pending" | "failed";
type TransactionType = "sent" | "received";
type ActiveTab = "send" | "history" | "split";
type Currency = "USD" | "EUR" | "GBP" | "INR" | "AED";

interface Contact {
  id: number;
  name: string;
  email: string;
  avatar: string;
  avatarColor: string;
  isFavorite?: boolean;
  lastTransaction?: string;
  lastAmount?: number;
}

interface Transaction {
  id: string;
  recipient: string;
  recipientAvatar: string;
  amount: number;
  currency: Currency;
  date: string;
  status: TransactionStatus;
  type: TransactionType;
  note?: string;
  paymentMethod: PaymentMethodId;
}

interface FormData {
  recipient: string;
  amount: string;
  note: string;
  paymentMethod: PaymentMethodId;
  scheduleDate: string;
  currency: Currency;
  isRecurring: boolean;
  recurringFrequency: "weekly" | "monthly" | "";
}

interface SplitEntry {
  email: string;
  amount: string;
  name: string;
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  icon: React.ElementType;
  fee: string;
  feeAmount: number;
  time: string;
  badge?: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const QUICK_AMOUNTS = [25, 50, 100, 250, 500, 1000] as const;

const CURRENCIES: Record<Currency, { symbol: string; flag: string; rate: number }> = {
  USD: { symbol: "$",   flag: "🇺🇸", rate: 1     },
  EUR: { symbol: "€",   flag: "🇪🇺", rate: 0.92  },
  GBP: { symbol: "£",   flag: "🇬🇧", rate: 0.79  },
  INR: { symbol: "₹",   flag: "🇮🇳", rate: 83.12 },
  AED: { symbol: "د.إ", flag: "🇦🇪", rate: 3.67  },
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "bank",   name: "Bank Account",   icon: Building2,  fee: "Free",  feeAmount: 0,   time: "1–3 days"  },
  { id: "card",   name: "Debit Card",     icon: CreditCard, fee: "$0.50", feeAmount: 0.5, time: "Instant",  badge: "Fast"    },
  { id: "wallet", name: "Digital Wallet", icon: Smartphone, fee: "Free",  feeAmount: 0,   time: "Instant",  badge: "Popular" },
];

const STATIC_CONTACTS: Contact[] = [
  { id: 1, name: "John Doe",     email: "john@example.com",   avatar: "JD", avatarColor: "#f97316", isFavorite: true,  lastTransaction: "2 days ago",  lastAmount: 120  },
  { id: 2, name: "Sarah Smith",  email: "sarah@example.com",  avatar: "SS", avatarColor: "#8b5cf6", isFavorite: true,  lastTransaction: "5 days ago",  lastAmount: 50   },
  { id: 3, name: "Mike Johnson", email: "mike@example.com",   avatar: "MJ", avatarColor: "#06b6d4",                   lastTransaction: "1 week ago",  lastAmount: 200  },
  { id: 4, name: "Emily Davis",  email: "emily@example.com",  avatar: "ED", avatarColor: "#ec4899",                   lastTransaction: "2 weeks ago", lastAmount: 75   },
  { id: 5, name: "David Wilson", email: "david@example.com",  avatar: "DW", avatarColor: "#10b981", isFavorite: true,  lastTransaction: "3 weeks ago", lastAmount: 300  },
  { id: 6, name: "Priya Sharma", email: "priya@example.com",  avatar: "PS", avatarColor: "#f59e0b",                   lastTransaction: "1 month ago", lastAmount: 180  },
];

const DEFAULT_FORM: FormData = {
  recipient: "", amount: "", note: "",
  paymentMethod: "bank", scheduleDate: "",
  currency: "USD", isRecurring: false, recurringFrequency: "",
};

const TODAY = new Date().toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────
// Toast Hook
// ─────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  return { toasts, addToast, removeToast };
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span className="toast-icon">
          {t.type === "success" ? <Check size={15} /> : t.type === "error" ? <AlertCircle size={15} /> : <Bell size={15} />}
        </span>
        <span className="toast-msg">{t.message}</span>
        <button className="toast-close" onClick={() => onRemove(t.id)}><X size={13} /></button>
      </div>
    ))}
  </div>
);

const CurrencySelector: React.FC<{ value: Currency; onChange: (c: Currency) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="currency-sel" ref={ref}>
      <button type="button" className="currency-trigger" onClick={() => setOpen(!open)}>
        <span>{CURRENCIES[value].flag}</span>
        <span>{value}</span>
        <ChevronDown size={13} className={open ? "rotated" : ""} />
      </button>
      {open && (
        <div className="currency-drop">
          {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
            <button key={c} type="button" className={`currency-opt ${c === value ? "active" : ""}`}
              onClick={() => { onChange(c); setOpen(false); }}>
              <span>{CURRENCIES[c].flag}</span>
              <span className="cur-code">{c}</span>
              <span className="cur-rate">1 USD = {CURRENCIES[c].rate}</span>
              {c === value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface BalanceCardProps {
  balance: number; currency: Currency;
  onRefresh: () => void; refreshing: boolean;
  hidden: boolean; onToggleHide: () => void;
}
const BalanceCard: React.FC<BalanceCardProps> = ({ balance, currency, onRefresh, refreshing, hidden, onToggleHide }) => {
  const sym = CURRENCIES[currency].symbol;
  const converted = (balance * CURRENCIES[currency].rate).toFixed(2);
  return (
    <div className="balance-card">
      <div className="bal-orb bal-orb-1" />
      <div className="bal-orb bal-orb-2" />
      <div className="bal-top">
        <div>
          <span className="bal-label">Available Balance</span>
          <div className="bal-amount-row">
            <h2 className="bal-amount">{hidden ? "•••••" : `${sym}${converted}`}</h2>
            <button type="button" className="bal-eye" onClick={onToggleHide}>
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {currency !== "USD" && !hidden && (
            <span className="bal-sub">≈ ${balance.toFixed(2)} USD</span>
          )}
        </div>
        <div className="bal-right">
          <div className="bal-badge"><TrendingUp size={13} /><span>+12.5%</span></div>
          <button type="button" className={`bal-refresh ${refreshing ? "spin" : ""}`} onClick={onRefresh}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      <div className="bal-stats">
        {[
          { icon: <ArrowUpRight size={13} />, cls: "out", label: "Sent",     val: "$1,240" },
          { icon: <ArrowDownLeft size={13} />, cls: "in",  label: "Received", val: "$3,580" },
          { icon: <Repeat2 size={13} />,       cls: "pnd", label: "Pending",  val: "$200"   },
        ].map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="bal-divider" />}
            <div className="bal-stat">
              <span className={`bal-stat-icon ${s.cls}`}>{s.icon}</span>
              <div>
                <span className="bal-stat-label">{s.label}</span>
                <span className="bal-stat-val">{s.val}</span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const ContactRow: React.FC<{ contact: Contact; selected: boolean; onSelect: (c: Contact) => void }> = ({ contact, selected, onSelect }) => (
  <button className={`contact-row ${selected ? "active" : ""}`} onClick={() => onSelect(contact)}>
    <div className="c-av" style={{ "--av": contact.avatarColor } as React.CSSProperties}>{contact.avatar}</div>
    <div className="c-info">
      <div className="c-name-row">
        <span className="c-name">{contact.name}</span>
        {contact.isFavorite && <Star size={10} className="c-star" />}
      </div>
      <span className="c-meta">{contact.email}</span>
    </div>
    {contact.lastAmount && <span className="c-last">${contact.lastAmount}</span>}
  </button>
);

const TxCard: React.FC<{ tx: Transaction; onCopy: (id: string) => void }> = ({ tx, onCopy }) => (
  <div className="tx-card">
    <div className="tx-av-wrap">
      <div className="tx-av">{tx.recipientAvatar || tx.recipient.slice(0, 2).toUpperCase()}</div>
      <div className={`tx-dot ${tx.type}`}>
        {tx.type === "sent" ? <ArrowUpRight size={9} /> : <ArrowDownLeft size={9} />}
      </div>
    </div>
    <div className="tx-info">
      <span className="tx-name">{tx.recipient}</span>
      <div className="tx-meta">
        <span className="tx-date">{tx.date}</span>
        {tx.note && <span className="tx-note">"{tx.note}"</span>}
      </div>
    </div>
    <div className="tx-right">
      <span className={`tx-amount ${tx.type}`}>
        {tx.type === "sent" ? "−" : "+"}
        {CURRENCIES[tx.currency ?? "USD"].symbol}{tx.amount.toFixed(2)}
      </span>
      <div className="tx-bottom">
        <span className={`tx-badge tx-${tx.status}`}>{tx.status}</span>
        <button className="tx-copy" onClick={() => onCopy(tx.id)}><Copy size={11} /></button>
      </div>
    </div>
  </div>
);

const SplitTab: React.FC<{ totalAmount: string; onAddToast: (t: Toast["type"], m: string) => void }> = ({ totalAmount, onAddToast }) => {
  const [total, setTotal] = useState(totalAmount || "");
  const [splits, setSplits] = useState<SplitEntry[]>([
    { email: "", amount: "", name: "" },
    { email: "", amount: "", name: "" },
  ]);

  const remaining = (): number => {
    const t = parseFloat(total) || 0;
    const used = splits.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    return parseFloat((t - used).toFixed(2));
  };

  const distribute = () => {
    const t = parseFloat(total);
    if (!t) return;
    const each = (t / splits.length).toFixed(2);
    setSplits((p) => p.map((s) => ({ ...s, amount: each })));
  };

  const add    = () => setSplits((p) => [...p, { email: "", amount: "", name: "" }]);
  const remove = (i: number) => setSplits((p) => p.filter((_, idx) => idx !== i));
  const update = (i: number, f: keyof SplitEntry, v: string) =>
    setSplits((p) => p.map((s, idx) => idx === i ? { ...s, [f]: v } : s));

  const handleSend = () => {
    if (splits.some((s) => !s.email || !s.amount)) { onAddToast("error", "Fill all email and amount fields."); return; }
    if (remaining() < 0) { onAddToast("error", "Split exceeds total amount."); return; }
    onAddToast("success", `Split payment sent to ${splits.length} people!`);
  };

  return (
    <div className="split-tab">
      <div className="split-hero">
        <div className="split-hero-icon"><SplitSquareVertical size={24} /></div>
        <div>
          <h2 className="split-h">Split Payment</h2>
          <p className="split-p">Divide a bill across multiple people</p>
        </div>
      </div>

      <div className="split-total-row">
        <div className="split-total-input-wrap">
          <DollarSign size={17} className="split-dollar" />
          <input type="number" placeholder="Total amount" value={total}
            onChange={(e) => setTotal(e.target.value)} className="split-total-input" />
        </div>
        <button type="button" className="split-even-btn" onClick={distribute}>
          <Zap size={14} /> Split Evenly
        </button>
      </div>

      <div className="split-people">
        {splits.map((s, i) => (
          <div key={i} className="split-card">
            <span className="split-num">{i + 1}</span>
            <div className="split-fields">
              <input type="text" placeholder="Name" value={s.name}
                onChange={(e) => update(i, "name", e.target.value)} className="split-field" />
              <input type="email" placeholder="Email" value={s.email}
                onChange={(e) => update(i, "email", e.target.value)} className="split-field" />
              <div className="split-amt-wrap">
                <span className="split-sym">$</span>
                <input type="number" placeholder="0.00" value={s.amount}
                  onChange={(e) => update(i, "amount", e.target.value)} className="split-field split-amt" />
              </div>
            </div>
            {splits.length > 2 &&
              <button type="button" className="split-rm" onClick={() => remove(i)}><X size={14} /></button>}
          </div>
        ))}
      </div>

      <div className="split-footer">
        <span className={`split-rem ${remaining() < 0 ? "over" : ""}`}>
          Remaining: <strong>${remaining().toFixed(2)}</strong>
        </span>
        <div className="split-btns">
          <button type="button" className="split-add" onClick={add}>+ Add Person</button>
          <button type="button" className="split-send" onClick={handleSend}>
            <Send size={15} /> Send Split
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
const SendMoney: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toasts, addToast, removeToast } = useToasts();

  const [form, setForm]                       = useState<FormData>(DEFAULT_FORM);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery]         = useState("");
  const [activeTab, setActiveTab]             = useState<ActiveTab>("send");
  const [showConfirm, setShowConfirm]         = useState(false);

  const [balance, setBalance]                     = useState(0);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [loading, setLoading]                     = useState(false);
  const [historyLoading, setHistoryLoading]       = useState(false);
  const [transactions, setTransactions]           = useState<Transaction[]>([]);

  const [balanceHidden, setBalanceHidden]     = useState(false);
  const [historyFilter, setHistoryFilter]     = useState<"all" | TransactionType>("all");
  const [historySearch, setHistorySearch]     = useState("");
  const [txSortDesc, setTxSortDesc]           = useState(true);

  const fetchBalance = useCallback(async () => {
    if (status !== "authenticated") return;
    setBalanceRefreshing(true);
    try {
      const res = await fetch("/api/user/balance", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBalance(Number(data.balance) || 0);
    } catch { setBalance(47_832.50); }
    finally  { setBalanceRefreshing(false); }
  }, [status]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const fetchHistory = useCallback(async () => {
    if (status !== "authenticated") return;
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/transactions/history", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } catch { setTransactions([]); }
    finally  { setHistoryLoading(false); }
  }, [status]);

  useEffect(() => { if (activeTab === "history") fetchHistory(); }, [activeTab, fetchHistory]);

  if (status === "loading") return <div className="auth-loader"><div className="loader-ring" /></div>;
  if (!session) { router.push("/login"); return null; }

  const filteredContacts = STATIC_CONTACTS.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === form.paymentMethod)!;
  const total = parseFloat(form.amount || "0") + selectedMethod.feeAmount;

  const filteredTxs = transactions
    .filter((tx) => historyFilter === "all" || tx.type === historyFilter)
    .filter((tx) => !historySearch || tx.recipient.toLowerCase().includes(historySearch.toLowerCase()))
    .sort((a, b) => txSortDesc
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime());

  const updateField = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    updateField(e.target.name as keyof FormData, val);
  };

  const selectContact = (c: Contact) => {
    setSelectedContact(c);
    updateField("recipient", c.email);
    if (c.lastAmount) updateField("amount", c.lastAmount.toString());
  };

  const setQuickAmount = (a: number) => {
    if (a > balance) { addToast("error", "Insufficient balance."); return; }
    updateField("amount", a.toString());
  };

  const validate = (): boolean => {
    const amt = parseFloat(form.amount);
    if (!form.recipient || !/\S+@\S+\.\S+/.test(form.recipient)) {
      addToast("error", "Enter a valid recipient email."); return false;
    }
    if (!form.amount || isNaN(amt) || amt <= 0) {
      addToast("error", "Enter an amount greater than 0."); return false;
    }
    if (total > balance) {
      addToast("error", "Insufficient balance (including fees)."); return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) setShowConfirm(true); };

  const confirmSend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/send", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: form.recipient.trim(),
          amount: parseFloat(form.amount), note: form.note,
          paymentMethod: form.paymentMethod, scheduleDate: form.scheduleDate || null,
          currency: form.currency, isRecurring: form.isRecurring,
          recurringFrequency: form.recurringFrequency || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Transaction failed");
      setBalance((p) => p - total);
      setShowConfirm(false);
      addToast("success", `${CURRENCIES[form.currency].symbol}${parseFloat(form.amount).toFixed(2)} sent!`);
      setForm(DEFAULT_FORM);
      setSelectedContact(null);
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err: any) {
      addToast("error", err.message || "Transaction failed.");
    } finally { setLoading(false); }
  };

  const copyTxId = (id: string) =>
    navigator.clipboard.writeText(id).then(() => addToast("info", `ID copied: ${id.slice(0, 8)}…`));

  return (
    <div className="sm-root">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="sm-header">
        <button className="sm-back" onClick={() => router.push("/dashboard")}><ArrowLeft size={19} /></button>
        <h1 className="sm-title">Send Money</h1>
        <div className="sm-hd-right">
          <CurrencySelector value={form.currency} onChange={(c) => updateField("currency", c)} />
          <button className="sm-icon-btn"><Filter size={16} /></button>
        </div>
      </header>

      <BalanceCard
        balance={balance} currency={form.currency}
        onRefresh={fetchBalance} refreshing={balanceRefreshing}
        hidden={balanceHidden} onToggleHide={() => setBalanceHidden((v) => !v)}
      />

      {/* Tabs */}
      <nav className="sm-tabs">
        {(["send", "history", "split"] as ActiveTab[]).map((tab) => (
          <button key={tab} className={`sm-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "send"    && <Send size={15} />}
            {tab === "history" && <Clock size={15} />}
            {tab === "split"   && <SplitSquareVertical size={15} />}
            <span>{tab === "send" ? "Send" : tab === "history" ? "History" : "Split"}</span>
          </button>
        ))}
      </nav>

      {/* ── SEND TAB ── */}
      {activeTab === "send" && (
        <div className="send-layout">
          {/* Favorites chips */}
          <div className="fav-row">
            {STATIC_CONTACTS.filter((c) => c.isFavorite).map((c) => (
              <button key={c.id}
                className={`fav-chip ${selectedContact?.id === c.id ? "active" : ""}`}
                onClick={() => selectContact(c)}
              >
                <div className="fav-chip-av" style={{ "--av": c.avatarColor } as React.CSSProperties}>{c.avatar}</div>
                <span>{c.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          <div className="send-grid">
            {/* Contacts sidebar */}
            <aside className="contacts-side">
              <div className="contacts-hd">
                <h3 className="contacts-title"><Users size={15} />Contacts</h3>
                <button className="view-all"><ChevronRight size={14} /></button>
              </div>
              <div className="contacts-search">
                <Search size={15} />
                <input type="text" placeholder="Search…" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} />
                {searchQuery && <button onClick={() => setSearchQuery("")}><X size={13} /></button>}
              </div>

              {filteredContacts.filter((c) => c.isFavorite).length > 0 && (
                <div className="contacts-group">
                  <span className="group-label"><Star size={11} />Starred</span>
                  {filteredContacts.filter((c) => c.isFavorite).map((c) =>
                    <ContactRow key={c.id} contact={c} selected={selectedContact?.id === c.id} onSelect={selectContact} />
                  )}
                </div>
              )}
              <div className="contacts-group">
                <span className="group-label"><Clock size={11} />Recent</span>
                {filteredContacts.filter((c) => !c.isFavorite).map((c) =>
                  <ContactRow key={c.id} contact={c} selected={selectedContact?.id === c.id} onSelect={selectContact} />
                )}
              </div>
            </aside>

            {/* Form */}
            <div className="form-col">
              <form className="sm-form" onSubmit={handleSubmit} noValidate>

                {/* Recipient */}
                <div className="fg">
                  <label className="fl" htmlFor="recipient">Recipient</label>
                  <div className="fi-wrap">
                    <User size={17} className="fi" />
                    <input id="recipient" name="recipient" type="email"
                      placeholder="Email address" value={form.recipient} onChange={handleChange} />
                  </div>
                  {selectedContact && (
                    <div className="c-badge">
                      <div className="c-badge-av" style={{ "--av": selectedContact.avatarColor } as React.CSSProperties}>
                        {selectedContact.avatar}
                      </div>
                      <span>{selectedContact.name}</span>
                      <button type="button" onClick={() => { setSelectedContact(null); updateField("recipient", ""); }}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="fg">
                  <label className="fl" htmlFor="amount">Amount</label>
                  <div className="fi-wrap">
                    <DollarSign size={17} className="fi" />
                    <input id="amount" name="amount" type="number"
                      placeholder="0.00" step="0.01" min="0.01"
                      value={form.amount} onChange={handleChange} />
                  </div>
                  <div className="quick-grid">
                    {QUICK_AMOUNTS.map((a) => (
                      <button key={a} type="button" className="quick-btn" onClick={() => setQuickAmount(a)}>
                        {CURRENCIES[form.currency].symbol}{a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="fg">
                  <label className="fl">Payment Method</label>
                  <div className="method-list">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m.id} type="button"
                        className={`method-card ${form.paymentMethod === m.id ? "active" : ""}`}
                        onClick={() => updateField("paymentMethod", m.id)}
                      >
                        <div className="method-ico"><m.icon size={18} /></div>
                        <div className="method-txt">
                          <span className="method-name">{m.name}</span>
                          <span className="method-sub">{m.fee} · {m.time}</span>
                        </div>
                        {m.badge && <span className="method-badge">{m.badge}</span>}
                        {form.paymentMethod === m.id && <div className="method-chk"><Check size={13} /></div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="fg">
                  <label className="fl" htmlFor="scheduleDate">
                    Schedule <span className="opt">(optional)</span>
                  </label>
                  <div className="fi-wrap">
                    <Calendar size={17} className="fi" />
                    <input id="scheduleDate" name="scheduleDate" type="date"
                      value={form.scheduleDate} onChange={handleChange} min={TODAY} />
                  </div>
                </div>

                {/* Recurring */}
                <div className="fg">
                  <label className="toggle-label" htmlFor="isRecurring">
                    <div>
                      <span className="fl">Recurring Payment</span>
                      <span className="field-hint">Auto-repeat this transfer</span>
                    </div>
                    <div className="toggle-wrap">
                      <input id="isRecurring" name="isRecurring" type="checkbox"
                        checked={form.isRecurring} onChange={handleChange} className="toggle-input" />
                      <div className={`toggle-track ${form.isRecurring ? "on" : ""}`}>
                        <div className="toggle-thumb" />
                      </div>
                    </div>
                  </label>
                  {form.isRecurring && (
                    <div className="recur-row">
                      {(["weekly", "monthly"] as const).map((f) => (
                        <button key={f} type="button"
                          className={`recur-btn ${form.recurringFrequency === f ? "active" : ""}`}
                          onClick={() => updateField("recurringFrequency", f)}>
                          <Repeat2 size={13} />{f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="fg">
                  <label className="fl" htmlFor="note">Note <span className="opt">(optional)</span></label>
                  <textarea id="note" name="note" placeholder="What's this for?" rows={2}
                    value={form.note} onChange={handleChange} maxLength={200} />
                  <span className="char-cnt">{form.note.length}/200</span>
                </div>

                <div className="sec-pill"><Shield size={13} /><span>256-bit encrypted · end-to-end secured</span></div>

                <button type="submit" className="send-btn" disabled={loading}>
                  <Send size={17} /><span>Send Money</span>
                </button>
              </form>

              {/* Summary */}
              {parseFloat(form.amount) > 0 && (
                <div className="summary-card">
                  <h3 className="summary-title">Summary</h3>
                  {[
                    { l: "Amount",    v: `${CURRENCIES[form.currency].symbol}${parseFloat(form.amount).toFixed(2)}` },
                    { l: "Fee",       v: selectedMethod.fee },
                    { l: "Recipient", v: form.recipient || "—" },
                    ...(form.scheduleDate ? [{ l: "Scheduled", v: form.scheduleDate }] : []),
                    ...(form.isRecurring  ? [{ l: "Repeats",   v: form.recurringFrequency || "—" }] : []),
                  ].map(({ l, v }) => (
                    <div key={l} className="sum-row"><span>{l}</span><span>{v}</span></div>
                  ))}
                  <div className="sum-total">
                    <span>Total</span>
                    <span>{CURRENCIES[form.currency].symbol}{total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === "history" && (
        <div className="history-tab">
          <div className="history-ctrl">
            <div className="history-search">
              <Search size={14} />
              <input type="text" placeholder="Search transactions…" value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)} />
            </div>
            <div className="history-pills">
              {(["all", "sent", "received"] as const).map((f) => (
                <button key={f} className={`h-pill ${historyFilter === f ? "active" : ""}`}
                  onClick={() => setHistoryFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="history-acts">
              <button className="h-act-btn" onClick={() => setTxSortDesc((v) => !v)}>
                <Filter size={14} />{txSortDesc ? "Newest" : "Oldest"}
              </button>
              <button className="h-act-btn"><Download size={14} />Export</button>
            </div>
          </div>

          {historyLoading ? (
            <div className="loading-state"><div className="loader-ring" /><span>Loading…</span></div>
          ) : filteredTxs.length === 0 ? (
            <div className="empty-state">
              <Clock size={40} /><p>No transactions found</p><span>Your history will appear here</span>
            </div>
          ) : (
            <div className="tx-list">
              {filteredTxs.map((tx) => <TxCard key={tx.id} tx={tx} onCopy={copyTxId} />)}
            </div>
          )}
        </div>
      )}

      {/* ── SPLIT TAB ── */}
      {activeTab === "split" && (
        <SplitTab totalAmount={form.amount} onAddToast={addToast} />
      )}

      {/* ── Confirm Modal ── */}
      {showConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowConfirm(false)} />
          <div className="modal">
            <div className="modal-inner">
              <div className="modal-hd">
                <h3>Confirm Transfer</h3>
                <button className="modal-close" onClick={() => setShowConfirm(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div className="modal-amount">
                  <span>{CURRENCIES[form.currency].symbol}{parseFloat(form.amount).toFixed(2)}</span>
                  <small>{form.currency}</small>
                </div>
                <div className="modal-details">
                  {[
                    { l: "To",    v: selectedContact?.name ?? form.recipient },
                    { l: "Via",   v: selectedMethod.name },
                    { l: "Fee",   v: selectedMethod.fee },
                    { l: "Total", v: `${CURRENCIES[form.currency].symbol}${total.toFixed(2)}` },
                    ...(form.scheduleDate ? [{ l: "Scheduled", v: form.scheduleDate }] : []),
                    ...(form.isRecurring  ? [{ l: "Repeating", v: form.recurringFrequency }] : []),
                    ...(form.note        ? [{ l: "Note",       v: form.note }] : []),
                  ].map(({ l, v }) => (
                    <div key={l} className="modal-row">
                      <span className="modal-lbl">{l}</span>
                      <span className="modal-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-ft">
                <button className="modal-cancel" onClick={() => setShowConfirm(false)} disabled={loading}>Cancel</button>
                <button className="modal-confirm" onClick={confirmSend} disabled={loading}>
                  {loading
                    ? <><div className="loader-sm" /><span>Processing…</span></>
                    : <><Shield size={14} /><span>Confirm & Send</span></>}
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

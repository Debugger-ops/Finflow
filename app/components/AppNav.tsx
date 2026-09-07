"use client";

/**
 * AppNav — the single navigation shell for every signed-in screen.
 *
 * Before this existed each page rolled its own header (or none at all) and
 * BottomNavigation.tsx was orphaned: it drove local `activeTab` state instead of
 * routes, so it could never navigate anywhere. This component is mounted once in
 * the root layout and adapts by viewport:
 *   • ≥900px — sticky top bar: logo, section links, live balance, bell, avatar menu
 *   • <900px — slim top bar + fixed bottom tab bar with a centre Send action and
 *     a "More" sheet holding the rest of the app.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Wallet, LayoutDashboard, Receipt, Send, TrendingUp, Target, BarChart3,
  Bell, User, Zap, CreditCard, LogOut, MoreHorizontal, X, Settings,
  ArrowDownLeft, Check,
} from "lucide-react";
import "./AppNav.css";

/** Routes that render their own full-page chrome (landing + auth). */
const HIDDEN_ON = ["/", "/login", "/register"];

const PRIMARY = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/investment",   label: "Investments",  icon: TrendingUp },
  { href: "/Goals",        label: "Goals",        icon: Target },
  { href: "/reports",      label: "Reports",      icon: BarChart3 },
];

const MORE = [
  { href: "/Goals",       label: "Goals",       icon: Target },
  { href: "/reports",     label: "Reports",     icon: BarChart3 },
  { href: "/pay-bills",   label: "Pay Bills",   icon: Zap },
  { href: "/add-card",    label: "Add Card",    icon: CreditCard },
  { href: "/buy-stocks",  label: "Buy Assets",  icon: TrendingUp },
  { href: "/sell-stocks", label: "Sell Assets", icon: ArrowDownLeft },
  { href: "/profile",     label: "Profile",     icon: Settings },
];

interface Notif {
  id: string; title: string; body: string; read: boolean; createdAt: string;
}

const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

export default function AppNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { data: session, status } = useSession();

  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [moreOpen, setMoreOpen]   = useState(false);
  const [notifs, setNotifs]       = useState<Notif[]>([]);
  const [unread, setUnread]       = useState(0);
  const [balance, setBalance]     = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const hidden = HIDDEN_ON.includes(pathname) || status !== "authenticated";

  /* Reserve room for the fixed mobile tab bar without every page having to
     know about it. Cleaned up when the nav is hidden or unmounts. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.dataset.appnav = hidden ? "off" : "on";
    return () => { document.body.dataset.appnav = "off"; };
  }, [hidden]);

  /* Real balance + notifications, refreshed on navigation. */
  const load = useCallback(() => {
    if (hidden) return;
    fetch("/api/user/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (typeof d?.balance === "number") setBalance(d.balance); })
      .catch(() => {});
    fetch("/api/notifications?limit=15")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.success) return;
        setNotifs(d.data.notifications);
        setUnread(d.data.unread);
      })
      .catch(() => {});
  }, [hidden]);

  useEffect(() => { load(); }, [load, pathname]);

  /* Close every overlay on outside click, on Escape, and on navigation. */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) {
        setNotifOpen(false); setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setNotifOpen(false); setMenuOpen(false); setMoreOpen(false); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => { setNotifOpen(false); setMenuOpen(false); setMoreOpen(false); }, [pathname]);

  const markAll = async () => {
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  };

  const markOne = async (id: string) => {
    setNotifs((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  if (hidden) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const name = session?.user?.name ?? session?.user?.email ?? "Account";
  const initials = name.trim().slice(0, 2).toUpperCase();

  return (
    <>
      <header className="appnav" ref={navRef}>
        <div className="appnav-inner">
          <Link href="/dashboard" className="appnav-brand" aria-label="FinFlow home">
            <span className="appnav-logo"><Wallet size={18} /></span>
            <span className="appnav-wordmark">FinFlow</span>
          </Link>

          <nav className="appnav-links" aria-label="Main">
            {PRIMARY.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`appnav-link ${isActive(href) ? "is-active" : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Icon size={16} aria-hidden />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="appnav-actions">
            {balance !== null && (
              <Link href="/transactions" className="appnav-balance" title="Available balance">
                <span className="appnav-balance-label">Balance</span>
                <span className="appnav-balance-value">
                  ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </Link>
            )}

            <Link href="/send-money" className="appnav-send">
              <Send size={15} aria-hidden /><span>Send</span>
            </Link>

            <div className="appnav-pop">
              <button
                type="button"
                className="appnav-icon-btn"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                aria-expanded={notifOpen}
                onClick={() => { setNotifOpen((o) => !o); setMenuOpen(false); }}
              >
                <Bell size={18} />
                {unread > 0 && <span className="appnav-dot">{unread > 9 ? "9+" : unread}</span>}
              </button>

              {notifOpen && (
                <div className="appnav-panel appnav-notifs" role="dialog" aria-label="Notifications">
                  <div className="appnav-panel-head">
                    <h2>Notifications</h2>
                    {unread > 0 && (
                      <button type="button" onClick={markAll} className="appnav-linkbtn">
                        <Check size={13} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="appnav-notif-list">
                    {notifs.length === 0 && (
                      <p className="appnav-empty">You're all caught up.</p>
                    )}
                    {notifs.map((n) => (
                      <button
                        type="button"
                        key={n.id}
                        className={`appnav-notif ${n.read ? "" : "is-unread"}`}
                        onClick={() => !n.read && markOne(n.id)}
                      >
                        <span className="appnav-notif-title">{n.title}</span>
                        {n.body && <span className="appnav-notif-body">{n.body}</span>}
                        <span className="appnav-notif-time">{timeAgo(n.createdAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="appnav-pop">
              <button
                type="button"
                className="appnav-avatar"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => { setMenuOpen((o) => !o); setNotifOpen(false); }}
              >
                {session?.user?.image
                  ? <img src={session.user.image} alt="" />
                  : <span>{initials}</span>}
              </button>

              {menuOpen && (
                <div className="appnav-panel appnav-menu" role="menu">
                  <div className="appnav-menu-id">
                    <p className="appnav-menu-name">{name}</p>
                    {session?.user?.email && <p className="appnav-menu-mail">{session.user.email}</p>}
                  </div>
                  <Link href="/profile" role="menuitem"><User size={15} /> Profile &amp; settings</Link>
                  <Link href="/pay-bills" role="menuitem"><Zap size={15} /> Pay bills</Link>
                  <Link href="/add-card" role="menuitem"><CreditCard size={15} /> Cards</Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="appnav-signout"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile tab bar ── */}
      <nav className="apptabs" aria-label="Main (mobile)">
        <Link href="/dashboard" className={`apptab ${isActive("/dashboard") ? "is-active" : ""}`}>
          <LayoutDashboard size={20} aria-hidden /><span>Home</span>
        </Link>
        <Link href="/transactions" className={`apptab ${isActive("/transactions") ? "is-active" : ""}`}>
          <Receipt size={20} aria-hidden /><span>Activity</span>
        </Link>
        <Link href="/send-money" className="apptab apptab-cta" aria-label="Send money">
          <span className="apptab-cta-ring"><Send size={20} aria-hidden /></span>
        </Link>
        <Link href="/investment" className={`apptab ${isActive("/investment") ? "is-active" : ""}`}>
          <TrendingUp size={20} aria-hidden /><span>Invest</span>
        </Link>
        <button
          type="button"
          className={`apptab ${moreOpen ? "is-active" : ""}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
        >
          <MoreHorizontal size={20} aria-hidden /><span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="appsheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="appsheet" role="dialog" aria-label="More" onClick={(e) => e.stopPropagation()}>
            <div className="appsheet-head">
              <span className="appsheet-grip" aria-hidden />
              <button type="button" className="appnav-icon-btn" aria-label="Close" onClick={() => setMoreOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="appsheet-grid">
              {MORE.map(({ href, label, icon: Icon }) => (
                <Link key={href + label} href={href} className="appsheet-item">
                  <Icon size={20} aria-hidden /><span>{label}</span>
                </Link>
              ))}
            </div>
            <button
              type="button"
              className="appsheet-signout"
              onClick={() => { setMoreOpen(false); signOut({ callbackUrl: "/login" }); }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

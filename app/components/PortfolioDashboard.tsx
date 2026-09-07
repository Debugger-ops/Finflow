'use client';

/**
 * Small embeddable portfolio summary.
 *
 * It used to call `/api/portfolio/${userId}` — a route that doesn't exist, and
 * one that would have let any caller read another user's holdings by guessing an
 * id. It now uses the session-scoped `/api/portfolio` endpoint and its real
 * response shape.
 */
import { useEffect, useState } from "react";

interface Position {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  price: number;
  marketValue: number;
  unrealizedPLPercent: number;
}

export default function PortfolioDashboard() {
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portfolio")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("portfolio"))))
      .then((data) => { if (!cancelled) setPositions(data?.data?.positions ?? []); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <p>Couldn&apos;t load your portfolio.</p>;
  if (!positions) return <p>Loading…</p>;
  if (positions.length === 0) return <p>You don&apos;t hold any assets yet.</p>;

  return (
    <div>
      <h2>My Portfolio</h2>
      {positions.map((pos) => (
        <div key={pos.symbol}>
          {pos.symbol}: {pos.shares} @ ${pos.avgCost.toFixed(2)} · now ${pos.marketValue.toFixed(2)}
          {" "}({pos.unrealizedPLPercent >= 0 ? "+" : ""}{pos.unrealizedPLPercent.toFixed(1)}%)
        </div>
      ))}
    </div>
  );
}

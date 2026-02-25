'use client';
import { useEffect, useState } from "react";

export default function PortfolioDashboard({ userId }: { userId: string }) {
  const [portfolio, setPortfolio] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/portfolio/${userId}`)
      .then(res => res.json())
      .then(data => setPortfolio(data));
  }, [userId]);

  if(!portfolio) return <p>Loading...</p>;

  return (
    <div>
      <h2>My Portfolio</h2>
      {portfolio.investments.map((inv: any, idx: number) => (
        <div key={idx}>
          {inv.symbol}: {inv.quantity} shares at ${inv.avgPrice.toFixed(2)}
        </div>
      ))}
    </div>
  );
}

'use client';
import { useEffect, useState } from "react";
import { connectFinnhubWS } from "../libs/finnhubSocket";

interface Props { symbol: string; }

export default function LiveStockPrice({ symbol }: Props) {
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    const ws = connectFinnhubWS(symbol, (data) => {
      if(data && data.data) setPrice(data.data[0].p);
    });
    return () => ws.close();
  }, [symbol]);

  return <div>{symbol}: ${price.toFixed(2)}</div>;
}

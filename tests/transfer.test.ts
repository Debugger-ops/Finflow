import { describe, it, expect } from "vitest";

// Fee/total math mirrors app/libs/transfer.ts. Kept as a pure-function test so
// it runs without a database. If you change the fee table, update both.
const FEES: Record<string, number> = { bank: 0, card: 0.5, wallet: 0 };
const round2 = (n: number) => Math.round(n * 100) / 100;
const total = (amount: number, method: string) => round2(round2(amount) + round2(FEES[method] ?? 0));

describe("transfer totals", () => {
  it("adds no fee for bank/wallet", () => {
    expect(total(100, "bank")).toBe(100);
    expect(total(100, "wallet")).toBe(100);
  });
  it("adds a 0.50 fee for card", () => {
    expect(total(100, "card")).toBe(100.5);
  });
  it("rounds to 2 decimals", () => {
    expect(total(10.005, "bank")).toBe(10.01);
  });
});

import { describe, it, expect } from "vitest";
import { registerSchema, sendMoneySchema, orderSchema } from "../app/libs/validators";

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    const r = registerSchema.safeParse({ name: "Bhumika", email: "b@x.com", password: "longpass123" });
    expect(r.success).toBe(true);
  });
  it("rejects short passwords", () => {
    const r = registerSchema.safeParse({ name: "Bhumika", email: "b@x.com", password: "short" });
    expect(r.success).toBe(false);
  });
  it("rejects bad emails", () => {
    const r = registerSchema.safeParse({ name: "Bhumika", email: "nope", password: "longpass123" });
    expect(r.success).toBe(false);
  });
});

describe("sendMoneySchema", () => {
  it("coerces amount and applies defaults", () => {
    const r = sendMoneySchema.safeParse({ recipientEmail: "a@b.com", amount: "25.5" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.amount).toBe(25.5);
      expect(r.data.currency).toBe("USD");
      expect(r.data.paymentMethod).toBe("bank");
    }
  });
  it("rejects non-positive amounts", () => {
    expect(sendMoneySchema.safeParse({ recipientEmail: "a@b.com", amount: 0 }).success).toBe(false);
  });
});

describe("orderSchema", () => {
  it("uppercases the symbol", () => {
    const r = orderSchema.safeParse({ symbol: "aapl", shares: 2, price: 100 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.symbol).toBe("AAPL");
  });
});

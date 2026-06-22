import { describe, it, expect } from "vitest";
import { generateSecret, generateTOTP, verifyTOTP, otpauthURL } from "../app/libs/totp";

describe("TOTP (RFC 6238)", () => {
  it("verifies a freshly generated code", () => {
    const secret = generateSecret();
    const code = generateTOTP(secret);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTOTP(secret, code)).toBe(true);
  });

  it("rejects a wrong code", () => {
    const secret = generateSecret();
    const wrong = generateTOTP(secret) === "000000" ? "111111" : "000000";
    expect(verifyTOTP(secret, wrong)).toBe(false);
  });

  it("accepts codes within the drift window", () => {
    const secret = generateSecret();
    const now = Date.now();
    const prevStep = generateTOTP(secret, now - 30_000);
    expect(verifyTOTP(secret, prevStep, now)).toBe(true);
  });

  it("builds a valid otpauth URL", () => {
    const url = otpauthURL("JBSWY3DPEHPK3PXP", "user@example.com");
    expect(url).toContain("otpauth://totp/");
    expect(url).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(url).toContain("issuer=FinFlow");
  });
});

// app/libs/validators/index.ts
// Central zod schemas for API input. Import these in routes via `validate()`.
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  company: z.string().max(120).optional(),
});

export const sendMoneySchema = z.object({
  recipientEmail: z.string().email("Invalid recipient email address."),
  amount: z.coerce.number().positive("Amount must be greater than 0."),
  currency: z.enum(["USD", "EUR", "GBP", "INR", "AED"]).default("USD"),
  paymentMethod: z.enum(["bank", "card", "wallet"]).default("bank"),
  note: z.string().max(280).optional(),
  scheduleDate: z.string().datetime().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["weekly", "monthly"]).optional().nullable(),
});

export const orderSchema = z.object({
  symbol: z.string().min(1).max(12).transform((s) => s.toUpperCase()),
  name: z.string().max(120).optional().default(""),
  shares: z.coerce.number().positive("Shares must be greater than 0."),
  price: z.coerce.number().positive("Price must be greater than 0."),
});

// Card: we only ever accept a Stripe token + safe display fields.
// The raw PAN/CVV never touch our server.
export const addCardSchema = z.object({
  paymentMethodId: z.string().min(1, "A Stripe paymentMethodId is required."),
  cardName: z.string().min(1).max(120),
});

export const contributeSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0."),
});

export type SendMoneyInput = z.infer<typeof sendMoneySchema>;
export type OrderInput = z.infer<typeof orderSchema>;

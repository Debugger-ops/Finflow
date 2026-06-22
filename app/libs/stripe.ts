// app/libs/stripe.ts
// Stripe client used to tokenize cards. We NEVER store raw PAN/CVV; the client
// collects card details with Stripe.js / Elements and sends us only a
// PaymentMethod id, which we attach and persist (token + last4 + brand).
import Stripe from "stripe";
import { env } from "./env";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion })
  : null;

export const isStripeEnabled = stripe !== null;

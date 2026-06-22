/**
 * scripts/seed.mjs — populate a demo account with realistic fintech data.
 *
 * Run:  node scripts/seed.mjs [email]
 * Default email: demo@finflow.app   |   Password: Demo@1234
 *
 * Idempotent: wipes and re-creates the demo user's data each run. Self-contained
 * (writes raw documents via the Mongo driver) so it needs no TS build step.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Load MONGODB_URI from .env.local (or process.env) ---
function loadEnv() {
  const file = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI not set (.env.local). Aborting.");
  process.exit(1);
}

const email = (process.argv[2] || "demo@finflow.app").toLowerCase();
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);
const r2 = (n) => Math.round(n * 100) / 100;

async function main() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  console.log("Connected. Seeding demo user:", email);

  const users = db.collection("users");
  const hashed = await bcrypt.hash("Demo@1234", 12);

  // Upsert the user with a realistic cash balance + profile.
  await users.updateOne(
    { email },
    {
      $set: {
        name: "Demo User",
        email,
        password: hashed,
        balance: 8450.75,
        bio: "FinFlow demo account",
        phone: "+1 415 555 0142",
        location: "San Francisco, CA",
        occupation: "Product Designer",
        website: "https://finflow.app",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: daysAgo(180) },
    },
    { upsert: true },
  );
  const user = await users.findOne({ email });
  const uid = user._id;
  const uidStr = uid.toString();

  // Clear any previous demo data for a clean, idempotent reseed.
  const collections = ["transactions", "holdings", "cards", "activities", "orders", "usersettings", "sessions"];
  await Promise.all(
    collections.map((c) =>
      db.collection(c).deleteMany({ $or: [{ userId: uidStr }, { user: uid }, { sender: uid }] }),
    ),
  );

  // --- Holdings (cost basis; live P/L is computed at read time) ---
  const holdings = [
    { symbol: "AAPL", name: "Apple Inc.", assetType: "stock", shares: 12, avgCost: 178.4 },
    { symbol: "MSFT", name: "Microsoft Corp.", assetType: "stock", shares: 6, avgCost: 372.1 },
    { symbol: "NVDA", name: "NVIDIA Corp.", assetType: "stock", shares: 8, avgCost: 118.25 },
    { symbol: "TSLA", name: "Tesla Inc.", assetType: "stock", shares: 5, avgCost: 242.0 },
    { symbol: "VOO", name: "Vanguard S&P 500 ETF", assetType: "etf", shares: 10, avgCost: 410.6 },
  ];
  await db.collection("holdings").insertMany(
    holdings.map((h) => ({ userId: uidStr, ...h, createdAt: daysAgo(90), updatedAt: new Date() })),
  );

  // --- Orders matching the holdings ---
  await db.collection("orders").insertMany(
    holdings.map((h, i) => ({
      userId: uidStr,
      type: "buy",
      symbol: h.symbol,
      name: h.name,
      shares: h.shares,
      price: h.avgCost,
      total: r2(h.shares * h.avgCost),
      status: "completed",
      createdAt: daysAgo(90 - i * 5),
    })),
  );

  // --- Transactions (categorized, varied dates, in + out) ---
  const txTemplates = [
    { recipientEmail: "salary@acme.co", amount: 4200, category: "income", out: false, note: "Monthly salary", d: 28 },
    { recipientEmail: "landlord@rentco.com", amount: 1850, category: "bills", out: true, note: "Rent", d: 27 },
    { recipientEmail: "wholefoods.com", amount: 142.36, category: "food", out: true, note: "Groceries", d: 24 },
    { recipientEmail: "uber.com", amount: 28.9, category: "transport", out: true, note: "Ride", d: 22 },
    { recipientEmail: "netflix.com", amount: 15.99, category: "entertainment", out: true, note: "Subscription", d: 20 },
    { recipientEmail: "amazon.com", amount: 89.99, category: "shopping", out: true, note: "Order", d: 18 },
    { recipientEmail: "alex@friend.com", amount: 60, category: "transfer", out: false, note: "Dinner split", d: 15 },
    { recipientEmail: "pgande.com", amount: 124.5, category: "bills", out: true, note: "Electricity", d: 12 },
    { recipientEmail: "starbucks.com", amount: 6.75, category: "food", out: true, note: "Coffee", d: 9 },
    { recipientEmail: "sam@colleague.com", amount: 200, category: "transfer", out: true, note: "Loan repay", d: 6 },
    { recipientEmail: "spotify.com", amount: 11.99, category: "entertainment", out: true, note: "Premium", d: 4 },
    { recipientEmail: "lyft.com", amount: 19.4, category: "transport", out: true, note: "Ride", d: 2 },
  ];
  await db.collection("transactions").insertMany(
    txTemplates.map((t) => ({
      sender: t.out ? uid : null,
      recipient: t.out ? null : uid,
      recipientEmail: t.recipientEmail,
      amount: t.amount,
      fee: 0,
      currency: "USD",
      note: t.note,
      paymentMethod: "bank",
      category: t.category,
      status: "completed",
      processedAt: daysAgo(t.d),
      isRecurring: false,
      createdAt: daysAgo(t.d),
      updatedAt: daysAgo(t.d),
    })),
  );
  // One upcoming scheduled transfer.
  await db.collection("transactions").insertOne({
    sender: uid,
    recipient: null,
    recipientEmail: "savings@goal.com",
    amount: 300,
    fee: 0,
    currency: "USD",
    note: "Auto-savings",
    paymentMethod: "bank",
    category: "transfer",
    status: "pending",
    scheduledAt: daysAgo(-3),
    isRecurring: true,
    recurringFrequency: "monthly",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // --- Cards (tokenized display fields only) ---
  await db.collection("cards").insertMany([
    {
      user: uid, cardName: "Demo User", stripePaymentMethodId: "pm_demo_visa_4242",
      brand: "visa", last4: "4242", expMonth: 8, expYear: 2028,
      cardType: "debit", frozen: false, spendLimit: null, isDefault: true,
      createdAt: daysAgo(120), updatedAt: new Date(),
    },
    {
      user: uid, cardName: "Demo User", stripePaymentMethodId: "pm_demo_mc_4444",
      brand: "mastercard", last4: "4444", expMonth: 3, expYear: 2027,
      cardType: "credit", frozen: false, spendLimit: 2000, isDefault: false,
      createdAt: daysAgo(60), updatedAt: new Date(),
    },
  ]);

  // --- Activity log ---
  await db.collection("activities").insertMany([
    { userId: uidStr, action: "Signed in", device: "Chrome on MacOS", location: "San Francisco, CA", ipAddress: "73.x", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    { userId: uidStr, action: "Buy order placed", device: "Chrome on MacOS", location: "San Francisco, CA", ipAddress: "73.x", createdAt: daysAgo(6), updatedAt: daysAgo(6) },
    { userId: uidStr, action: "Card added", device: "Safari on iPhone", location: "San Francisco, CA", ipAddress: "73.x", createdAt: daysAgo(60), updatedAt: daysAgo(60) },
    { userId: uidStr, action: "Two-factor authentication enabled", device: "Chrome on MacOS", location: "San Francisco, CA", ipAddress: "73.x", createdAt: daysAgo(45), updatedAt: daysAgo(45) },
  ]);

  // --- Active sessions ---
  await db.collection("sessions").insertMany([
    { userId: uidStr, sessionToken: "demo-session-current", device: "Chrome on MacOS", location: "San Francisco, CA", ipAddress: "73.x", isActive: true, expires: daysAgo(-7), createdAt: daysAgo(1), updatedAt: new Date() },
    { userId: uidStr, sessionToken: "demo-session-phone", device: "Safari on iPhone", location: "San Francisco, CA", ipAddress: "73.x", isActive: true, expires: daysAgo(-3), createdAt: daysAgo(3), updatedAt: new Date() },
  ]);

  // --- Settings (defaults, 2FA on for realism) ---
  await db.collection("usersettings").updateOne(
    { userId: uidStr },
    {
      $set: {
        userId: uidStr,
        notifications: { emailNotifications: true, pushNotifications: true, marketingNotifications: false, securityNotifications: true, updateNotifications: true, mentionNotifications: false, commentNotifications: false },
        privacy: { profileVisibility: "private", showEmail: false, showPhone: false, showLocation: true, allowMessages: true, showActivity: true, searchable: false },
        appearance: { darkMode: true, compactView: false, fontSize: "medium", language: "en", theme: "default" },
        currency: "USD",
        twoFactorEnabled: false,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  console.log("\n✅ Seed complete.");
  console.log("   Login:", email, "/ Demo@1234");
  console.log("   Balance: $8,450.75 | Holdings:", holdings.length, "| Transactions:", txTemplates.length + 1, "| Cards: 2");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

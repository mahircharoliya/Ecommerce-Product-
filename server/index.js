/**
 * server/index.js
 * ----------------
 * Main Express server entry point.
 *
 * Endpoints:
 *   GET  /api/health                  → Health check
 *   GET  /api/payment/key             → Returns Razorpay public key
 *   POST /api/payment/create-order    → Creates Razorpay order
 *   POST /api/payment/verify          → Verifies payment signature (browser-triggered)
 *   GET  /api/payment/status/:id      → Fetch payment details
 *   POST /api/webhook/razorpay        → Razorpay webhook (server-to-server, no browser needed)
 *
 * ⚠️  IMPORTANT — Middleware order:
 *   Webhook route is mounted BEFORE express.json().
 *   Webhooks need the raw Buffer body for HMAC signature verification.
 *   express.json() parses and discards the raw body — if it runs first,
 *   webhook verification will always fail.
 */

require("dotenv").config({ path: __dirname + "/.env" });

const express       = require("express");
const cors          = require("cors");
const errorHandler  = require("./middleware/errorHandler");
const logger        = require("./middleware/logger");
const paymentRoutes = require("./routes/payment");
const webhookRoutes = require("./routes/webhook");  // NEW

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── 1. WEBHOOK ROUTE — must come before express.json() ──────────────── */
// The rawBody middleware inside webhookRoutes handles its own body parsing.
// express.json() must NOT run first on this route.
app.use("/api/webhook", webhookRoutes);

/* ── 2. Global Middleware ─────────────────────────────────────────────── */
app.use(cors({
  origin: [
    "http://localhost:5173",  // Vite dev
    "http://localhost:4173",  // Vite preview
    process.env.FRONTEND_URL, // Production
  ].filter(Boolean),
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

/* ── 3. Routes ────────────────────────────────────────────────────────── */
app.get("/api/health", (req, res) => {
  res.json({
    status   : "ok",
    timestamp: new Date().toISOString(),
    env      : process.env.NODE_ENV,
    razorpay : !!process.env.RAZORPAY_KEY_ID ? "configured" : "missing",
    webhook  : !!process.env.RAZORPAY_WEBHOOK_SECRET ? "configured" : "⚠️  missing",
  });
});

app.use("/api/payment", paymentRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

/* ── 4. Start ─────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log("\n────────────────────────────────────────");
  console.log(`🚀  Server        : http://localhost:${PORT}`);
  console.log(`🌍  Environment   : ${process.env.NODE_ENV}`);
  console.log(`💳  Razorpay      : ${process.env.RAZORPAY_KEY_ID?.slice(0, 14)}...`);
  console.log(`🪝  Webhook secret: ${process.env.RAZORPAY_WEBHOOK_SECRET ? "✅  set" : "❌  NOT SET"}`);
  console.log("────────────────────────────────────────\n");
});

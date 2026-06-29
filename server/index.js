/**
 * server/index.js
 * ----------------
 * Main Express server entry point.
 *
 * Endpoints:
 *   GET  /api/health               → Health check
 *   GET  /api/payment/key          → Returns Razorpay public key
 *   POST /api/payment/create-order → Creates Razorpay order
 *   POST /api/payment/verify       → Verifies payment signature
 *   GET  /api/payment/status/:id   → Fetch payment details
 */

require("dotenv").config({ path: __dirname + "/.env" });

const express      = require("express");
const cors         = require("cors");
const errorHandler = require("./middleware/errorHandler");
const logger       = require("./middleware/logger");
const paymentRoutes = require("./routes/payment");

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ───────────────────────────────────────────────────────── */

// CORS — allow Vite dev server (port 5173) and production frontend
app.use(cors({
  origin: [
    "http://localhost:5173",  // Vite dev
    "http://localhost:4173",  // Vite preview
    process.env.FRONTEND_URL, // Production (set in .env)
  ].filter(Boolean),
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());           // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(logger);                   // Request logging

/* ── Routes ───────────────────────────────────────────────────────────── */

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status   : "ok",
    timestamp: new Date().toISOString(),
    env      : process.env.NODE_ENV,
    razorpay : !!process.env.RAZORPAY_KEY_ID ? "configured" : "missing",
  });
});

// Payment routes
app.use("/api/payment", paymentRoutes);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

/* ── Start ────────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log("\n────────────────────────────────────────");
  console.log(`🚀  Server running at http://localhost:${PORT}`);
  console.log(`🌍  Environment : ${process.env.NODE_ENV}`);
  console.log(`💳  Razorpay   : ${process.env.RAZORPAY_KEY_ID?.slice(0, 14)}...`);
  console.log("────────────────────────────────────────\n");
});

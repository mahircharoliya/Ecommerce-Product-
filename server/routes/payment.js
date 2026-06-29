/**
 * server/routes/payment.js
 * -------------------------
 * All Razorpay payment endpoints:
 *
 *   POST /api/payment/create-order   → Creates a Razorpay order (server-side)
 *   POST /api/payment/verify         → Verifies payment signature (server-side)
 *   GET  /api/payment/key            → Returns public key ID to frontend
 *
 * WHY SERVER-SIDE ORDER CREATION?
 *   Razorpay requires the order to be created on the backend using your
 *   secret key. This prevents tampering — the amount is set by the server,
 *   not the client. The frontend only gets an order_id back.
 *
 * WHY SERVER-SIDE VERIFICATION?
 *   After payment, Razorpay sends back 3 values. We MUST verify the
 *   HMAC-SHA256 signature on the server (using the secret key) to confirm
 *   the payment is genuine and hasn't been tampered with.
 */

const express  = require("express");
const crypto   = require("crypto");
const razorpay = require("../config/razorpay");

const router = express.Router();

/* ─── GET /api/payment/key ─────────────────────────────────────────────── */
/**
 * Returns the public Razorpay Key ID to the frontend.
 * The SECRET key never leaves the server.
 */
router.get("/key", (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

/* ─── POST /api/payment/create-order ───────────────────────────────────── */
/**
 * Body: { amount: number (INR), currency?: string, receipt?: string, notes?: object }
 *
 * Creates a Razorpay Order. The `amount` from the client is trusted only
 * in this demo — in production you should re-calculate it from your own DB.
 *
 * Returns: { orderId, amount, currency, receipt }
 */
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = process.env.CURRENCY || "INR", notes = {} } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount. Must be a positive number." });
    }

    // Razorpay expects amount in PAISE (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    // Unique receipt ID for tracking
    const receipt = `receipt_${Date.now()}`;

    const orderOptions = {
      amount  : amountInPaise,
      currency,
      receipt,
      notes,
      payment_capture: 1, // Auto-capture payment (no manual capture needed)
    };

    // Create order via Razorpay API (uses your secret key internally)
    const order = await razorpay.orders.create(orderOptions);

    console.log(`✅  Order created: ${order.id} | ₹${amount} | Receipt: ${receipt}`);

    res.status(201).json({
      success  : true,
      orderId  : order.id,
      amount   : order.amount,      // in paise
      currency : order.currency,
      receipt  : order.receipt,
    });

  } catch (err) {
    console.error("❌  Order creation failed:", err);
    res.status(500).json({
      error  : "Failed to create payment order",
      details: err.message,
    });
  }
});

/* ─── POST /api/payment/verify ─────────────────────────────────────────── */
/**
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Verifies the HMAC-SHA256 signature that Razorpay sends after payment.
 *
 * Verification formula (from Razorpay docs):
 *   generated_signature = HMAC_SHA256(
 *     razorpay_order_id + "|" + razorpay_payment_id,
 *     key_secret
 *   )
 *   isValid = (generated_signature === razorpay_signature)
 *
 * Returns: { success: true, paymentId, orderId, message }
 */
router.post("/verify", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // All three fields are required
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification fields" });
    }

    // Build the expected signature
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(razorpay_signature)
    );

    if (!isValid) {
      console.warn(`⚠️  Signature mismatch for order ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        error  : "Payment verification failed — invalid signature",
      });
    }

    console.log(`✅  Payment verified: ${razorpay_payment_id} for order ${razorpay_order_id}`);

    // ── Here you would: ──────────────────────────────────────────────────
    // 1. Save the order to your database
    // 2. Update inventory / stock
    // 3. Send confirmation email
    // 4. Trigger fulfilment workflow
    // ─────────────────────────────────────────────────────────────────────

    res.json({
      success  : true,
      paymentId: razorpay_payment_id,
      orderId  : razorpay_order_id,
      message  : "Payment verified successfully",
    });

  } catch (err) {
    console.error("❌  Verification error:", err);
    res.status(500).json({
      error  : "Payment verification failed",
      details: err.message,
    });
  }
});

/* ─── GET /api/payment/status/:paymentId ───────────────────────────────── */
/**
 * Fetch payment details directly from Razorpay.
 * Useful for confirming payment status on the success page.
 */
router.get("/status/:paymentId", async (req, res) => {
  try {
    const payment = await razorpay.payments.fetch(req.params.paymentId);
    res.json({
      success: true,
      payment: {
        id      : payment.id,
        amount  : payment.amount / 100, // convert paise → INR
        currency: payment.currency,
        status  : payment.status,
        method  : payment.method,
        email   : payment.email,
        contact : payment.contact,
        createdAt: new Date(payment.created_at * 1000).toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payment status", details: err.message });
  }
});

module.exports = router;

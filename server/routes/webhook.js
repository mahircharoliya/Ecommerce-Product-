/**
 * server/routes/webhook.js
 * -------------------------
 * Razorpay Webhook endpoint: POST /api/webhook/razorpay
 *
 * WHY WEBHOOKS EXIST (vs the /verify endpoint):
 *   /api/payment/verify  — called by the USER'S BROWSER after payment
 *                          ❌ Fails if user closes tab, loses internet, etc.
 *
 *   /api/webhook/razorpay — called by RAZORPAY'S SERVER after payment
 *                           ✅ Always fires, regardless of browser state
 *
 * HOW IT WORKS:
 *   1. Razorpay sends a POST request to this endpoint with event data
 *   2. We verify the X-Razorpay-Signature header using HMAC-SHA256
 *      (same pattern as /verify, but using RAZORPAY_WEBHOOK_SECRET not KEY_SECRET)
 *   3. We check the event type and react accordingly
 *
 * SETUP IN RAZORPAY DASHBOARD:
 *   Dashboard → Settings → Webhooks → Add New Webhook
 *   URL: https://your-domain.com/api/webhook/razorpay
 *   Secret: (generate a strong random string, put in RAZORPAY_WEBHOOK_SECRET)
 *   Events to subscribe:
 *     ✓ payment.captured
 *     ✓ payment.failed
 *     ✓ order.paid
 *     ✓ refund.created  (optional)
 *
 * LOCAL TESTING:
 *   Use ngrok to expose localhost to the internet:
 *   ngrok http 5000
 *   Then use the ngrok URL in the Razorpay dashboard webhook config.
 */

const express = require("express");
const crypto  = require("crypto");
const rawBody = require("../middleware/rawBody");

const router = express.Router();

/* ─── Signature Verification Helper ───────────────────────────────────── */
/**
 * Verifies the X-Razorpay-Signature header.
 *
 * Razorpay signs webhook payloads using:
 *   HMAC_SHA256(rawBody, WEBHOOK_SECRET)
 *
 * This is DIFFERENT from the payment verify endpoint which uses:
 *   HMAC_SHA256(orderId + "|" + paymentId, KEY_SECRET)
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not set in server/.env");
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  // timingSafeEqual prevents timing-based attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

/* ─── Event Handlers ───────────────────────────────────────────────────── */
/**
 * Each handler receives the full Razorpay event payload.
 * Add your real business logic here — DB updates, emails, etc.
 */

async function handlePaymentCaptured(payload) {
  const payment = payload.payment.entity;

  console.log(`\n💰  Payment captured`);
  console.log(`    ID       : ${payment.id}`);
  console.log(`    Order ID : ${payment.order_id}`);
  console.log(`    Amount   : ₹${payment.amount / 100}`);
  console.log(`    Email    : ${payment.email}`);
  console.log(`    Method   : ${payment.method}`);

  // ── TODO: Add your real logic here ───────────────────────────────────
  // await db.orders.update({ razorpayOrderId: payment.order_id }, {
  //   status    : "paid",
  //   paymentId : payment.id,
  //   paidAt    : new Date(),
  // });
  // await emailService.sendConfirmation(payment.email, payment.order_id);
  // await inventoryService.decrementStock(payment.order_id);
  // ─────────────────────────────────────────────────────────────────────
}

async function handlePaymentFailed(payload) {
  const payment = payload.payment.entity;

  console.log(`\n❌  Payment failed`);
  console.log(`    ID       : ${payment.id}`);
  console.log(`    Order ID : ${payment.order_id}`);
  console.log(`    Reason   : ${payment.error_description}`);

  // ── TODO: Add your real logic here ───────────────────────────────────
  // await db.orders.update({ razorpayOrderId: payment.order_id }, {
  //   status : "failed",
  //   failureReason: payment.error_description,
  // });
  // await emailService.sendPaymentFailedNotice(payment.email);
  // ─────────────────────────────────────────────────────────────────────
}

async function handleOrderPaid(payload) {
  const order = payload.order.entity;

  console.log(`\n✅  Order paid`);
  console.log(`    Order ID : ${order.id}`);
  console.log(`    Amount   : ₹${order.amount / 100}`);
  console.log(`    Receipt  : ${order.receipt}`);

  // ── TODO: Add your real logic here ───────────────────────────────────
  // await db.orders.update({ razorpayOrderId: order.id }, { status: "paid" });
  // await fulfillmentService.startProcessing(order.receipt);
  // ─────────────────────────────────────────────────────────────────────
}

async function handleRefundCreated(payload) {
  const refund = payload.refund.entity;

  console.log(`\n↩️   Refund created`);
  console.log(`    Refund ID  : ${refund.id}`);
  console.log(`    Payment ID : ${refund.payment_id}`);
  console.log(`    Amount     : ₹${refund.amount / 100}`);

  // ── TODO: Add your real logic here ───────────────────────────────────
  // await db.orders.update({ paymentId: refund.payment_id }, { status: "refunded" });
  // await emailService.sendRefundConfirmation(refund.payment_id);
  // ─────────────────────────────────────────────────────────────────────
}

/* ─── POST /api/webhook/razorpay ──────────────────────────────────────── */
/**
 * IMPORTANT: This route uses the rawBody middleware (defined above),
 * NOT express.json() — we need the raw buffer to verify the signature.
 */
router.post("/razorpay", rawBody, async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  // 1. Reject if signature header is missing
  if (!signature) {
    console.warn("⚠️  Webhook received without signature header");
    return res.status(400).json({ error: "Missing X-Razorpay-Signature header" });
  }

  // 2. Verify the signature
  let isValid;
  try {
    isValid = verifyWebhookSignature(req.rawBody, signature);
  } catch (err) {
    console.error("❌  Webhook signature error:", err.message);
    return res.status(500).json({ error: err.message });
  }

  if (!isValid) {
    console.warn("⚠️  Webhook signature verification FAILED — possible forgery attempt");
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  // 3. Acknowledge receipt immediately (Razorpay expects 200 within 5 seconds)
  //    Do this BEFORE processing — processing might be slow
  res.status(200).json({ received: true });

  // 4. Process the event asynchronously (after responding)
  const event   = req.body.event;
  const payload = req.body.payload;

  console.log(`\n📨  Webhook received: ${event}`);

  try {
    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload);
        break;

      case "order.paid":
        await handleOrderPaid(payload);
        break;

      case "refund.created":
        await handleRefundCreated(payload);
        break;

      default:
        console.log(`   ℹ️  Unhandled event type: ${event} — ignoring`);
    }
  } catch (err) {
    // Log but don't respond again — we already sent 200
    console.error(`❌  Error processing webhook event "${event}":`, err.message);
  }
});

module.exports = router;

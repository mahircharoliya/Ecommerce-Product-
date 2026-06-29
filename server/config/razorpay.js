/**
 * server/config/razorpay.js
 * --------------------------
 * Initializes the Razorpay SDK with credentials from .env
 * and exports a single instance used across all routes.
 */

const Razorpay = require("razorpay");

// Validate required env vars at startup
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌  Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in server/.env");
  process.exit(1);
}

const razorpayInstance = new Razorpay({
  key_id    : process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;

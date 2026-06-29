/**
 * services/razorpayService.js
 * ----------------------------
 * All Razorpay integration logic lives here — completely decoupled
 * from UI components. Components call initiatePayment() and await
 * a result; they never touch the Razorpay SDK directly.
 *
 * HOW RAZORPAY WORKS (frontend flow):
 *   1. Your backend creates an Order → returns { id, amount, currency }
 *   2. Frontend opens the Razorpay checkout modal with that order
 *   3. User pays → Razorpay calls handler({ razorpay_payment_id, ... })
 *   4. You verify the signature on your backend (skipped in this demo)
 *
 * ⚠️  DEMO MODE:
 *   Because this is a frontend-only project with no real backend,
 *   we simulate step 1 (order creation) locally and use Razorpay's
 *   TEST KEY. Replace RAZORPAY_KEY_ID with your real key and wire
 *   createOrder() to your actual backend endpoint before going live.
 */

// ─── Config ────────────────────────────────────────────────────────────────
// Replace with your real Razorpay Test Key ID from https://dashboard.razorpay.com
// Set VITE_RAZORPAY_KEY_ID in your .env file
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_YourKeyHere";

// ─── Load the Razorpay JS SDK dynamically ──────────────────────────────────
/**
 * Injects the Razorpay checkout.js script once and resolves when ready.
 * Safe to call multiple times — subsequent calls resolve immediately.
 */
export function loadRazorpaySDK() {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload  = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

// ─── Simulate order creation (replace with real API call) ──────────────────
/**
 * In production this calls your backend:
 *   POST /api/orders  →  { id, amount, currency }
 *
 * Here we generate a fake order ID so the demo runs without a server.
 *
 * @param {number} amountINR  - Total in Indian Rupees
 * @returns {Promise<{ id: string, amount: number, currency: string }>}
 */
async function createOrder(amountINR) {
  // Simulated network delay (remove in production)
  await new Promise(r => setTimeout(r, 600));

  return {
    id       : `order_demo_${Date.now()}`,   // real backend returns rzp order id
    amount   : Math.round(amountINR * 100),  // Razorpay expects paise
    currency : "INR",
  };
}

// ─── Main entry point ───────────────────────────────────────────────────────
/**
 * initiatePayment
 * ---------------
 * Loads the SDK, creates an order, opens the Razorpay modal, and
 * returns a resolved/rejected promise based on the user's action.
 *
 * @param {{ amount: number, cartItems: Array, customerName?: string, customerEmail?: string }} options
 * @returns {Promise<{ razorpay_payment_id, razorpay_order_id, razorpay_signature }>}
 */
export async function initiatePayment({ amount, cartItems, customerName = "", customerEmail = "" }) {
  // 1. Ensure SDK is available
  await loadRazorpaySDK();

  // 2. Create order (simulated; replace with real backend call)
  const order = await createOrder(amount);

  // 3. Build Razorpay options
  const options = {
    key         : RAZORPAY_KEY_ID,
    amount      : order.amount,
    currency    : order.currency,
    name        : "Product Explorer",
    description : `${cartItems.length} item${cartItems.length > 1 ? "s" : ""}`,
    order_id    : order.id,
    image       : "", // optional logo URL

    prefill: {
      name  : customerName,
      email : customerEmail,
    },

    notes: {
      items: cartItems.map(i => `${i.product.title} × ${i.qty}`).join(", "),
    },

    theme: {
      color: "#3b82f6",  // matches our UI accent
    },

    // 4. Success handler — Razorpay calls this after successful payment
    handler(response) {
      // `response` contains razorpay_payment_id, razorpay_order_id, razorpay_signature
      // In production: send these to your backend for signature verification
      return response; // promise chain catches this via the wrapper below
    },
  };

  // 5. Wrap the modal in a Promise so callers can await it
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler(response) {
        resolve({
          ...response,
          orderId: order.id,
          amount : order.amount,
        });
      },
    });

    // Razorpay fires this when the modal is dismissed without payment
    rzp.on("payment.failed", err => {
      reject(new Error(err.error?.description ?? "Payment failed"));
    });

    rzp.open();
  });
}

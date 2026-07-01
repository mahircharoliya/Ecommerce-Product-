/**
 * src/services/razorpayService.js
 * --------------------------------
 * Frontend Razorpay service — talks to our Express backend.
 *
 * FLOW:
 *   1. GET  /api/payment/key          → fetch Razorpay public Key ID
 *   2. POST /api/payment/create-order → backend creates order with secret key
 *   3. Open Razorpay checkout modal   → user pays
 *   4. POST /api/payment/verify       → backend verifies HMAC signature
 *   5. Return verified result to CartDrawer
 *
 * Nothing sensitive (secret key, signature logic) is on the frontend.
 */

const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;

/* ─── Load Razorpay checkout.js SDK ────────────────────────────────────── */
/**
 * Injects the Razorpay <script> once; resolves immediately if already loaded.
 */
export function loadRazorpaySDK() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(
        new Error(
          "Failed to load Razorpay SDK. Check your internet connection.",
        ),
      );
    document.body.appendChild(script);
  });
}

/* ─── Step 1: Fetch Key ID from backend ────────────────────────────────── */
async function fetchKeyId() {
  const res = await fetch(`${SERVER_URL}/api/payment/key`);
  if (!res.ok) throw new Error("Could not fetch Razorpay Key from server");
  const { keyId } = await res.json();
  return keyId;
}

/* ─── Step 2: Create order on backend ──────────────────────────────────── */
/**
 * Calls POST /api/payment/create-order
 * Returns { orderId, amount, currency, receipt }
 */
async function createOrder({ amount, notes = {} }) {
  const res = await fetch(`${SERVER_URL}/api/payment/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, notes }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to create payment order");
  return data;
}

/* ─── Step 3: Open Razorpay modal ──────────────────────────────────────── */
/**
 * Returns a Promise that resolves with Razorpay's payment response
 * or rejects if the user closes the modal or payment fails.
 */
function openRazorpayModal({
  keyId,
  order,
  cartItems,
  customerName,
  customerEmail,
}) {
  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: order.amount, // in paise (set by backend)
      currency: order.currency,
      name: "Product Explorer",
      description: `${cartItems.length} item${cartItems.length > 1 ? "s" : ""}`,
      order_id: order.orderId, // from backend

      prefill: {
        name: customerName || "",
        email: customerEmail || "",
      },

      notes: {
        items: cartItems.map((i) => `${i.product.title} × ${i.qty}`).join(", "),
      },

      theme: { color: "#3b82f6" },

      // Called by Razorpay on successful payment
      handler(response) {
        resolve(response);
      },

      modal: {
        // Called when user closes the modal without paying
        ondismiss() {
          reject(new Error("Payment cancelled by user"));
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (err) => {
      reject(new Error(err.error?.description ?? "Payment failed"));
    });

    rzp.open();
  });
}

/* ─── Step 4: Verify payment signature on backend ──────────────────────── */
/**
 * Calls POST /api/payment/verify
 * Backend re-creates the HMAC-SHA256 signature and compares.
 * Returns { success, paymentId, orderId, message }
 */
async function verifyPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  const res = await fetch(`${SERVER_URL}/api/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Payment verification failed");
  }

  return data;
}

/* ─── Main entry point (called from CartDrawer) ─────────────────────────── */
/**
 * initiatePayment
 * ---------------
 * Orchestrates the full 4-step Razorpay payment flow.
 *
 * @param {{ amount, cartItems, customerName, customerEmail }} options
 * @returns {Promise<{ success, paymentId, orderId, amount, message }>}
 */
export async function initiatePayment({
  amount,
  cartItems,
  customerName = "",
  customerEmail = "",
}) {
  // Step 1 & SDK load — run in parallel for speed
  const [, keyId] = await Promise.all([loadRazorpaySDK(), fetchKeyId()]);

  // Step 2 — create order on backend
  const order = await createOrder({
    amount,
    notes: {
      items: cartItems.map((i) => `${i.product.title} × ${i.qty}`).join(", "),
    },
  });

  // Step 3 — open Razorpay modal, wait for user
  const paymentResponse = await openRazorpayModal({
    keyId,
    order,
    cartItems,
    customerName,
    customerEmail,
  });

  // Step 4 — verify signature on backend
  const verified = await verifyPayment({
    razorpay_order_id: paymentResponse.razorpay_order_id,
    razorpay_payment_id: paymentResponse.razorpay_payment_id,
    razorpay_signature: paymentResponse.razorpay_signature,
  });

  return {
    ...verified,
    amount,
    orderId: order.orderId,
    paymentId: paymentResponse.razorpay_payment_id,
  };
}

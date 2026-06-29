/**
 * components/CartDrawer.jsx
 * --------------------------
 * Slide-in cart sidebar with:
 *   - Item list with qty controls
 *   - Customer details form (name + email) before checkout
 *   - Real Razorpay payment via backend
 *   - Success screen showing order + payment IDs
 */

import { useState } from "react";
import useCartStore from "../store/useCartStore";
import { initiatePayment } from "../services/razorpayService";
import styles from "./CartDrawer.module.css";

export default function CartDrawer({ isOpen, onClose }) {
  // Zustand store
  const items          = useCartStore(s => s.items);
  const checkoutStatus = useCartStore(s => s.checkoutStatus);
  const checkoutError  = useCartStore(s => s.checkoutError);
  const lastOrder      = useCartStore(s => s.lastOrder);
  const removeFromCart = useCartStore(s => s.removeFromCart);
  const updateQty      = useCartStore(s => s.updateQty);
  const clearCart      = useCartStore(s => s.clearCart);
  const setStatus      = useCartStore(s => s.setCheckoutStatus);
  const setLastOrder   = useCartStore(s => s.setLastOrder);

  // Local form state
  const [customerName,  setCustomerName]  = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [formError,     setFormError]     = useState("");

  // Derived totals
  const totalAmount = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const totalItems  = items.reduce((sum, i) => sum + i.qty, 0);

  /* ── Validate form ─────────────────────────────────────── */
  function validateForm() {
    if (!customerName.trim()) {
      setFormError("Please enter your name");
      return false;
    }
    if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setFormError("Please enter a valid email address");
      return false;
    }
    setFormError("");
    return true;
  }

  /* ── Checkout handler ──────────────────────────────────── */
  async function handleCheckout() {
    if (items.length === 0) return;
    if (!validateForm()) return;

    setStatus("processing");

    try {
      const result = await initiatePayment({
        amount       : totalAmount,
        cartItems    : items,
        customerName : customerName.trim(),
        customerEmail: customerEmail.trim(),
      });

      // Backend verified payment ✅
      setLastOrder({
        orderId  : result.orderId,
        paymentId: result.paymentId,
        amount   : totalAmount,
        items    : [...items],
        message  : result.message,
      });
      clearCart();
      setCustomerName("");
      setCustomerEmail("");
      setStatus("success");

    } catch (err) {
      if (err.message === "Payment cancelled by user") {
        setStatus("idle");
      } else {
        setStatus("error", err.message ?? "Payment failed. Please try again.");
      }
    }
  }

  function handleReset() {
    setStatus("idle");
  }

  /* ── Render ────────────────────────────────────────────── */
  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ""}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Cart
            {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">×</button>
        </div>

        {/* ── Success screen ── */}
        {checkoutStatus === "success" && lastOrder && (
          <div className={styles.successScreen}>
            <div className={styles.successIcon}>✓</div>
            <h3 className={styles.successTitle}>Payment Successful!</h3>
            <p className={styles.successDetail}>
              Order <span className={styles.mono}>{lastOrder.orderId}</span>
            </p>
            {lastOrder.paymentId && (
              <p className={styles.successDetail}>
                Payment <span className={styles.mono}>{lastOrder.paymentId}</span>
              </p>
            )}
            <p className={styles.successAmount}>₹{lastOrder.amount.toFixed(2)} paid</p>
            <div className={styles.successItems}>
              {lastOrder.items.map(i => (
                <div key={i.product.id} className={styles.successItem}>
                  <span>{i.product.title}</span>
                  <span>× {i.qty}</span>
                </div>
              ))}
            </div>
            <button className={styles.resetBtn} onClick={() => { handleReset(); onClose(); }}>
              Continue Shopping
            </button>
          </div>
        )}

        {/* ── Normal cart view ── */}
        {checkoutStatus !== "success" && (
          <>
            {/* Empty state */}
            {items.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🛒</span>
                <p>Your cart is empty</p>
                <p className={styles.emptyHint}>Add products from the table</p>
              </div>
            )}

            {/* Item list */}
            {items.length > 0 && (
              <>
                <ul className={styles.itemList}>
                  {items.map(({ product, qty }) => (
                    <li key={product.id} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemTitle}>{product.title}</p>
                        <p className={styles.itemPrice}>
                          ₹{(product.price * qty).toFixed(2)}
                          <span className={styles.itemUnit}> (₹{product.price} each)</span>
                        </p>
                      </div>
                      <div className={styles.itemControls}>
                        <button className={styles.qtyBtn} onClick={() => updateQty(product.id, qty - 1)}>−</button>
                        <span className={styles.qty}>{qty}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQty(product.id, qty + 1)}>+</button>
                        <button className={styles.removeBtn} onClick={() => removeFromCart(product.id)}>🗑</button>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Customer details form */}
                <div className={styles.customerForm}>
                  <p className={styles.formTitle}>Your Details</p>

                  <label className={styles.formLabel}>
                    <span>Name</span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={customerName}
                      onChange={e => { setCustomerName(e.target.value); setFormError(""); }}
                      className={styles.formInput}
                      disabled={checkoutStatus === "processing"}
                    />
                  </label>

                  <label className={styles.formLabel}>
                    <span>Email</span>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={customerEmail}
                      onChange={e => { setCustomerEmail(e.target.value); setFormError(""); }}
                      className={styles.formInput}
                      disabled={checkoutStatus === "processing"}
                    />
                  </label>

                  {formError && (
                    <p className={styles.formError}>⚠ {formError}</p>
                  )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                  {/* Backend error banner */}
                  {checkoutStatus === "error" && checkoutError && (
                    <div className={styles.errorBanner}>
                      ⚠ {checkoutError}
                      <button className={styles.errorDismiss} onClick={handleReset}>✕</button>
                    </div>
                  )}

                  <div className={styles.total}>
                    <span>Total ({totalItems} item{totalItems > 1 ? "s" : ""})</span>
                    <span className={styles.totalAmount}>₹{totalAmount.toFixed(2)}</span>
                  </div>

                  <button
                    className={styles.checkoutBtn}
                    onClick={handleCheckout}
                    disabled={checkoutStatus === "processing"}
                  >
                    {checkoutStatus === "processing" ? (
                      <><span className={styles.btnSpinner} /> Processing…</>
                    ) : (
                      "Pay with Razorpay"
                    )}
                  </button>

                  <button className={styles.clearBtn} onClick={clearCart}>
                    Clear cart
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </aside>
    </>
  );
}

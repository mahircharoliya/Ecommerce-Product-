/**
 * components/CartDrawer.jsx
 * --------------------------
 * Slide-in cart sidebar — fully powered by Redux.
 *
 * REDUX THUNK USAGE:
 *   dispatch(processCheckout({ items, totalAmount, customerName, customerEmail }))
 *   The thunk calls razorpayService, then dispatches fulfilled/rejected
 *   automatically — this component only reacts to resulting state.
 */

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectCheckoutStatus,
  selectCheckoutError,
  selectLastOrder,
  selectTotalItems,
  selectTotalAmount,
  removeFromCart,
  updateQty,
  clearCart,
  resetCheckout,
  processCheckout,  // ← Redux Thunk
} from "../store/slices/cartSlice";
import styles from "./CartDrawer.module.css";

export default function CartDrawer({ isOpen, onClose }) {
  const dispatch = useDispatch();

  // Redux selectors
  const items          = useSelector(selectCartItems);
  const checkoutStatus = useSelector(selectCheckoutStatus);
  const checkoutError  = useSelector(selectCheckoutError);
  const lastOrder      = useSelector(selectLastOrder);
  const totalItems     = useSelector(selectTotalItems);
  const totalAmount    = useSelector(selectTotalAmount);

  // Local form state (UI only, no need for Redux)
  const [customerName,  setCustomerName]  = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [formError,     setFormError]     = useState("");

  /* ── Form validation ─────────────────────────────────────── */
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

  /* ── Dispatch the checkout thunk ─────────────────────────── */
  function handleCheckout() {
    if (items.length === 0 || !validateForm()) return;

    // Redux Thunk: dispatching processCheckout returns a Promise
    // The thunk handles pending → fulfilled/rejected internally
    dispatch(processCheckout({
      items,
      totalAmount,
      customerName : customerName.trim(),
      customerEmail: customerEmail.trim(),
    })).then(result => {
      // If fulfilled, clear local form
      if (processCheckout.fulfilled.match(result)) {
        setCustomerName("");
        setCustomerEmail("");
      }
    });
  }

  /* ── Render ──────────────────────────────────────────────── */
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
            <button
              className={styles.resetBtn}
              onClick={() => { dispatch(resetCheckout()); onClose(); }}
            >
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
                        <button
                          className={styles.qtyBtn}
                          onClick={() => dispatch(updateQty({ productId: product.id, qty: qty - 1 }))}
                        >−</button>
                        <span className={styles.qty}>{qty}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => dispatch(updateQty({ productId: product.id, qty: qty + 1 }))}
                        >+</button>
                        <button
                          className={styles.removeBtn}
                          onClick={() => dispatch(removeFromCart(product.id))}
                        >🗑</button>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Customer form */}
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
                  {formError && <p className={styles.formError}>⚠ {formError}</p>}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                  {checkoutStatus === "failed" && checkoutError && (
                    <div className={styles.errorBanner}>
                      ⚠ {checkoutError}
                      <button
                        className={styles.errorDismiss}
                        onClick={() => dispatch(resetCheckout())}
                      >✕</button>
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
                    {checkoutStatus === "processing"
                      ? <><span className={styles.btnSpinner} /> Processing…</>
                      : "Pay with Razorpay"
                    }
                  </button>

                  <button
                    className={styles.clearBtn}
                    onClick={() => dispatch(clearCart())}
                  >
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

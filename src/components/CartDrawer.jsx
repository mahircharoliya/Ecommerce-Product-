/**
 * components/CartDrawer.jsx
 * --------------------------
 * Slide-in sidebar showing cart items, quantities, totals,
 * and the Checkout button. All state comes from Zustand.
 */

import useCartStore from "../store/useCartStore";
import { initiatePayment } from "../services/razorpayService";
import styles from "./CartDrawer.module.css";

export default function CartDrawer({ isOpen, onClose }) {
  // Pull everything we need from the Zustand store
  const items          = useCartStore(s => s.items);
  const checkoutStatus = useCartStore(s => s.checkoutStatus);
  const checkoutError  = useCartStore(s => s.checkoutError);
  const lastOrder      = useCartStore(s => s.lastOrder);
  const removeFromCart = useCartStore(s => s.removeFromCart);
  const updateQty      = useCartStore(s => s.updateQty);
  const clearCart      = useCartStore(s => s.clearCart);
  const setStatus      = useCartStore(s => s.setCheckoutStatus);
  const setLastOrder   = useCartStore(s => s.setLastOrder);

  // Compute totals inline (derived from store, no extra state)
  const totalAmount = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const totalItems  = items.reduce((sum, i) => sum + i.qty, 0);

  /* ── Checkout handler ─────────────────────────────────────────── */
  async function handleCheckout() {
    if (items.length === 0) return;

    setStatus("processing");

    try {
      const result = await initiatePayment({
        amount    : totalAmount,
        cartItems : items,
        customerName  : "John Doe",    // replace with a real form
        customerEmail : "john@example.com",
      });

      // Payment succeeded
      setLastOrder({
        orderId : result.orderId,
        paymentId: result.razorpay_payment_id,
        amount  : totalAmount,
        items   : [...items],
      });
      clearCart();
      setStatus("success");
    } catch (err) {
      setStatus("error", err.message ?? "Payment failed. Please try again.");
    }
  }

  function handleReset() {
    setStatus("idle");
  }

  /* ── Render ───────────────────────────────────────────────────── */
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
            {totalItems > 0 && (
              <span className={styles.badge}>{totalItems}</span>
            )}
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
                Payment ID <span className={styles.mono}>{lastOrder.paymentId}</span>
              </p>
            )}
            <p className={styles.successAmount}>
              ₹{lastOrder.amount.toFixed(2)} paid
            </p>
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

        {/* ── Normal cart ── */}
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
                        onClick={() => updateQty(product.id, qty - 1)}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span className={styles.qty}>{qty}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQty(product.id, qty + 1)}
                        aria-label="Increase quantity"
                      >+</button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeFromCart(product.id)}
                        aria-label="Remove item"
                      >🗑</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className={styles.footer}>
                {/* Error banner */}
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
                    <span className={styles.btnSpinner} />
                  ) : (
                    "Pay with Razorpay"
                  )}
                </button>

                <button className={styles.clearBtn} onClick={clearCart}>
                  Clear cart
                </button>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}

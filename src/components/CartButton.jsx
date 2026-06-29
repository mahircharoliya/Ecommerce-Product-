/**
 * components/CartButton.jsx
 * --------------------------
 * Floating cart icon shown in the header.
 * Reads item count directly from Zustand — no props needed.
 */

import useCartStore from "../store/useCartStore";
import styles from "./CartButton.module.css";

export default function CartButton({ onClick }) {
  const items      = useCartStore(s => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <button className={styles.btn} onClick={onClick} aria-label="Open cart">
      <span className={styles.icon}>🛒</span>
      <span className={styles.label}>Cart</span>
      {totalItems > 0 && (
        <span className={styles.badge}>{totalItems > 99 ? "99+" : totalItems}</span>
      )}
    </button>
  );
}

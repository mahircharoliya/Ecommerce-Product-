/**
 * components/CartButton.jsx
 * --------------------------
 * Reads cart item count from Redux store (not Zustand).
 */

import { useSelector } from "react-redux";
import { selectTotalItems } from "../store/slices/cartSlice";
import styles from "./CartButton.module.css";

export default function CartButton({ onClick }) {
  const totalItems = useSelector(selectTotalItems);

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

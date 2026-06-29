/**
 * components/AddToCartButton.jsx
 * --------------------------------
 * Small button rendered in each product row.
 * Reads cart state from Zustand to show "Added" feedback
 * without any local state.
 */

import useCartStore from "../store/useCartStore";
import styles from "./AddToCartButton.module.css";

export default function AddToCartButton({ product }) {
  const items      = useCartStore(s => s.items);
  const addToCart  = useCartStore(s => s.addToCart);

  const cartItem = items.find(i => i.product.id === product.id);
  const inCart   = !!cartItem;

  return (
    <button
      className={`${styles.btn} ${inCart ? styles.btnInCart : ""}`}
      onClick={() => addToCart(product)}
      aria-label={inCart ? `${cartItem.qty} in cart` : "Add to cart"}
    >
      {inCart ? (
        <>
          <span className={styles.checkIcon}>✓</span>
          {cartItem.qty} in cart
        </>
      ) : (
        <>+ Add</>
      )}
    </button>
  );
}

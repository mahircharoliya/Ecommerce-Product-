/**
 * components/AddToCartButton.jsx
 * --------------------------------
 * Dispatches addToCart Redux action.
 * Reads cart state from Redux to show "in cart" feedback.
 */

import { useSelector, useDispatch } from "react-redux";
import { addToCart, selectCartItems } from "../store/slices/cartSlice";
import styles from "./AddToCartButton.module.css";

export default function AddToCartButton({ product }) {
  const dispatch = useDispatch();
  const items    = useSelector(selectCartItems);
  const cartItem = items.find(i => i.product.id === product.id);
  const inCart   = !!cartItem;

  return (
    <button
      className={`${styles.btn} ${inCart ? styles.btnInCart : ""}`}
      onClick={() => dispatch(addToCart(product))}
      aria-label={inCart ? `${cartItem.qty} in cart` : "Add to cart"}
    >
      {inCart ? (
        <><span className={styles.checkIcon}>✓</span>{cartItem.qty} in cart</>
      ) : (
        <>+ Add</>
      )}
    </button>
  );
}

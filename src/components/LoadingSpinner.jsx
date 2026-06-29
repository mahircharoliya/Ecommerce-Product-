import styles from "./StatusScreens.module.css";

/** LoadingSpinner — displayed while the initial fetch is in progress */
export default function LoadingSpinner() {
  return (
    <div className={styles.centered}>
      <div className={styles.spinner} role="status" aria-label="Loading" />
      <p className={styles.title}>Loading products…</p>
      <p className={styles.detail}>Fetching from dummyjson.com</p>
    </div>
  );
}

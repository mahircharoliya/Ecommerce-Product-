import styles from "./StatusScreens.module.css";

/**
 * ErrorState — shown when the fetch fails.
 * The onRetry prop is wired to useFetch's `refetch` function.
 */
export default function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.centered}>
      <div className={`${styles.icon} ${styles.iconError}`} aria-hidden="true">⚠</div>
      <p className={styles.title}>Failed to load products</p>
      <p className={styles.detail}>{message}</p>
      <button className={styles.actionBtn} onClick={onRetry}>
        ↺ &nbsp;Retry
      </button>
    </div>
  );
}

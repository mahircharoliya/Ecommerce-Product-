import styles from "./StatusScreens.module.css";

/**
 * EmptyState — shown when filters produce zero results.
 * The onClear prop resets all search/filter state in App.jsx.
 */
export default function EmptyState({ onClear }) {
  return (
    <div className={styles.centered}>
      <div className={`${styles.icon} ${styles.iconEmpty}`} aria-hidden="true">◎</div>
      <p className={styles.title}>No products match your filters</p>
      <p className={styles.detail}>
        Try broadening your search, choosing a different category,
        or widening the price range.
      </p>
      <button className={styles.actionBtn} onClick={onClear}>
        Clear all filters
      </button>
    </div>
  );
}

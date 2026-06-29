import styles from "./SearchBar.module.css";

/**
 * SearchBar
 * ---------
 * Controlled input that emits the raw value on every keystroke.
 * Debouncing is handled upstream by the useDebounce hook in App.jsx,
 * keeping this component pure and reusable.
 */
export default function SearchBar({ value, onChange }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icon} aria-hidden="true">⌕</span>
      <input
        type="text"
        placeholder="Search by product title…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={styles.input}
        aria-label="Search products"
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          className={styles.clear}
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}

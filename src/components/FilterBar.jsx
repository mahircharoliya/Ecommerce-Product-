import styles from "./FilterBar.module.css";

/**
 * FilterBar
 * ---------
 * Category dropdown + min/max price inputs.
 * All filters are combined in App.jsx via useMemo — this component
 * is pure UI: it receives values and emits (key, value) pairs.
 */
export default function FilterBar({ categories, filters, onFilterChange }) {
  return (
    <div className={styles.bar}>
      {/* Category filter */}
      <label className={styles.label}>
        <span className={styles.labelText}>Category</span>
        <select
          value={filters.category}
          onChange={e => onFilterChange("category", e.target.value)}
          className={styles.select}
        >
          <option value="">All categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>

      {/* Min price */}
      <label className={styles.label}>
        <span className={styles.labelText}>Min price ($)</span>
        <input
          type="number"
          min="0"
          placeholder="0"
          value={filters.minPrice}
          onChange={e => onFilterChange("minPrice", e.target.value)}
          className={styles.numberInput}
        />
      </label>

      {/* Max price */}
      <label className={styles.label}>
        <span className={styles.labelText}>Max price ($)</span>
        <input
          type="number"
          min="0"
          placeholder="Any"
          value={filters.maxPrice}
          onChange={e => onFilterChange("maxPrice", e.target.value)}
          className={styles.numberInput}
        />
      </label>
    </div>
  );
}

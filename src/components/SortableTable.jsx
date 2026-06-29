import styles from "./SortableTable.module.css";

/** Column definitions — sortable:true columns get clickable headers */
const COLUMNS = [
  { key: "title",    label: "Product",  sortable: false },
  { key: "brand",    label: "Brand",    sortable: false },
  { key: "category", label: "Category", sortable: false },
  { key: "price",    label: "Price",    sortable: true  },
  { key: "rating",   label: "Rating",   sortable: true  },
  { key: "stock",    label: "Stock",    sortable: false },
];

/**
 * SortIcon
 * Shows ▲/▼ for the active column and a neutral ⇅ for inactive ones.
 */
function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <span className={styles.sortNeutral}>⇅</span>;
  }
  return (
    <span className={styles.sortActive}>
      {sortConfig.dir === "asc" ? "▲" : "▼"}
    </span>
  );
}

/**
 * RatingPill
 * Color-coded badge: green ≥ 4.5, yellow ≥ 3.5, red below.
 */
function RatingPill({ rating }) {
  const cls =
    rating >= 4.5 ? styles.ratingGreen :
    rating >= 3.5 ? styles.ratingYellow :
                    styles.ratingRed;
  return <span className={`${styles.ratingPill} ${cls}`}>★ {rating.toFixed(1)}</span>;
}

/**
 * SortableTable
 * Renders the current page of products.
 * Clicking "Price" or "Rating" headers calls onSort(key).
 */
export default function SortableTable({ products, sortConfig, onSort }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={[
                  styles.th,
                  col.sortable        ? styles.thSortable : "",
                  sortConfig.key === col.key ? styles.thActive   : "",
                ].join(" ")}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
                aria-sort={
                  col.sortable && sortConfig.key === col.key
                    ? sortConfig.dir === "asc" ? "ascending" : "descending"
                    : undefined
                }
              >
                {col.label}
                {col.sortable && (
                  <SortIcon column={col.key} sortConfig={sortConfig} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={p.id} className={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
              <td className={`${styles.td} ${styles.tdTitle}`}>{p.title}</td>
              <td className={styles.td}>{p.brand ?? "—"}</td>
              <td className={styles.td}>
                <span className={styles.categoryBadge}>{p.category}</span>
              </td>
              <td className={`${styles.td} ${styles.tdNum}`}>
                ${p.price.toFixed(2)}
              </td>
              <td className={`${styles.td} ${styles.tdNum}`}>
                <RatingPill rating={p.rating} />
              </td>
              <td className={`${styles.td} ${styles.tdNum}`}>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

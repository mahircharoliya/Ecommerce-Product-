import styles from "./Pagination.module.css";

/**
 * buildPageList
 * Produces a compact list like [1, "…", 4, 5, 6, "…", 12]
 * by always showing the first, last, and ±1 neighbours of the current page.
 */
function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const visible = new Set(
    [1, total, current, current - 1, current + 1].filter(p => p >= 1 && p <= total)
  );
  const sorted = [...visible].sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}

/**
 * Pagination
 * ----------
 * Renders Previous / numbered pages (with ellipsis) / Next.
 * Returns null if there is only one page.
 */
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav className={styles.nav} aria-label="Pagination">
      {/* Previous */}
      <button
        className={`${styles.btn} ${page === 1 ? styles.btnDisabled : ""}`}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
        ) : (
          <button
            key={p}
            className={`${styles.btn} ${p === page ? styles.btnActive : ""}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        className={`${styles.btn} ${page === totalPages ? styles.btnDisabled : ""}`}
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}

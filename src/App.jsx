/**
 * App.jsx
 * --------
 * Root component. Wires together:
 *   - useFetch      → raw product data
 *   - useDebounce   → debounced search
 *   - useMemo       → filtered + sorted + paginated derived state
 *   - useCartStore  → Zustand cart (cart button reads it directly)
 *   - CartDrawer    → slide-in sidebar with Razorpay checkout
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useFetch }    from "./hooks/useFetch";
import { useDebounce } from "./hooks/useDebounce";

import SearchBar     from "./components/SearchBar";
import FilterBar     from "./components/FilterBar";
import SortableTable from "./components/SortableTable";
import Pagination    from "./components/Pagination";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorState    from "./components/ErrorState";
import EmptyState    from "./components/EmptyState";
import CartButton    from "./components/CartButton";
import CartDrawer    from "./components/CartDrawer";

import styles from "./App.module.css";

const API_URL   = "https://dummyjson.com/products?limit=100";
const PAGE_SIZE = 10;

export default function App() {
  /* ── Data ─────────────────────────────────────────── */
  const { data, loading, error, refetch } = useFetch(API_URL);

  /* ── Search ───────────────────────────────────────── */
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  /* ── Filters ──────────────────────────────────────── */
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
  });

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  /* ── Sort ─────────────────────────────────────────── */
  const [sortConfig, setSortConfig] = useState({ key: "price", dir: "asc" });

  const handleSort = useCallback(key => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  }, []);

  /* ── Pagination ───────────────────────────────────── */
  const [page, setPage] = useState(1);

  const prevSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearch.current !== debouncedSearch) {
      setPage(1);
      prevSearch.current = debouncedSearch;
    }
  }, [debouncedSearch]);

  /* ── Cart drawer ──────────────────────────────────── */
  const [cartOpen, setCartOpen] = useState(false);

  /* ── Derived data ─────────────────────────────────── */
  const products = useMemo(() => data?.products ?? [], [data]);

  const categories = useMemo(
    () => [...new Set(products.map(p => p.category))].sort(),
    [products]
  );

  const filteredSorted = useMemo(() => {
    const term     = debouncedSearch.trim().toLowerCase();
    const minPrice = filters.minPrice !== "" ? parseFloat(filters.minPrice) : null;
    const maxPrice = filters.maxPrice !== "" ? parseFloat(filters.maxPrice) : null;

    const filtered = products.filter(p => {
      if (term && !p.title.toLowerCase().includes(term)) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (minPrice !== null && p.price < minPrice) return false;
      if (maxPrice !== null && p.price > maxPrice) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const mul = sortConfig.dir === "asc" ? 1 : -1;
      return (a[sortConfig.key] - b[sortConfig.key]) * mul;
    });
  }, [products, debouncedSearch, filters, sortConfig]);

  const totalPages  = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageStart   = (safePage - 1) * PAGE_SIZE;
  const currentPage = filteredSorted.slice(pageStart, pageStart + PAGE_SIZE);

  const clearAll = useCallback(() => {
    setSearchInput("");
    setFilters({ category: "", minPrice: "", maxPrice: "" });
    setPage(1);
  }, []);

  const isFiltered = filteredSorted.length < products.length;

  /* ── Render ───────────────────────────────────────── */
  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1 className={styles.heading}>Product Explorer</h1>
            <p className={styles.subheading}>
              {products.length > 0
                ? `Browsing ${products.length} products — search, filter, and sort in real-time`
                : "Loading catalog…"}
            </p>
          </div>
          <div className={styles.headerRight}>
            {!loading && !error && (
              <span className={styles.headerBadge}>
                {filteredSorted.length} / {products.length}
              </span>
            )}
            <CartButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
      </header>

      {/* ── Sticky control bar ── */}
      <div className={styles.controlBar}>
        <SearchBar value={searchInput} onChange={setSearchInput} />
        <FilterBar
          categories={categories}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* ── Results summary ── */}
      {!loading && !error && (
        <div className={styles.summary}>
          <span className={styles.summaryCount}>
            {filteredSorted.length} result{filteredSorted.length !== 1 ? "s" : ""}
          </span>
          {isFiltered && (
            <button className={styles.clearLink} onClick={clearAll}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Main content ── */}
      <main className={styles.main}>
        {loading && <LoadingSpinner />}

        {!loading && error && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && filteredSorted.length === 0 && (
          <EmptyState onClear={clearAll} />
        )}

        {!loading && !error && filteredSorted.length > 0 && (
          <>
            <SortableTable
              products={currentPage}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            <div className={styles.paginationRow}>
              <span className={styles.pageInfo}>
                Page {safePage} of {totalPages} &nbsp;·&nbsp; showing{" "}
                {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredSorted.length)} of{" "}
                {filteredSorted.length}
              </span>
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </main>

      {/* ── Cart Drawer (Razorpay checkout lives inside) ── */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

    </div>
  );
}

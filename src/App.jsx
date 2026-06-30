/**
 * App.jsx
 * --------
 * Root component — now powered by Redux Toolkit + Redux Thunk.
 *
 * STATE MANAGEMENT ARCHITECTURE:
 *   Redux store → products (fetch via Redux Thunk, search, filter, sort, pagination)
 *   Redux store → cart (items, checkout flow via processCheckout thunk)
 *   Local state → raw search input + cart drawer open/close (pure UI)
 *
 * REDUX THUNK USAGE:
 *   dispatch(fetchProducts()) — thunk fires the async fetch, then
 *   dispatches pending/fulfilled/rejected actions automatically.
 *
 * SELECTOR USAGE:
 *   All derived data (filteredSorted, paginated, categories) comes from
 *   memoized createSelector selectors defined in productsSlice.js.
 *   Components never compute derived data themselves.
 */

import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDebounce } from "./hooks/useDebounce";

// Redux actions (thunk + sync)
import {
  fetchProducts,
  setSearchTerm,
  setFilter,
  clearFilters,
  setSort,
  setPage,
  // Selectors
  selectProductStatus,
  selectProductError,
  selectAllProducts,
  selectCategories,
  selectFilteredSorted,
  selectPaginatedProducts,
  selectTotalPages,
  selectSearchTerm,
  selectFilters,
  selectSortKey,
  selectSortDir,
  selectCurrentPage,
  selectPageSize,
} from "./store/slices/productsSlice";

import { useState } from "react";
import SearchBar      from "./components/SearchBar";
import FilterBar      from "./components/FilterBar";
import SortableTable  from "./components/SortableTable";
import Pagination     from "./components/Pagination";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorState     from "./components/ErrorState";
import EmptyState     from "./components/EmptyState";
import CartButton     from "./components/CartButton";
import CartDrawer     from "./components/CartDrawer";
import styles         from "./App.module.css";

export default function App() {
  const dispatch = useDispatch();

  /* ── Redux state selectors ────────────────────────────────────────── */
  const status         = useSelector(selectProductStatus);
  const error          = useSelector(selectProductError);
  const allProducts    = useSelector(selectAllProducts);
  const categories     = useSelector(selectCategories);
  const filteredSorted = useSelector(selectFilteredSorted);
  const currentPageProducts = useSelector(selectPaginatedProducts);
  const totalPages     = useSelector(selectTotalPages);
  const searchTerm     = useSelector(selectSearchTerm);
  const filters        = useSelector(selectFilters);
  const sortKey        = useSelector(selectSortKey);
  const sortDir        = useSelector(selectSortDir);
  const currentPage    = useSelector(selectCurrentPage);
  const pageSize       = useSelector(selectPageSize);

  /* ── Local state — raw search input (debounced before Redux) ─────── */
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(
    searchInput,
    Number(import.meta.env.VITE_DEBOUNCE_DELAY) || 300
  );

  /* ── Cart drawer open/close (pure UI, local state is fine) ──────── */
  const [cartOpen, setCartOpen] = useState(false);

  /* ── Dispatch fetchProducts thunk on mount ───────────────────────── */
  useEffect(() => {
    // Only fetch if we haven't already (avoid re-fetching on re-render)
    if (status === "idle") {
      dispatch(fetchProducts()); // Redux Thunk fires here
    }
  }, [status, dispatch]);

  /* ── Sync debounced search input → Redux store ───────────────────── */
  useEffect(() => {
    dispatch(setSearchTerm(debouncedSearch));
  }, [debouncedSearch, dispatch]);

  /* ── Action dispatchers ──────────────────────────────────────────── */
  const handleFilterChange = useCallback((key, value) => {
    dispatch(setFilter({ key, value }));
  }, [dispatch]);

  const handleSort = useCallback(key => {
    dispatch(setSort(key));
  }, [dispatch]);

  const handlePageChange = useCallback(page => {
    dispatch(setPage(page));
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    setSearchInput("");
    dispatch(clearFilters());
  }, [dispatch]);

  /* ── Derived display values ──────────────────────────────────────── */
  const loading    = status === "loading";
  const failed     = status === "failed";
  const succeeded  = status === "succeeded";
  const isFiltered = filteredSorted.length < allProducts.length;
  const pageStart  = (currentPage - 1) * pageSize;
  const safePage   = Math.min(currentPage, totalPages);

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1 className={styles.heading}>Product Explorer</h1>
            <p className={styles.subheading}>
              {allProducts.length > 0
                ? `Browsing ${allProducts.length} products — search, filter, and sort in real-time`
                : "Loading catalog…"}
            </p>
          </div>
          <div className={styles.headerRight}>
            {succeeded && (
              <span className={styles.headerBadge}>
                {filteredSorted.length} / {allProducts.length}
              </span>
            )}
            <CartButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
      </header>

      {/* ── Sticky control bar ── */}
      <div className={styles.controlBar}>
        {/* searchInput is local state; debounced value goes to Redux */}
        <SearchBar value={searchInput} onChange={setSearchInput} />
        <FilterBar
          categories={categories}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* ── Results summary ── */}
      {succeeded && (
        <div className={styles.summary}>
          <span className={styles.summaryCount}>
            {filteredSorted.length} result{filteredSorted.length !== 1 ? "s" : ""}
          </span>
          {isFiltered && (
            <button className={styles.clearLink} onClick={handleClearAll}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Main content ── */}
      <main className={styles.main}>
        {/* Loading — thunk pending */}
        {loading && <LoadingSpinner />}

        {/* Error — thunk rejected */}
        {failed && (
          <ErrorState
            message={error}
            onRetry={() => dispatch(fetchProducts())}
          />
        )}

        {/* Empty — thunk succeeded but filters returned nothing */}
        {succeeded && filteredSorted.length === 0 && (
          <EmptyState onClear={handleClearAll} />
        )}

        {/* Results */}
        {succeeded && filteredSorted.length > 0 && (
          <>
            <SortableTable
              products={currentPageProducts}
              sortConfig={{ key: sortKey, dir: sortDir }}
              onSort={handleSort}
            />
            <div className={styles.paginationRow}>
              <span className={styles.pageInfo}>
                Page {safePage} of {totalPages} &nbsp;·&nbsp; showing{" "}
                {pageStart + 1}–{Math.min(pageStart + pageSize, filteredSorted.length)} of{" "}
                {filteredSorted.length}
              </span>
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </main>

      {/* ── Cart Drawer ── */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

    </div>
  );
}

/**
 * src/store/slices/productsSlice.js
 * ----------------------------------
 * Redux slice for all product-related state:
 *   • Async fetching via createAsyncThunk (Redux Thunk under the hood)
 *   • Search, filter, sort, pagination as synchronous actions
 *   • Derived filtered/sorted/paginated list via memoized selector
 *
 * WHY REDUX THUNK HERE (not Zustand)?
 *   Redux Thunk is ideal for async server data that multiple parts of
 *   the app may need. Zustand handles the cart (client-only UI state).
 *   This separation is the standard real-world pattern.
 *
 * REDUX THUNK FLOW:
 *   dispatch(fetchProducts())
 *     → thunk fires → sets status:"loading"
 *     → fetch() runs
 *     → on success: fulfilled action → sets products[] in state
 *     → on failure: rejected action → sets error in state
 */

import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_PRODUCTS_ENDPOINT}?limit=${import.meta.env.VITE_PRODUCTS_LIMIT}`;
const PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 10;

/* ─── Async Thunk — fetchProducts ─────────────────────────────────────────
 *
 * createAsyncThunk automatically dispatches 3 lifecycle actions:
 *   fetchProducts.pending   → status = "loading"
 *   fetchProducts.fulfilled → status = "succeeded", products = payload
 *   fetchProducts.rejected  → status = "failed",    error = message
 *
 * Redux Thunk middleware intercepts the returned function and calls it
 * with (dispatch, getState) — that's what makes async work in Redux.
 */
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",       // action type prefix
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      return data.products;       // this becomes action.payload in fulfilled
    } catch (err) {
      // rejectWithValue passes a custom error to the rejected handler
      return rejectWithValue(err.message || "Failed to fetch products");
    }
  }
);

/* ─── Initial State ────────────────────────────────────────────────────── */
const initialState = {
  // Raw data
  items    : [],          // all 100 products from API
  status   : "idle",      // "idle" | "loading" | "succeeded" | "failed"
  error    : null,        // error message string | null

  // Search
  searchTerm: "",         // raw input value (debouncing handled in component)

  // Filters
  filters: {
    category: "",
    minPrice: "",
    maxPrice: "",
  },

  // Sort
  sortKey: "price",       // "price" | "rating"
  sortDir: "asc",         // "asc" | "desc"

  // Pagination
  currentPage: 1,
  pageSize   : PAGE_SIZE,
};

/* ─── Slice ────────────────────────────────────────────────────────────── */
const productsSlice = createSlice({
  name: "products",
  initialState,

  /* ── Synchronous reducers ──────────────────────────────────────────── */
  reducers: {
    /** Update debounced search term (called after useDebounce fires) */
    setSearchTerm(state, action) {
      state.searchTerm  = action.payload;
      state.currentPage = 1; // always reset page on new search
    },

    /** Update a single filter key (category | minPrice | maxPrice) */
    setFilter(state, action) {
      const { key, value } = action.payload;
      state.filters[key]  = value;
      state.currentPage   = 1;
    },

    /** Reset all filters + search */
    clearFilters(state) {
      state.searchTerm  = "";
      state.filters     = { category: "", minPrice: "", maxPrice: "" };
      state.currentPage = 1;
    },

    /**
     * Toggle sort column. If same column clicked → flip direction.
     * If different column → switch to that column ascending.
     */
    setSort(state, action) {
      const key = action.payload;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = "asc";
      }
    },

    /** Jump to a specific page */
    setPage(state, action) {
      state.currentPage = action.payload;
    },
  },

  /* ── Async thunk handlers (extraReducers) ──────────────────────────── */
  // These handle the 3 lifecycle actions from fetchProducts thunk
  extraReducers(builder) {
    builder
      // fetchProducts.pending — show loading spinner
      .addCase(fetchProducts.pending, state => {
        state.status = "loading";
        state.error  = null;
      })

      // fetchProducts.fulfilled — store the products array
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items  = action.payload; // array of 100 products
      })

      // fetchProducts.rejected — store the error message
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error  = action.payload ?? "Unknown error";
      });
  },
});

/* ─── Export actions ───────────────────────────────────────────────────── */
export const {
  setSearchTerm,
  setFilter,
  clearFilters,
  setSort,
  setPage,
} = productsSlice.actions;

/* ─── Selectors ────────────────────────────────────────────────────────── */

/** Raw state selectors */
export const selectAllProducts  = state => state.products.items;
export const selectProductStatus = state => state.products.status;
export const selectProductError  = state => state.products.error;
export const selectSearchTerm   = state => state.products.searchTerm;
export const selectFilters      = state => state.products.filters;
export const selectSortKey      = state => state.products.sortKey;
export const selectSortDir      = state => state.products.sortDir;
export const selectCurrentPage  = state => state.products.currentPage;
export const selectPageSize     = state => state.products.pageSize;

/**
 * selectCategories
 * Memoized selector — derives unique sorted category list from raw products.
 * Only recomputes when products array reference changes.
 */
export const selectCategories = createSelector(
  selectAllProducts,
  products => [...new Set(products.map(p => p.category))].sort()
);

/**
 * selectFilteredSorted
 * Memoized selector — applies search + all filters + sort in one pass.
 * Only recomputes when any of its inputs change.
 * This is the single derived source — pagination slices into it.
 */
export const selectFilteredSorted = createSelector(
  selectAllProducts,
  selectSearchTerm,
  selectFilters,
  selectSortKey,
  selectSortDir,
  (products, searchTerm, filters, sortKey, sortDir) => {
    const term     = searchTerm.trim().toLowerCase();
    const minPrice = filters.minPrice !== "" ? parseFloat(filters.minPrice) : null;
    const maxPrice = filters.maxPrice !== "" ? parseFloat(filters.maxPrice) : null;

    // Filter
    const filtered = products.filter(p => {
      if (term && !p.title.toLowerCase().includes(term)) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (minPrice !== null && p.price < minPrice) return false;
      if (maxPrice !== null && p.price > maxPrice) return false;
      return true;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * mul;
    });
  }
);

/**
 * selectPaginatedProducts
 * Slices the filtered+sorted list for the current page.
 */
export const selectPaginatedProducts = createSelector(
  selectFilteredSorted,
  selectCurrentPage,
  selectPageSize,
  (filtered, page, size) => {
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  }
);

/**
 * selectTotalPages
 * Total page count based on filtered result count.
 */
export const selectTotalPages = createSelector(
  selectFilteredSorted,
  selectPageSize,
  (filtered, size) => Math.max(1, Math.ceil(filtered.length / size))
);

export default productsSlice.reducer;

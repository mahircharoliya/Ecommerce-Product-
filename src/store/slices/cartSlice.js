/**
 * src/store/slices/cartSlice.js
 * ------------------------------
 * Redux slice for cart state — items, checkout flow, last order.
 *
 * The async checkout thunk (processCheckout) uses Redux Thunk to:
 *   1. Call razorpayService.initiatePayment()
 *   2. Dispatch success/failure actions based on result
 *   This keeps ALL async side effects out of components.
 */

import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { initiatePayment } from "../../services/razorpayService";

/* ─── Async Thunk — processCheckout ───────────────────────────────────────
 *
 * Handles the full Razorpay payment flow as a Redux Thunk.
 * Components just dispatch(processCheckout({ items, amount, ... }))
 * and react to the resulting state — no async logic in components.
 */
export const processCheckout = createAsyncThunk(
  "cart/processCheckout",
  async ({ items, totalAmount, customerName, customerEmail }, { rejectWithValue }) => {
    try {
      const result = await initiatePayment({
        amount       : totalAmount,
        cartItems    : items,
        customerName : customerName || "Guest",
        customerEmail: customerEmail || "",
      });
      return result; // becomes action.payload in fulfilled
    } catch (err) {
      return rejectWithValue(err.message || "Payment failed");
    }
  }
);

/* ─── Initial State ────────────────────────────────────────────────────── */
const initialState = {
  items          : [],       // [{ product, qty }]
  checkoutStatus : "idle",   // "idle" | "processing" | "success" | "failed"
  checkoutError  : null,
  lastOrder      : null,     // { orderId, paymentId, amount, items }
};

/* ─── Slice ────────────────────────────────────────────────────────────── */
const cartSlice = createSlice({
  name: "cart",
  initialState,

  reducers: {
    /** Add product; increment qty if already in cart */
    addToCart(state, action) {
      const product  = action.payload;
      const existing = state.items.find(i => i.product.id === product.id);
      if (existing) {
        existing.qty += 1;
      } else {
        state.items.push({ product, qty: 1 });
      }
    },

    /** Remove product entirely */
    removeFromCart(state, action) {
      state.items = state.items.filter(i => i.product.id !== action.payload);
    },

    /** Set qty; remove if qty drops to 0 */
    updateQty(state, action) {
      const { productId, qty } = action.payload;
      if (qty < 1) {
        state.items = state.items.filter(i => i.product.id !== productId);
      } else {
        const item = state.items.find(i => i.product.id === productId);
        if (item) item.qty = qty;
      }
    },

    /** Wipe the cart */
    clearCart(state) {
      state.items = [];
    },

    /** Reset checkout status back to idle (e.g. dismiss error) */
    resetCheckout(state) {
      state.checkoutStatus = "idle";
      state.checkoutError  = null;
    },
  },

  /* ── Thunk lifecycle handlers ──────────────────────────────────────── */
  extraReducers(builder) {
    builder
      .addCase(processCheckout.pending, state => {
        state.checkoutStatus = "processing";
        state.checkoutError  = null;
      })
      .addCase(processCheckout.fulfilled, (state, action) => {
        state.checkoutStatus = "success";
        state.lastOrder = {
          orderId  : action.payload.orderId,
          paymentId: action.payload.paymentId,
          amount   : action.meta.arg.totalAmount,
          items    : [...action.meta.arg.items],   // snapshot of cart at time of purchase
          message  : action.payload.message,
        };
        state.items = []; // clear cart after successful payment
      })
      .addCase(processCheckout.rejected, (state, action) => {
        // Don't show error for user-cancelled payments
        if (action.payload === "Payment cancelled by user") {
          state.checkoutStatus = "idle";
        } else {
          state.checkoutStatus = "failed";
          state.checkoutError  = action.payload;
        }
      });
  },
});

/* ─── Export actions ───────────────────────────────────────────────────── */
export const {
  addToCart,
  removeFromCart,
  updateQty,
  clearCart,
  resetCheckout,
} = cartSlice.actions;

/* ─── Selectors ────────────────────────────────────────────────────────── */
export const selectCartItems         = state => state.cart.items;
export const selectCheckoutStatus    = state => state.cart.checkoutStatus;
export const selectCheckoutError     = state => state.cart.checkoutError;
export const selectLastOrder         = state => state.cart.lastOrder;

/** Memoized total item count */
export const selectTotalItems = createSelector(
  selectCartItems,
  items => items.reduce((sum, i) => sum + i.qty, 0)
);

/** Memoized total price */
export const selectTotalAmount = createSelector(
  selectCartItems,
  items => items.reduce((sum, i) => sum + i.product.price * i.qty, 0)
);

export default cartSlice.reducer;

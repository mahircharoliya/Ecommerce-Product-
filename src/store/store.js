/**
 * src/store/store.js
 * -------------------
 * Redux store — combines all slices.
 *
 * MIDDLEWARE:
 *   Redux Toolkit includes redux-thunk by default via configureStore.
 *   No manual middleware setup needed — thunks work out of the box.
 *
 * SLICES:
 *   products → all product data, fetch status, search/filter/sort/pagination
 *   cart     → cart items, checkout status, last order
 *
 * DEVTOOLS:
 *   Redux DevTools Extension is automatically enabled in development.
 *   Install the browser extension to inspect actions + state in real-time.
 */

import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "./slices/productsSlice";
import cartReducer     from "./slices/cartSlice";

const store = configureStore({
  reducer: {
    products: productsReducer,  // state.products.*
    cart    : cartReducer,      // state.cart.*
  },

  // configureStore adds redux-thunk automatically.
  // In development, Redux DevTools Extension is also wired in.
  // You can customize middleware here if needed:
  // middleware: getDefaultMiddleware => getDefaultMiddleware().concat(logger),
});

export default store;

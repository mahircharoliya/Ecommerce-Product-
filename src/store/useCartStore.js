/**
 * store/useCartStore.js
 * ---------------------
 * Zustand store — single source of truth for:
 *   • cart items (add / remove / update qty / clear)
 *   • checkout UI state (idle | processing | success | error)
 *   • last order details (shown on success screen)
 *
 * No prop drilling needed — any component can call useCartStore()
 * and get live-reactive access to cart state.
 */

import { create } from "zustand";

const useCartStore = create((set, get) => ({
  /* ── State ─────────────────────────────────── */
  items: [],                // [{ product, qty }]
  checkoutStatus: "idle",   // "idle" | "processing" | "success" | "error"
  checkoutError: null,      // string | null
  lastOrder: null,          // { orderId, amount, items } — shown on success

  /* ── Cart actions ──────────────────────────── */

  /** Add product to cart; increment qty if already present */
  addToCart(product) {
    set(state => {
      const existing = state.items.find(i => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { product, qty: 1 }] };
    });
  },

  /** Remove a product entirely from the cart */
  removeFromCart(productId) {
    set(state => ({
      items: state.items.filter(i => i.product.id !== productId),
    }));
  },

  /** Set an item's qty directly; removes the item if qty reaches 0 */
  updateQty(productId, qty) {
    if (qty < 1) {
      get().removeFromCart(productId);
      return;
    }
    set(state => ({
      items: state.items.map(i =>
        i.product.id === productId ? { ...i, qty } : i
      ),
    }));
  },

  /** Wipe the entire cart */
  clearCart() {
    set({ items: [] });
  },

  /* ── Checkout state actions ────────────────── */

  setCheckoutStatus(status, error = null) {
    set({ checkoutStatus: status, checkoutError: error });
  },

  setLastOrder(order) {
    set({ lastOrder: order });
  },

  /* ── Derived (computed via selectors) ──────── */
  // Use these as: const total = useCartStore(s => s.totalAmount())
  // They're functions so Zustand doesn't need to deeply diff objects.

  totalItems() {
    return get().items.reduce((sum, i) => sum + i.qty, 0);
  },

  totalAmount() {
    return get().items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  },
}));

export default useCartStore;

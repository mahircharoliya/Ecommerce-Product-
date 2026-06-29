import { useState, useEffect } from "react";

/**
 * useDebounce
 * -----------
 * Returns a debounced copy of `value` that only updates after
 * the caller has stopped changing it for `delay` milliseconds.
 *
 * How it works:
 *   - On every render where `value` changed, we schedule a setTimeout.
 *   - The cleanup function cancels the previous timer before the new one runs.
 *   - Only the *last* scheduled timer fires → the debounced value updates.
 *
 * @param {*}      value  - The value to debounce (typically a string)
 * @param {number} delay  - Debounce delay in ms (default: 300)
 * @returns {*}           - Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // Cleanup: cancel the scheduled update if value changes before delay elapses
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

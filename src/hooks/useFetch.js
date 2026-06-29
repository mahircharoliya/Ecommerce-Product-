import { useState, useEffect, useCallback } from "react";

/**
 * useFetch
 * --------
 * Generic data-fetching hook with:
 *   • Abort-on-unmount  — uses AbortController so in-flight requests are
 *     cancelled when the component unmounts, preventing state-update-on-
 *     unmounted-component warnings.
 *   • Retry support     — `refetch` bumps an internal counter, causing the
 *     effect to re-run without changing the URL prop.
 *
 * @param {string} url - The endpoint to fetch
 * @returns {{ data, loading, error, refetch }}
 */
export function useFetch(url) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Incrementing this counter triggers a re-fetch (used by the Retry button)
  const [fetchId, setFetchId] = useState(0);
  const refetch = useCallback(() => setFetchId(id => id + 1), []);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();

    // Reset state for the new request
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
        return res.json();
      })
      .then(json => {
        // Guard: only update state if we haven't been aborted
        if (!controller.signal.aborted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        // Ignore the AbortError that fires when we deliberately cancel
        if (err.name !== "AbortError") {
          setError(err.message ?? "An unknown error occurred");
          setLoading(false);
        }
      });

    // Cleanup: abort the fetch when the component unmounts or fetchId changes
    return () => controller.abort();
  }, [url, fetchId]);

  return { data, loading, error, refetch };
}

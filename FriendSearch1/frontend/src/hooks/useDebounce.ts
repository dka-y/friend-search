import { useState, useEffect } from "react";

/**
 * useDebounce — delays updating a value until the user stops typing.
 * Used in SearchBar to avoid firing an API call on every keystroke.
 *
 * @param value   - the raw value that changes frequently
 * @param delay   - milliseconds to wait (default 280ms)
 * @returns         the debounced value
 *
 * Usage:
 *   const debounced = useDebounce(query, 280);
 *   useEffect(() => { if (debounced) fetchResults(debounced); }, [debounced]);
 */
export function useDebounce<T>(value: T, delay = 280): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
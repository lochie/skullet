import { useEffect, useState } from "react";

/** Resolves to `value` after `delay`, as a fetch would; remount to load again. */
export function useLoad<T>(value: T, delay = 900) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (data) return;
    const timeout = setTimeout(() => setData(value), delay);
    return () => clearTimeout(timeout);
  }, [data, value, delay]);

  return data;
}

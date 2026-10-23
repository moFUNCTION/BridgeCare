import { useState, useCallback, useEffect } from "react";

export function useLocalStorage<T extends string>(
  key: string,
  initialValue?: T
): {
  value: T | null;
  setValue: (value: T | null) => void;
  onChange: (value: T | null) => void;
} {
  const read = useCallback((): T | null => {
    if (typeof window === "undefined") return (initialValue ?? null) as T | null;
    try {
      const item = window.localStorage.getItem(key);
      return item as T | null;
    } catch {
      return (initialValue ?? null) as T | null;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState<T | null>(read);

  useEffect(() => {
    setValue(read());
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  }, [key, value]);

  return { value, setValue, onChange: setValue };
}

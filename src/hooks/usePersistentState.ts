import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return saved as unknown as T;
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    const valueToStore = typeof state === 'string' ? state : JSON.stringify(state);
    localStorage.setItem(key, valueToStore);
  }, [key, state]);

  return [state, setState];
}

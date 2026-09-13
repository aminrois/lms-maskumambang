import { useState, useEffect } from "react";

export function useDuplicateCheck(
  value: string,
  checkFn: (val: string) => boolean,
  debounceMs: number = 400
) {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Reset state jika value kosong
    if (!value || value.trim() === "") {
      setIsDuplicate(false);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);

    const timer = setTimeout(() => {
      const duplicate = checkFn(value.trim());
      setIsDuplicate(duplicate);
      setIsChecking(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, checkFn, debounceMs]);

  return { isDuplicate, isChecking };
}

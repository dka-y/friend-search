import { useRef, useEffect, useState } from "react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  loading = false,
  placeholder = "Search names or usernames…",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className={styles.wrap}>
      <span className={styles.searchIcon}>⌕</span>

      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />

      {loading && <span className={`${styles.spinner} pulse`}>●</span>}

      {value && !loading && (
        <button className={styles.clearBtn} onClick={() => onChange("")} aria-label="Clear">
          ✕
        </button>
      )}
    </div>
  );
}
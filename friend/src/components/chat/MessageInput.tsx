import { useRef, type FormEvent, type KeyboardEvent } from "react";
import styles from "./MessageInput.module.css";

interface MessageInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  sending = false,
  placeholder = "Type a message…",
}: MessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || sending) return;
    onSend();
  };

  // Send on Enter, newline on Shift+Enter
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!value.trim() || sending) return;
      onSend();
    }
  };

  return (
    <form className={styles.bar} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={1000}
        autoComplete="off"
        autoFocus
      />

      <button
        className={styles.sendBtn}
        type="submit"
        disabled={!value.trim() || sending}
        aria-label="Send"
      >
        {sending ? (
          <span className="pulse">•</span>
        ) : (
          <span>↑</span>
        )}
      </button>
    </form>
  );
}
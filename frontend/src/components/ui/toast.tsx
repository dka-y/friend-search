import { useEffect, useState } from "react";
import styles from "../../styles/Toast.module.css";
 
type ToastVariant = "success" | "danger" | "info";

interface ToastProps{
    message: string;
    variant?: ToastVariant;
    duration?: number;
    onDismiss: () => void;
}

export default function Toast({message, variant = "success", duration = 3000, onDismiss}: ToastProps){
    const [visible, setVisible] = useState(false);
     useEffect(() => {
    // Trigger enter animation on mount
    const show = requestAnimationFrame(() => setVisible(true));
 
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for exit animation before calling onDismiss
      setTimeout(onDismiss, 250);
    }, duration);
 
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(timer);
    };
  }, [duration, onDismiss]);
 
  return (
    <div
      className={`${styles.toast} ${styles[variant]} ${visible ? styles.visible : ""}`}
      role="alert"
    >
      <span className={styles.icon}>
        {variant === "success" && "✓"}
        {variant === "danger"  && "✕"}
        {variant === "info"    && "i"}
      </span>
      {message}
    </div>
  );
}
 

// manages toast
export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}
 
let _id = 0;
 
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
 
  const showToast = (message: string, variant: ToastVariant = "success") => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, variant }]);
  };
 
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
 
  return { toasts, showToast, removeToast };
}
 

// render active toast
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
 
  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          variant={t.variant}
          onDismiss={() => onDismiss(t.id)}
        />
      ))}
    </div>
  );
}
import styles from "./Badge.module.css";

type BadgeVariant = "accent" | "success" | "danger" | "muted" | "dsa";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = "muted" }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {label}
    </span>
  );
}
import styles from "../../styles/Avatar.module.css";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}

export default function Avatar({ name, size = "md", onClick }: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() ?? "?";
  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${onClick ? styles.clickable : ""}`}
      onClick={onClick}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
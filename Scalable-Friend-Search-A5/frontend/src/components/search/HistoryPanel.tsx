import Badge from "../ui/badge";
import Button from "../ui/button";
import styles from "../../styles/Historypanel.module.css";

interface HistoryPanelProps {
  history: string[];
  onClickItem: (query: string) => void;
  onUndo: () => void;
}

export default function HistoryPanel({
  history,
  onClickItem,
  onUndo,
}: HistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Badge label="Stack" variant="dsa" />
          <span>Recent searches</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onUndo}>
          ↩ Undo
        </Button>
      </div>

      <div className={styles.chips}>
        {history.map((q, i) => (
          <button key={i} className={styles.chip} onClick={() => onClickItem(q)}>
            <span className={styles.clock}>◷</span>
            {q}
            {i === 0 && <Badge label="top" variant="accent" />}
          </button>
        ))}
      </div>
    </div>
  );
}
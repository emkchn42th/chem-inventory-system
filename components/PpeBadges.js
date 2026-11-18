// 개인보호구 아이콘 묶음 (추가 기능)
//   items : ["goggles", "gloves", ...]  (lib/ppe.js)
//   detail: true 이면 설명 글까지 보여 준다
import styles from "./PpeBadges.module.css";
import { PPE_ITEMS } from "../lib/ppe";

export default function PpeBadges({ items = [], detail = false, title = "필요한 보호구·주의" }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.box}>
      {title && <p className={styles.title}>{title}</p>}
      <ul className={detail ? styles.detailList : styles.list}>
        {items.map((key) => {
          const item = PPE_ITEMS[key];
          const warn = key === "noFire" || key === "noWater";
          return (
            <li key={key} className={`${styles.item} ${warn ? styles.warn : ""}`} title={item.detail}>
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.label}>{item.label}</span>
              {detail && <span className={styles.detail}>{item.detail}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

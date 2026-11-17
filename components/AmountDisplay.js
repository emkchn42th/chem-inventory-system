// 남은 양 표시 (정량 / 정성 모두) (피드백 반영 단계)
//   정성 : ▮▮▯ 상        (막대 3칸)
//   정량 : [■■■■■■□□□] 350 / 500 mL (70%)   (퍼센트 막대 + 숫자)

import styles from "./AmountDisplay.module.css";
import { describeAmount } from "../lib/amount";

export default function AmountDisplay({ row, large = false }) {
  const info = describeAmount(row);

  if (info.mode === "정량") {
    const tone = info.level === 1 ? styles.low : info.level === 2 ? styles.mid : "";
    return (
      <span className={`${styles.quant} ${large ? styles.large : ""}`}>
        <span
          className={styles.meter}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={info.percent}
          aria-label={`남은 양 ${info.percent}%`}
        >
          <span className={`${styles.fill} ${tone}`} style={{ width: `${info.percent}%` }} />
        </span>
        <span className={styles.numbers}>{info.text}</span>
        <span className={styles.modeTag}>정량</span>
      </span>
    );
  }

  return (
    <span className={styles.qual}>
      <span className={styles.bars} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`${styles.bar} ${n <= info.level ? styles.barOn : ""}`} />
        ))}
      </span>
      {info.text}
    </span>
  );
}

// 화면을 불러오는 동안 보여 주는 회색 뼈대 (추가 기능 단계)
// 서버가 DB를 읽는 동안 빈 화면 대신 모양을 먼저 보여 줘서 덜 답답하게 느껴진다.
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="불러오는 중">
      <div className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.logo} />
          <div className={styles.search} />
        </div>
      </div>
      <div className={styles.inner}>
        <div className={`skeleton ${styles.title}`} />
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className={`skeleton ${styles.card}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

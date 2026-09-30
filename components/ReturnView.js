"use client";

// 반납하기 화면 (5차시)
//   - 지금 "사용중"인 재고를 보여 준다.
//   - [반납 완료]를 누르면 재고가 다시 "보관중"이 된다.

import Link from "next/link";
import styles from "./Ledger.module.css";
import { useStore, formatDateTime } from "../lib/store";

export default function ReturnView() {
  const { ready, inUseRows, returnedLog, returnStock } = useStore();

  if (!ready) return <main className={styles.container} aria-busy="true" />;

  return (
    <main className={styles.container}>
      <div className={styles.head}>
        <h1 className={styles.title}>반납하기</h1>
        <span className={styles.count}>{inUseRows.length}개</span>
      </div>

      {inUseRows.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✅</div>
          <p className={styles.emptyTitle}>반납할 재고가 없어요.</p>
          <p className={styles.emptyHint}>사용중인 재고가 없습니다.</p>
          <Link href="/" className={styles.primary}>
            메인으로
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.hint}>표시된 위치에 재고를 돌려놓은 뒤 &quot;반납 완료&quot;를 눌러 주세요.</p>
          <div className={styles.list}>
            {inUseRows.map((row) => (
              <div key={row.재고번호} className={styles.item}>
                <div className={styles.place}>
                  <span className={styles.placeLabel}>반납 위치</span>
                  {row.보관위치}
                </div>
                <div className={styles.info}>
                  <Link href={`/stock/${row.재고번호}`} className={styles.name}>
                    {row.시약명}
                  </Link>
                  <p className={styles.meta}>
                    <span>재고 #{row.재고번호}</span>
                    <span>남은 양 {row.남은양}</span>
                    <span>{row.rentedAt ? `대여 ${formatDateTime(row.rentedAt)}` : "대여 기록 없음"}</span>
                  </p>
                </div>
                <button type="button" className={styles.returnBtn} onClick={() => returnStock(row.재고번호)}>
                  반납 완료
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {returnedLog.length > 0 && (
        <>
          <h2 className={styles.subTitle}>최근 반납 기록</h2>
          <ul className={styles.history}>
            {returnedLog.map((entry) => (
              <li key={entry.id + entry.returnedAt}>
                <span>
                  <b>{entry.row.시약명}</b> · 재고 #{entry.id} → {entry.row.보관위치}
                </span>
                <span className={styles.historyTime}>{formatDateTime(entry.returnedAt)} 반납</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

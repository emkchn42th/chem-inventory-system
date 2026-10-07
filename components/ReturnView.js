"use client";

// 반납하기 화면 (5차시, 8차시에 DB 저장으로 개편)
//   - 지금 "사용중"인 재고를 보여 준다. (누가, 언제 빌렸는지 포함)
//   - [반납 완료]를 누르면 서버가 DB의 재고 상태와 대여 기록을 갱신한다.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Ledger.module.css";
import { useStore, formatDateTime } from "../lib/store";
import { returnStock } from "../app/rental/actions";

export default function ReturnView() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [workingId, setWorkingId] = useState(null); // 지금 반납 처리 중인 재고
  const [error, setError] = useState("");
  const { ready, inUseRows, returnedLog } = useStore();

  if (!ready) return <main className={styles.container} aria-busy="true" />;

  function handleReturn(id) {
    setError("");
    setWorkingId(id);
    startTransition(async () => {
      const result = await returnStock(id);
      if (!result.ok) setError(result.message);
      router.refresh();
      setWorkingId(null);
    });
  }

  return (
    <main className={styles.container}>
      <div className={styles.head}>
        <h1 className={styles.title}>반납하기</h1>
        <span className={styles.count}>{inUseRows.length}개</span>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

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
                    {row.borrower && <span>대여자 {row.borrower}</span>}
                    <span>{row.rentedAt ? `대여 ${formatDateTime(row.rentedAt)}` : "대여 기록 없음"}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.returnBtn}
                  onClick={() => handleReturn(row.재고번호)}
                  disabled={pending}
                >
                  {workingId === row.재고번호 ? "처리 중..." : "반납 완료"}
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
              <li key={entry.번호}>
                <span>
                  <b>{entry.row.시약명}</b> · 재고 #{entry.재고번호} → {entry.row.보관위치}
                  {entry.대여자 && <span className={styles.historyTime}> · {entry.대여자}</span>}
                </span>
                <span className={styles.historyTime}>{formatDateTime(entry.반납시각)} 반납</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

"use client";

// 재고 바구니 화면 (5차시, 8차시에 DB 저장으로 개편)
//   - 담은 재고와 "시약장 위치"를 보여 준다.
//   - [대여하기]를 누르면 서버가 DB에 "사용중"과 대여 기록을 남기고,
//     사용이 끝나면 돌려놓을 위치(=원래 보관 위치)를 안내한다.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Ledger.module.css";
import { useStore } from "../lib/store";
import { rentStocks } from "../app/rental/actions";

export default function BasketView() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { ready, basketRows, borrower, setBorrower, removeFromBasket, removeManyFromBasket } = useStore();

  const [done, setDone] = useState(null);   // 대여 결과 { rented, skipped }
  const [error, setError] = useState("");   // 실패 안내 글

  if (!ready) return <main className={styles.container} aria-busy="true" />;

  // 대여할 수 있는 재고 (이미 사용중이거나 유효기한이 지난 것은 제외)
  const isBlocked = (row) => row.현재상태 === "사용중" || row.expiry.state === "expired";
  const available = basketRows.filter((row) => !isBlocked(row));

  function handleRent() {
    setError("");
    startTransition(async () => {
      const result = await rentStocks(
        available.map((row) => row.재고번호),
        borrower
      );
      if (result.rented.length > 0) {
        removeManyFromBasket(result.rented.map((item) => item.id)); // 대여된 것만 바구니에서 뺀다
        setDone(result);
      } else {
        setError(result.message || "대여하지 못했어요.");
        if (result.skipped.length > 0) setDone(null);
      }
      router.refresh(); // 서버에서 최신 재고 상태를 다시 읽는다
    });
  }

  // ----- 대여 완료 화면 -----
  if (done) {
    return (
      <main className={styles.container}>
        <div className={styles.done}>
          <p className={styles.doneTitle}>✅ {done.rented.length}개 대여 완료</p>
          <p className={styles.doneText}>
            아래 재고는 &quot;사용중&quot;으로 기록되었어요. 다 쓰고 나면 <b>표시된 위치</b>에
            돌려놓고 반납하기에서 반납 처리해 주세요.
          </p>
        </div>
        <div className={styles.list}>
          {done.rented.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.place}>
                <span className={styles.placeLabel}>반납 위치</span>
                {item.보관위치}
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{item.시약명}</span>
                <p className={styles.meta}>
                  <span>재고 #{item.id}</span>
                  <span>남은 양 {item.남은양}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {done.skipped.length > 0 && (
          <div className={styles.skipBox}>
            <p className={styles.skipTitle}>대여하지 못한 재고 {done.skipped.length}개</p>
            <ul>
              {done.skipped.map((item) => (
                <li key={item.id}>
                  {item.시약명} #{item.id} — {item.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.bar}>
          <span />
          <div className={styles.barActions}>
            {done.skipped.length > 0 ? (
              <button type="button" className={styles.secondary} onClick={() => setDone(null)}>
                바구니로 돌아가기
              </button>
            ) : (
              <Link href="/" className={styles.secondary}>
                메인으로
              </Link>
            )}
            <Link href="/return" className={styles.primary}>
              ↩ 반납하기 화면
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ----- 바구니가 비었을 때 -----
  if (basketRows.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>재고 바구니</h1>
        </div>
        {error && <div className={styles.errorBox}>{error}</div>}
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🧺</div>
          <p className={styles.emptyTitle}>바구니가 비어 있어요.</p>
          <p className={styles.emptyHint}>시약 상세에서 재고를 골라 &quot;바구니에 담기&quot;를 눌러 보세요.</p>
          <Link href="/reagents" className={styles.primary}>
            시약 둘러보기
          </Link>
        </div>
      </main>
    );
  }

  // ----- 담은 재고 목록 -----
  return (
    <main className={styles.container}>
      <div className={styles.head}>
        <h1 className={styles.title}>재고 바구니</h1>
        <span className={styles.count}>{basketRows.length}개</span>
      </div>
      <p className={styles.hint}>시약장에서 아래 위치의 재고를 꺼내 오세요.</p>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.list}>
        {basketRows.map((row) => {
          const { state, days } = row.expiry;
          const inUse = row.현재상태 === "사용중";
          return (
            <div
              key={row.재고번호}
              className={`${styles.item} ${state === "expired" || inUse ? styles.itemExpired : ""}`}
            >
              <div className={styles.place}>
                <span className={styles.placeLabel}>보관 위치</span>
                {row.보관위치}
              </div>
              <div className={styles.info}>
                <Link href={`/stock/${row.재고번호}`} className={styles.name}>
                  {row.시약명}
                </Link>
                <p className={styles.meta}>
                  <span>재고 #{row.재고번호}</span>
                  <span>남은 양 {row.남은양}</span>
                  {state === "soon" && <span className={styles.soon}>유효기한 D-{days}</span>}
                  {state === "expired" && <span className={styles.warn}>유효기한 만료 · 대여 불가</span>}
                  {inUse && <span className={styles.warn}>누군가 사용중 · 대여 불가</span>}
                </p>
              </div>
              <button type="button" className={styles.remove} onClick={() => removeFromBasket(row.재고번호)}>
                빼기
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.borrowerBox}>
        <label htmlFor="borrower" className={styles.borrowerLabel}>
          대여자 <span className={styles.optional}>(선택 · 학번/이름)</span>
        </label>
        <input
          id="borrower"
          type="text"
          value={borrower}
          maxLength={20}
          placeholder="예) 2107 엄기찬"
          onChange={(event) => setBorrower(event.target.value)}
          className={styles.borrowerInput}
        />
      </div>

      <div className={styles.bar}>
        <span className={styles.barText}>대여 가능 {available.length}개</span>
        <div className={styles.barActions}>
          <Link href="/reagents" className={styles.secondary}>
            더 담기
          </Link>
          <button
            type="button"
            className={styles.primary}
            onClick={handleRent}
            disabled={pending || available.length === 0}
          >
            {pending ? "처리 중..." : `대여하기 (${available.length})`}
          </button>
        </div>
      </div>
    </main>
  );
}

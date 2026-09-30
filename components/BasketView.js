"use client";

// 재고 바구니 화면 (5차시)
//   - 담은 재고와 "시약장 위치"를 보여 준다.
//   - [대여하기]를 누르면 담은 재고가 모두 "사용중"이 되고,
//     사용이 끝나면 돌려놓을 위치(=원래 보관 위치)를 안내한다.

import { useState } from "react";
import Link from "next/link";
import styles from "./Ledger.module.css";
import { useStore } from "../lib/store";

export default function BasketView() {
  const { ready, basketRows, removeFromBasket, rentBasket } = useStore();
  // 방금 대여한 재고 (완료 안내 화면에 보여 주려고 잠깐 기억)
  const [rented, setRented] = useState(null);

  if (!ready) return <main className={styles.container} aria-busy="true" />;

  function handleRent() {
    setRented(basketRows);
    rentBasket();
  }

  // ----- 대여 완료 화면 -----
  if (rented) {
    return (
      <main className={styles.container}>
        <div className={styles.done}>
          <p className={styles.doneTitle}>✅ {rented.length}개 대여 완료</p>
          <p className={styles.doneText}>
            아래 재고는 &quot;사용중&quot;으로 바뀌었어요. 다 쓰고 나면 <b>표시된 위치</b>에
            돌려놓고 반납하기에서 반납 처리해 주세요.
          </p>
        </div>
        <div className={styles.list}>
          {rented.map((row) => (
            <div key={row.재고번호} className={styles.item}>
              <div className={styles.place}>
                <span className={styles.placeLabel}>반납 위치</span>
                {row.보관위치}
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{row.시약명}</span>
                <p className={styles.meta}>
                  <span>재고 #{row.재고번호}</span>
                  <span>남은 양 {row.남은양}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.bar}>
          <span />
          <div className={styles.barActions}>
            <Link href="/" className={styles.secondary}>
              메인으로
            </Link>
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

      <div className={styles.list}>
        {basketRows.map((row) => {
          const { state, days } = row.expiry;
          return (
            <div
              key={row.재고번호}
              className={`${styles.item} ${state === "expired" ? styles.itemExpired : ""}`}
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
                  {state === "expired" && <span className={styles.warn}>유효기한 만료</span>}
                </p>
              </div>
              <button type="button" className={styles.remove} onClick={() => removeFromBasket(row.재고번호)}>
                빼기
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.bar}>
        <span className={styles.barText}>총 {basketRows.length}개</span>
        <div className={styles.barActions}>
          <Link href="/reagents" className={styles.secondary}>
            더 담기
          </Link>
          <button type="button" className={styles.primary} onClick={handleRent}>
            대여하기 ({basketRows.length})
          </button>
        </div>
      </div>
    </main>
  );
}

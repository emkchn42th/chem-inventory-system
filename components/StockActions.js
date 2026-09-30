"use client";

// 재고 상세 화면의 큰 버튼 영역.
// 재고의 지금 상태에 따라 버튼이 바뀐다.
//   보관중 + 바구니에 없음  -> [바구니에 담기]
//   바구니에 담김           -> [바구니 보기] [빼기]
//   사용중                  -> [반납하러 가기]
//   유효기한 만료           -> 담기 불가 안내

import Link from "next/link";
import styles from "./StockActions.module.css";
import { useStore } from "../lib/store";

export default function StockActions({ id, expired, place }) {
  const { ready, statusOf, basket, addToBasket, removeFromBasket } = useStore();

  if (!ready) return <div className={styles.box} aria-busy="true" />;

  const status = statusOf(id);
  const inBasket = basket.includes(id);

  if (status === "사용중") {
    return (
      <div className={`${styles.box} ${styles.useBox}`}>
        <p className={styles.msg}>
          <strong>현재 사용중인 재고입니다.</strong> 다 쓴 뒤 <b>{place}</b> 에 돌려놓고 반납 처리하세요.
        </p>
        <Link href="/return" className={styles.primary}>
          ↩ 반납하러 가기
        </Link>
      </div>
    );
  }

  if (expired) {
    return (
      <div className={`${styles.box} ${styles.expiredBox}`}>
        <p className={styles.msg}>
          <strong>유효기한이 지난 재고는 대여할 수 없어요.</strong> 선생님께 폐기 방법을 문의하세요.
        </p>
        <button type="button" className={styles.disabled} disabled>
          🧺 바구니에 담을 수 없음
        </button>
      </div>
    );
  }

  if (inBasket) {
    return (
      <div className={styles.box}>
        <p className={styles.msg}>
          <strong>바구니에 담겼어요.</strong> 바구니에서 한꺼번에 대여할 수 있어요.
        </p>
        <div className={styles.row}>
          <Link href="/basket" className={styles.primary}>
            🧺 바구니 보기
          </Link>
          <button type="button" className={styles.secondary} onClick={() => removeFromBasket(id)}>
            빼기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <p className={styles.msg}>
        필요한 재고라면 바구니에 담고, 바구니에서 <strong>대여하기</strong>를 누르세요.
      </p>
      <button type="button" className={styles.primary} onClick={() => addToBasket(id)}>
        🧺 재고 바구니에 담기
      </button>
    </div>
  );
}

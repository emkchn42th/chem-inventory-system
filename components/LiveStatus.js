"use client";

// 재고의 "지금 상태"는 브라우저에 저장된 대여 기록에 따라 달라지므로
// 서버가 아니라 브라우저에서 그리는 작은 부품들을 모아 둔 파일.

import { useStore } from "../lib/store";

// 재고 카드에 붙는 "사용중" / "바구니에 담김" 배지
export function LiveBadges({ id, styles }) {
  const { ready, statusOf, basket } = useStore();
  if (!ready) return null;

  return (
    <>
      {statusOf(id) === "사용중" && <span className={styles.badgeUse}>사용중</span>}
      {basket.includes(id) && <span className={styles.badgeBasket}>바구니</span>}
    </>
  );
}

// 사용중인 재고 개수. name 을 주면 그 시약만, 안 주면 전체.
// 서버가 그린 기본값(fallback)으로 시작해서, 브라우저가 준비되면 실제 값으로 바뀐다.
export function UseCount({ name, fallback }) {
  const { ready, inUseRows } = useStore();
  if (!ready) return fallback;
  const rows = name ? inUseRows.filter((row) => row.시약명 === name) : inUseRows;
  return rows.length;
}

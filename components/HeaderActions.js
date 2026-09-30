"use client";

// 헤더 오른쪽의 "바구니 / 반납하기" 버튼.
// 바구니에 담긴 개수, 반납할 재고 개수를 숫자로 보여 준다.

import Link from "next/link";
import styles from "./SiteHeader.module.css";
import { useStore } from "../lib/store";

export default function HeaderActions() {
  const { ready, basket, inUseRows } = useStore();
  const basketCount = ready ? basket.length : 0;
  const useCount = ready ? inUseRows.length : 0;

  return (
    <div className={styles.actions}>
      <Link href="/basket" className={styles.actionButton}>
        🧺 바구니
        {basketCount > 0 && <span className={styles.countBadge}>{basketCount}</span>}
      </Link>
      <Link href="/return" className={styles.actionButton}>
        ↩ 반납하기
        {useCount > 0 && <span className={styles.countBadge}>{useCount}</span>}
      </Link>
    </div>
  );
}

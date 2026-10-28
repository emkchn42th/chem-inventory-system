"use client";

// 헤더 오른쪽 버튼들: 장부 / 바구니 / 반납하기 / 다크 모드
// 바구니에 담긴 개수, 반납할 재고 개수를 숫자로 보여 준다.
// 휴대폰 화면에서는 아래쪽 탭바(MobileNav)가 같은 역할을 하므로 다크 모드 버튼만 남긴다.

import Link from "next/link";
import styles from "./SiteHeader.module.css";
import ThemeToggle from "./ThemeToggle";
import { useStore } from "../lib/store";

export default function HeaderActions() {
  const { ready, basket, inUseRows } = useStore();
  const basketCount = ready ? basket.length : 0;
  const useCount = ready ? inUseRows.length : 0;

  return (
    <div className={styles.actions}>
      <Link href="/history" className={`${styles.actionButton} ${styles.desktopOnly}`}>
        📒 장부
      </Link>
      <Link href="/basket" className={`${styles.actionButton} ${styles.desktopOnly}`}>
        🧺 바구니
        {basketCount > 0 && <span className={styles.countBadge}>{basketCount}</span>}
      </Link>
      <Link href="/return" className={`${styles.actionButton} ${styles.desktopOnly}`}>
        ↩ 반납하기
        {useCount > 0 && <span className={styles.countBadge}>{useCount}</span>}
      </Link>
      <ThemeToggle className={`${styles.actionButton} ${styles.iconButton}`} />
    </div>
  );
}

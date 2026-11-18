"use client";

// 헤더 오른쪽 버튼들: 장부 / 바구니 / 반납하기 / 로그인(또는 내 이름·로그아웃) / 다크 모드
// 바구니에 담긴 개수, 내가 반납할 재고 개수를 숫자로 보여 준다.
// 휴대폰 화면에서는 아래쪽 탭바(MobileNav)가 장부·바구니·반납을 맡으므로
// 로그인 버튼과 다크 모드 버튼만 남긴다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SiteHeader.module.css";
import ThemeToggle from "./ThemeToggle";
import { useStore } from "../lib/store";
import { logout } from "../app/login/actions";

export default function HeaderActions() {
  const pathname = usePathname() ?? "/";
  const { ready, basket, myInUseRows, user } = useStore();
  const basketCount = ready ? basket.length : 0;
  const useCount = ready ? myInUseRows.length : 0;
  const loginHref = pathname.startsWith("/login") ? "/login" : `/login?next=${encodeURIComponent(pathname)}`;

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

      {user ? (
        <form action={logout} className={styles.userBox}>
          <span className={styles.userName} title={user.email}>
            👤 {user.label}
            {user.isAdmin && <span className={styles.adminTag}>관리자</span>}
          </span>
          <button type="submit" className={`${styles.actionButton} ${styles.logoutButton}`}>
            로그아웃
          </button>
        </form>
      ) : (
        <Link href={loginHref} className={`${styles.actionButton} ${styles.loginButton}`}>
          로그인
        </Link>
      )}

      <ThemeToggle className={`${styles.actionButton} ${styles.iconButton}`} />
    </div>
  );
}

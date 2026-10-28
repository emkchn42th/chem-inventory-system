"use client";

// 휴대폰 화면 아래쪽 탭바 (추가 기능 단계)
// 시약실에서는 휴대폰으로 쓸 일이 많아서, 엄지로 누르기 쉬운 아래쪽에 주요 메뉴를 둔다.
// 640px 보다 넓은 화면에서는 숨긴다. (헤더 버튼이 같은 역할)

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MobileNav.module.css";
import { useStore } from "../lib/store";

const TABS = [
  { href: "/", label: "홈", icon: "🏠", match: (path) => path === "/" },
  { href: "/reagents", label: "시약", icon: "🧪", match: (path) => path.startsWith("/reagents") || path.startsWith("/stock") },
  { href: "/basket", label: "바구니", icon: "🧺", match: (path) => path.startsWith("/basket"), count: "basket" },
  { href: "/return", label: "반납", icon: "↩", match: (path) => path.startsWith("/return"), count: "inuse" },
  { href: "/history", label: "장부", icon: "📒", match: (path) => path.startsWith("/history") },
];

export default function MobileNav() {
  const pathname = usePathname() ?? "/";
  const { ready, basket, inUseRows } = useStore();
  const counts = { basket: ready ? basket.length : 0, inuse: ready ? inUseRows.length : 0 };

  return (
    <nav className={styles.nav} aria-label="주요 메뉴">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        const count = tab.count ? counts[tab.count] : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className={styles.icon} aria-hidden="true">
              {tab.icon}
              {count > 0 && <span className={styles.badge}>{count}</span>}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

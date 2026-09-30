// 메인 화면
//
// 계획서 3번 화면 스케치를 바탕으로, 네이버쇼핑·배달의민족처럼
// 화면 폭을 꽉 채우는 구조로 짰다.
//
// 구성 순서
//   1) 헤더       : 서비스 이름 + 바구니/반납하기 + 검색란 (components/SiteHeader.js)
//   2) 현황 요약  : 1차시 data 파일을 읽어 시약/재고 개수를 보여줌
//   3) 카테고리   : 산 / 유기 / 염기 / 금속 — 누르면 해당 목록 화면으로 이동 (3차시)
//   4) 만료 경고  : 유효기한이 지난 재고 목록

import Link from "next/link";
import styles from "./page.module.css";
import SiteHeader from "../components/SiteHeader";
import { CATEGORIES } from "../lib/categories";
import {
  loadReagents,
  loadInventory,
  buildSummary,
  countByCategory,
  isExpired,
} from "../lib/data";
import { UseCount } from "../components/LiveStatus";

// 페이지를 미리 만들어 두지 않고 열어볼 때마다 새로 그리게 한다.
// (유효기한 만료 여부는 "오늘 날짜" 기준이라 미리 계산해두면 안 되기 때문)
export const dynamic = "force-dynamic";

export default function Home() {
  // 1차시에 만든 데이터 파일을 읽어온다.
  const reagents = loadReagents();
  const inventory = loadInventory();

  const summary = buildSummary(reagents, inventory);
  const categoryCounts = countByCategory(reagents);
  const expiredList = inventory.filter((row) => isExpired(row));

  return (
    <div className={styles.page}>
      {/* ===== 1. 헤더 + 검색란 ===== */}
      <SiteHeader />

      <main className={styles.container}>
        {/* ===== 2. 현황 요약 ===== */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>시약실 현황</h2>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>등록된 시약</p>
              <p className={styles.summaryValue}>
                {summary.시약종류}
                <span className={styles.summaryUnit}>종</span>
              </p>
            </div>

            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>전체 재고</p>
              <p className={styles.summaryValue}>
                {summary.전체재고}
                <span className={styles.summaryUnit}>개</span>
              </p>
            </div>

            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>사용중</p>
              <p className={styles.summaryValue}>
                <UseCount fallback={summary.사용중} />
                <span className={styles.summaryUnit}>개</span>
              </p>
            </div>

            {/* 만료된 재고가 있으면 카드를 빨갛게 강조한다 */}
            <div
              className={`${styles.summaryCard} ${
                summary.만료 > 0 ? styles.alertCard : ""
              }`}
            >
              <p className={styles.summaryLabel}>유효기한 만료</p>
              <p
                className={`${styles.summaryValue} ${
                  summary.만료 > 0 ? styles.alertValue : ""
                }`}
              >
                {summary.만료}
                <span className={styles.summaryUnit}>개</span>
              </p>
            </div>
          </div>
        </section>

        {/* ===== 3. 카테고리 ===== */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>카테고리로 찾기</h2>

          <div className={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              // 누르면 /reagents?category=산 처럼 목록 화면으로 이동한다.
              // query 에 한글을 넣어도 Next.js가 주소에 맞게 바꿔 준다.
              <Link
                key={category.name}
                href={{ pathname: "/reagents", query: { category: category.name } }}
                className={styles.categoryCard}
              >
                <span
                  className={`${styles.categoryIcon} ${styles[category.key]}`}
                >
                  {category.emoji}
                </span>
                <span className={styles.categoryName}>{category.name}</span>
                <span className={styles.categoryCount}>
                  시약 {categoryCounts[category.name] ?? 0}종
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== 4. 유효기한 만료 경고 ===== */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>확인이 필요한 재고</h2>

          {expiredList.length === 0 ? (
            <p className={styles.emptyText}>
              유효기한이 지난 재고가 없습니다.
            </p>
          ) : (
            <div className={styles.alertList}>
              {expiredList.map((row) => (
                <div key={row.재고번호} className={styles.alertRow}>
                  <span className={styles.alertBadge}>만료</span>
                  <span className={styles.alertName}>{row.시약명}</span>
                  <span className={styles.alertPlace}>{row.보관위치}</span>
                  <span className={styles.alertMeta}>
                    유효기한 {row.유효기한}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

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
//
// 추가 기능 단계에서 더한 것
//   - 맨 위 "유효기한 임박" 알림 배너 (30일 안)
//   - 최근 본 시약 (이 브라우저 기준)
//   - 주문이 필요한 시약 (재고 없음 / 잔량 부족)

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
  getExpiryInfo,
  getOrderNeed,
} from "../lib/data";
import { UseCount } from "../components/LiveStatus";
import { RecentReagents } from "../components/RecentReagents";

// 알림 배너에 띄울 기준 (오늘부터 며칠 안에 끝나는 재고)
const SOON_DAYS = 30;

// 페이지를 미리 만들어 두지 않고 열어볼 때마다 새로 그리게 한다.
// (유효기한 만료 여부는 "오늘 날짜" 기준이라 미리 계산해두면 안 되기 때문)
export const dynamic = "force-dynamic";

export default async function Home() {
  // 1차시에 만든 데이터 파일을 읽어온다.
  const reagents = await loadReagents();
  const inventory = await loadInventory();

  const summary = buildSummary(reagents, inventory);
  const categoryCounts = countByCategory(reagents);
  const expiredList = inventory.filter((row) => isExpired(row));

  // 30일 안에 유효기한이 끝나는 재고 (이미 지난 것은 아래 "확인이 필요한 재고"에서 보여 줌)
  const today = new Date();
  const soonList = inventory
    .map((row) => ({ ...row, expiry: getExpiryInfo(row, today) }))
    .filter((row) => row.expiry.days !== null && row.expiry.days >= 0 && row.expiry.days <= SOON_DAYS)
    .sort((a, b) => a.expiry.days - b.expiry.days);

  // 주문이 필요한 시약
  const orderList = reagents
    .map((reagent) => ({ name: reagent.시약명, reason: getOrderNeed(inventory, reagent.시약명, today) }))
    .filter((item) => item.reason);

  return (
    <div className={styles.page}>
      {/* ===== 1. 헤더 + 검색란 ===== */}
      <SiteHeader />

      <main className={styles.container}>
        {/* ===== 유효기한 임박 알림 배너 ===== */}
        {soonList.length > 0 && (
          <div className={styles.soonBanner} role="alert">
            <p className={styles.soonTitle}>
              ⏰ {SOON_DAYS}일 안에 유효기한이 끝나는 재고 <strong>{soonList.length}개</strong>
            </p>
            <div className={styles.soonChips}>
              {soonList.map((row) => (
                <Link key={row.재고번호} href={`/stock/${row.재고번호}`} className={styles.soonChip}>
                  {row.시약명} #{row.재고번호}
                  <span className={styles.soonDay}>D-{row.expiry.days}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== 최근 본 시약 (브라우저에 기록이 있을 때만) ===== */}
        <RecentReagents />

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

        {/* ===== 주문이 필요한 시약 ===== */}
        {orderList.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>주문이 필요한 시약</h2>
            <div className={styles.orderList}>
              {orderList.map((item) => (
                <Link
                  key={item.name}
                  href={`/reagents/${encodeURIComponent(item.name)}`}
                  className={styles.orderRow}
                >
                  <span className={styles.orderBadge}>주문 필요</span>
                  <span className={styles.alertName}>{item.name}</span>
                  <span className={styles.alertMeta}>{item.reason}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

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
                <Link key={row.재고번호} href={`/stock/${row.재고번호}`} className={styles.alertRow}>
                  <span className={styles.alertBadge}>만료</span>
                  <span className={styles.alertName}>{row.시약명}</span>
                  <span className={styles.alertPlace}>{row.보관위치}</span>
                  <span className={styles.alertMeta}>
                    유효기한 {row.유효기한}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

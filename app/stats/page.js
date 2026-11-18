// 사용 통계 화면 (추가 기능)
// 대여 기록(rentals)을 모아 어떤 시약을 언제 얼마나 빌렸는지 보여 준다.
// 다음 학기 시약 주문 계획을 세울 때 참고할 수 있다.

import Link from "next/link";
import styles from "./page.module.css";
import SiteHeader from "../../components/SiteHeader";
import BarChart from "../../components/BarChart";
import { loadAllRentals, loadInventoryAll } from "../../lib/data";
import { loadReagentIndex } from "../../lib/reagent-index";
import { CATEGORIES } from "../../lib/categories";

export const dynamic = "force-dynamic";

export const metadata = { title: "사용 통계 · 시약관리대장" };

const KST = 9 * 3600 * 1000;
const kstDate = (iso) => new Date(Date.parse(iso) + KST); // 한국 시간으로 바꾼 날짜 (getUTC… 로 읽는다)
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function StatsPage() {
  const [rentals, inventory, index] = await Promise.all([loadAllRentals(), loadInventoryAll(), loadReagentIndex()]);
  const nameOf = new Map(inventory.map((row) => [row.재고번호, row.시약명]));
  const categoriesOf = new Map(index.map((item) => [item.name, item.categories]));

  // 대여 시각이 있는 기록만 통계에 쓴다 (로그인 기능 전 옛 기록은 시각이 없을 수 있음)
  const dated = rentals.filter((item) => item.대여시각);
  const now = kstDate(new Date().toISOString());
  const thisMonth = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;

  // ----- 요약 숫자 -----
  const monthCount = dated.filter((item) => {
    const d = kstDate(item.대여시각);
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}` === thisMonth;
  }).length;
  const durations = dated
    .filter((item) => item.반납시각)
    .map((item) => (Date.parse(item.반납시각) - Date.parse(item.대여시각)) / 3600000)
    .filter((hours) => hours >= 0);
  const avgHours = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
  const openCount = rentals.filter((item) => !item.반납시각).length;
  const people = new Set(rentals.map((item) => item.대여자).filter(Boolean)).size;

  // ----- 월별 (최근 6개월) -----
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`, label: `${d.getUTCMonth() + 1}월`, value: 0 });
  }
  dated.forEach((item) => {
    const d = kstDate(item.대여시각);
    const month = months.find((m) => m.key === `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`);
    if (month) month.value += 1;
  });

  // ----- 많이 빌린 시약 (상위 8개) -----
  const byReagent = {};
  rentals.forEach((item) => {
    const name = nameOf.get(item.재고번호) ?? "(삭제된 재고)";
    byReagent[name] = (byReagent[name] ?? 0) + 1;
  });
  const topReagents = Object.entries(byReagent)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "ko"))
    .slice(0, 8);

  // ----- 카테고리별 (시약 하나가 여러 카테고리면 각각 센다) -----
  const byCategory = Object.fromEntries([...CATEGORIES.map((c) => [c.name, 0]), ["기타", 0]]);
  rentals.forEach((item) => {
    const cats = categoriesOf.get(nameOf.get(item.재고번호)) ?? [];
    if (cats.length === 0) byCategory.기타 += 1;
    cats.forEach((cat) => {
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    });
  });
  const categoryData = Object.entries(byCategory).map(([label, value]) => ({ label, value }));

  // ----- 요일별 -----
  const weekdayData = WEEKDAYS.map((label) => ({ label, value: 0 }));
  dated.forEach((item) => {
    weekdayData[kstDate(item.대여시각).getUTCDay()].value += 1;
  });

  const empty = rentals.length === 0;

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>📊 사용 통계</h1>
          <Link href="/history" className={`${styles.tool} noPrint`}>
            📒 대여 장부로
          </Link>
        </div>
        <p className={styles.sub}>대여 기록 {rentals.length}건을 바탕으로 계산했어요. (시간은 한국 시간 기준)</p>

        <div className={styles.tiles}>
          <div className={styles.tile}>
            <span>전체 대여</span>
            <b>{rentals.length}</b>
          </div>
          <div className={styles.tile}>
            <span>이번 달 대여</span>
            <b>{monthCount}</b>
          </div>
          <div className={styles.tile}>
            <span>평균 사용 시간</span>
            <b>{avgHours === null ? "-" : avgHours < 1 ? `${Math.round(avgHours * 60)}분` : `${avgHours.toFixed(1)}시간`}</b>
          </div>
          <div className={styles.tile}>
            <span>지금 사용중</span>
            <b>{openCount}</b>
          </div>
          <div className={styles.tile}>
            <span>대여한 사람</span>
            <b>{people}</b>
          </div>
        </div>

        {empty ? (
          <p className={styles.empty}>아직 대여 기록이 없어요. 재고를 빌리고 반납하면 통계가 쌓여요.</p>
        ) : (
          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>월별 대여 횟수 (최근 6개월)</h2>
              <BarChart data={months} highlightLast caption="월별 대여 횟수" />
            </section>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>많이 빌린 시약</h2>
              <BarChart data={topReagents} direction="horizontal" caption="시약별 대여 횟수" />
            </section>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>카테고리별 대여</h2>
              <BarChart data={categoryData} direction="horizontal" caption="카테고리별 대여 횟수" />
              <p className={styles.note}>시약 하나에 카테고리가 여러 개면 각각 셌어요.</p>
            </section>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>요일별 대여</h2>
              <BarChart data={weekdayData} caption="요일별 대여 횟수" />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

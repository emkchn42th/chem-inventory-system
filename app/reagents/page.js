// 시약 목록 화면 (3차시)
//
// 주소 뒤에 붙은 조건(? 뒤쪽)에 따라 보여줄 시약을 고른다.
//   /reagents?category=산   ->  "산" 태그가 붙은 시약
//   /reagents?q=에탄        ->  이름에 "에탄"이 들어간 시약
//   /reagents               ->  전체 시약
//
// 시약 카드를 누르면 상세 화면(/reagents/시약이름)으로 이동한다. (4차시)
//
// 추가 기능 단계
//   ?sort=name|stock|expiry      정렬 (이름순 / 재고 적은 순 / 유효기한 빠른 순)
//   ?filter=inuse|soon|expired|order   필터
//   카드에 마우스를 올리면 위험 정보 미리보기가 뜬다. (CSS 만으로 동작)

import Link from "next/link";
import styles from "./page.module.css";
import SiteHeader from "../../components/SiteHeader";
import { UseCount } from "../../components/LiveStatus";
import { CATEGORIES } from "../../lib/categories";
import {
  loadReagents,
  loadInventory,
  filterByCategory,
  searchByName,
  getCategories,
  summarizeStock,
  sortReagents,
  filterReagents,
  getOrderNeed,
} from "../../lib/data";
import { buildMsdsView } from "../../lib/msds";

const SORTS = [
  { key: "name", label: "이름순" },
  { key: "stock", label: "재고 적은 순" },
  { key: "expiry", label: "유효기한 빠른 순" },
];

const FILTERS = [
  { key: "", label: "전체" },
  { key: "inuse", label: "사용중" },
  { key: "soon", label: "임박" },
  { key: "expired", label: "만료" },
  { key: "order", label: "주문 필요" },
];

// 재고 만료 여부가 오늘 날짜 기준이라 열 때마다 새로 그린다.
export const dynamic = "force-dynamic";

// 카테고리 이름으로 색깔용 key 를 찾는 표. 예) "산" -> "acid"
const CATEGORY_KEY = Object.fromEntries(
  CATEGORIES.map((category) => [category.name, category.key])
);

// 주소의 조건값을 글자로 꺼낸다.
// (?q=a&q=b 처럼 같은 이름이 두 번 오면 배열이 되므로 첫 번째만 쓴다)
function readParam(value) {
  const first = Array.isArray(value) ? value[0] : value;
  return (first ?? "").trim();
}

export default async function ReagentsPage({ searchParams }) {
  // 1) 주소에서 조건 꺼내기
  const category = readParam(searchParams.category);
  const keyword = readParam(searchParams.q);
  const sort = SORTS.some((item) => item.key === readParam(searchParams.sort)) ? readParam(searchParams.sort) : "name";
  const filter = FILTERS.some((item) => item.key === readParam(searchParams.filter)) ? readParam(searchParams.filter) : "";

  // 정렬·필터 링크를 만들 때 지금 조건(카테고리/검색어)은 그대로 두고 바꿀 값만 덮어쓴다
  const linkWith = (changes) => {
    const query = { category, q: keyword, sort, filter, ...changes };
    Object.keys(query).forEach((key) => {
      if (!query[key] || (key === "sort" && query[key] === "name")) delete query[key];
    });
    return { pathname: "/reagents", query };
  };

  // 2) 데이터 읽기
  const reagents = await loadReagents();
  const inventory = await loadInventory();

  // 3) 조건에 맞게 거르고, 화면 제목도 조건에 맞춰 정한다
  let results;
  let title;

  if (category) {
    results = filterByCategory(reagents, category);
    title = `${category} 시약`;
  } else if (keyword) {
    results = searchByName(reagents, keyword);
    title = `'${keyword}' 검색 결과`;
  } else {
    results = reagents;
    title = "전체 시약";
  }

  results = sortReagents(filterReagents(results, inventory, filter), inventory, sort);

  return (
    <div className={styles.page}>
      {/* 방금 검색한 단어를 검색창에 다시 채워 둔다 */}
      <SiteHeader keyword={keyword} />

      <main className={styles.container}>
        {/* ===== 카테고리 탭 ===== */}
        <nav className={styles.tabs}>
          <Link
            href="/reagents"
            className={`${styles.tab} ${
              !category && !keyword ? styles.tabActive : ""
            }`}
          >
            전체
          </Link>
          {CATEGORIES.map((item) => (
            <Link
              key={item.name}
              href={{ pathname: "/reagents", query: { category: item.name } }}
              className={`${styles.tab} ${
                category === item.name ? styles.tabActive : ""
              }`}
            >
              {item.emoji} {item.name}
            </Link>
          ))}
        </nav>

        {/* ===== 제목 + 결과 개수 ===== */}
        <div className={styles.resultHead}>
          <h1 className={styles.resultTitle}>{title}</h1>
          <span className={styles.resultCount}>{results.length}종</span>
          <Link href="/stock/new" className={styles.addButton}>
            + 재고 추가
          </Link>
        </div>

        {/* ===== 필터·정렬 ===== */}
        <div className={styles.controls}>
          <div className={styles.filters} role="group" aria-label="필터">
            {FILTERS.map((item) => (
              <Link
                key={item.key || "all"}
                href={linkWith({ filter: item.key })}
                className={`${styles.filterChip} ${filter === item.key ? styles.filterActive : ""}`}
                aria-pressed={filter === item.key}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className={styles.sorts} role="group" aria-label="정렬">
            {SORTS.map((item) => (
              <Link
                key={item.key}
                href={linkWith({ sort: item.key })}
                className={`${styles.sortLink} ${sort === item.key ? styles.sortActive : ""}`}
                aria-pressed={sort === item.key}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ===== 결과 목록 ===== */}
        {results.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {filter ? "조건에 맞는 시약이 없습니다." : "찾는 시약이 없습니다."}
            </p>
            <p className={styles.emptyHint}>
              이름 일부만 입력해도 찾을 수 있어요. (예: &quot;에탄&quot; → 에탄올)
            </p>
            <div className={styles.emptyActions}>
              <Link href="/reagents" className={styles.primaryLink}>
                전체 시약 보기
              </Link>
              <Link href="/" className={styles.secondaryLink}>
                메인으로
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {results.map((reagent) => {
              const stock = summarizeStock(inventory, reagent.시약명);
              const orderNeed = getOrderNeed(inventory, reagent.시약명);
              const msds = buildMsdsView(reagent);

              return (
                <Link
                  key={reagent.시약명}
                  href={`/reagents/${encodeURIComponent(reagent.시약명)}`}
                  className={styles.card}
                >
                  <div className={styles.cardTop}>
                    <h2 className={styles.name}>{reagent.시약명}</h2>
                    <div className={styles.badgeRow}>
                      {orderNeed && <span className={styles.orderBadge}>주문 필요</span>}
                      {stock.만료 > 0 && (
                        <span className={styles.expiredBadge}>
                          만료 {stock.만료}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 정식 명칭이 우리가 붙인 이름과 다를 때만 보여준다 */}
                  <p className={styles.meta}>
                    {reagent.정식명칭 && reagent.정식명칭 !== reagent.시약명
                      ? `${reagent.정식명칭} · `
                      : ""}
                    CAS {reagent.CAS번호}
                  </p>

                  {/* 카테고리 태그 (여러 개일 수 있음) */}
                  <div className={styles.tags}>
                    {getCategories(reagent).map((name) => (
                      <span
                        key={name}
                        className={`${styles.tag} ${
                          styles[CATEGORY_KEY[name]] ?? ""
                        }`}
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  {/* 재고 현황 */}
                  <div className={styles.stock}>
                    <span>
                      재고 <strong>{stock.전체}</strong>개
                    </span>
                    <span className={styles.dot}>·</span>
                    <span>
                      사용중 <strong><UseCount name={reagent.시약명} fallback={stock.사용중} /></strong>개
                    </span>
                  </div>

                  {/* ===== 마우스를 올리면 뜨는 위험 정보 미리보기 ===== */}
                  <div className={styles.preview} aria-hidden="true">
                    <div className={styles.previewHead}>
                      <span className={styles.previewTitle}>위험 정보 미리보기</span>
                      {msds.signal && (
                        <span
                          className={`${styles.previewSignal} ${
                            msds.signal === "위험" ? styles.previewDanger : ""
                          }`}
                        >
                          {msds.signal}
                        </span>
                      )}
                    </div>
                    {msds.pictograms.length > 0 && (
                      <div className={styles.previewPicto}>
                        {msds.pictograms.map((item) => (
                          <span key={item.key}>
                            {item.emoji} {item.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <ul className={styles.previewList}>
                      {msds.hazardStatements.slice(0, 3).map((item) => (
                        <li key={item.code}>{item.text}</li>
                      ))}
                    </ul>
                    {orderNeed && <p className={styles.previewOrder}>📦 주문 필요 · {orderNeed}</p>}
                    <p className={styles.previewMore}>눌러서 자세히 보기 ›</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

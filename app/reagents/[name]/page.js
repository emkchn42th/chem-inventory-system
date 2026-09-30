// 시약 상세 화면 (4차시)
//
// 주소 예) /reagents/에탄올
//
// 보여주는 순서
//   1) 시약 이름·카테고리 태그·CAS 번호
//   2) 위험성 요약  : 신호어, 그림문자, 유해성 분류, 유해·위험문구
//   3) 재고 목록    : 개봉일·유효기한·남은 양·위치, 만료/사용중 표시
//   4) 물리화학적 특성 (표)
//   5) 안전관리     : 취급·저장방법, 응급조치, 예방·대응 조치문구 (접었다 펼치기)
//
// 재고 하나를 눌러 상세를 보고 바구니에 담는 기능은 5차시에서 만든다.

import Link from "next/link";
import styles from "./page.module.css";
import SiteHeader from "../../../components/SiteHeader";
import { CATEGORIES } from "../../../lib/categories";
import {
  loadReagents,
  loadInventory,
  findReagent,
  getStockOf,
  getCategories,
  getExpiryInfo,
} from "../../../lib/data";
import { buildMsdsView } from "../../../lib/msds";

// 유효기한 판단이 오늘 날짜 기준이라 열 때마다 새로 그린다.
export const dynamic = "force-dynamic";

const CATEGORY_KEY = Object.fromEntries(
  CATEGORIES.map((category) => [category.name, category.key])
);

// 주소의 한글은 %EC%97%90... 처럼 바뀌어 있어서 원래 글자로 되돌린다.
function decodeName(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// 남은 양 "상/중/하" 를 막대로 보여주기 위한 표
const AMOUNT_LEVEL = { 상: 3, 중: 2, 하: 1 };

export default function ReagentDetailPage({ params }) {
  const name = decodeName(params.name);

  const reagents = loadReagents();
  const inventory = loadInventory();
  const reagent = findReagent(reagents, name);

  // 없는 시약 주소로 들어온 경우
  if (!reagent) {
    return (
      <div className={styles.page}>
        <SiteHeader />
        <main className={styles.container}>
          <div className={styles.notFound}>
            <p className={styles.notFoundTitle}>등록되지 않은 시약입니다.</p>
            <p className={styles.notFoundHint}>&quot;{name}&quot;을(를) 찾을 수 없어요.</p>
            <Link href="/reagents" className={styles.primaryLink}>
              전체 시약 보기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const msds = buildMsdsView(reagent);
  const stock = getStockOf(inventory, reagent.시약명);
  const today = new Date();

  // 재고마다 유효기한 상태를 미리 계산해 둔다
  const stockRows = stock.map((row) => ({ ...row, expiry: getExpiryInfo(row, today) }));
  const expiredCount = stockRows.filter((row) => row.expiry.state === "expired").length;

  // 신호어가 "위험"이면 빨강, "경고"면 주황
  const signalClass =
    msds.signal === "위험" ? styles.signalDanger : styles.signalWarning;

  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.container}>
        <Link href="/reagents" className={styles.back}>
          ← 목록으로
        </Link>

        {/* ===== 1. 제목 ===== */}
        <section className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{reagent.시약명}</h1>
            <div className={styles.tags}>
              {getCategories(reagent).map((category) => (
                <span
                  key={category}
                  className={`${styles.tag} ${styles[CATEGORY_KEY[category]] ?? ""}`}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
          <p className={styles.meta}>
            {reagent.정식명칭 && reagent.정식명칭 !== reagent.시약명
              ? `${reagent.정식명칭} · `
              : ""}
            CAS {reagent.CAS번호}
          </p>
        </section>

        {/* ===== 2. 위험성 요약 ===== */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>위험성</h2>
            {msds.signal && (
              <span className={`${styles.signal} ${signalClass}`}>{msds.signal}</span>
            )}
          </div>

          {msds.pictograms.length > 0 && (
            <div className={styles.pictograms}>
              {msds.pictograms.map((item) => (
                <span key={item.key} className={styles.pictogram}>
                  <span className={styles.pictogramIcon}>{item.emoji}</span>
                  {item.name}
                </span>
              ))}
            </div>
          )}

          {msds.classes.length > 0 && (
            <div className={styles.classList}>
              {msds.classes.map((text) => (
                <span key={text} className={styles.classChip}>
                  {text.replace(" : ", " · ")}
                </span>
              ))}
            </div>
          )}

          {msds.hazardStatements.length > 0 && (
            <ul className={styles.statementList}>
              {msds.hazardStatements.map((item) => (
                <li key={item.code} className={styles.statement}>
                  <span className={styles.code}>{item.code}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ===== 3. 재고 목록 ===== */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>재고 목록</h2>
            <span className={styles.count}>{stockRows.length}개</span>
            {expiredCount > 0 && (
              <span className={styles.expiredNote}>만료 {expiredCount}개</span>
            )}
          </div>

          {stockRows.length === 0 ? (
            <p className={styles.emptyStock}>등록된 재고가 없습니다.</p>
          ) : (
            <div className={styles.stockGrid}>
              {stockRows.map((row) => {
                const { state, days } = row.expiry;
                const level = AMOUNT_LEVEL[row.남은양] ?? 0;

                return (
                  <article
                    key={row.재고번호}
                    className={`${styles.stockCard} ${
                      state === "expired" ? styles.stockExpired : ""
                    }`}
                  >
                    <div className={styles.stockTop}>
                      <span className={styles.stockNo}>재고 #{row.재고번호}</span>
                      <div className={styles.badges}>
                        {state === "expired" && (
                          <span className={styles.badgeExpired}>유효기한 만료</span>
                        )}
                        {state === "soon" && (
                          <span className={styles.badgeSoon}>임박 D-{days}</span>
                        )}
                        {row.현재상태 === "사용중" && (
                          <span className={styles.badgeUse}>사용중</span>
                        )}
                      </div>
                    </div>

                    <dl className={styles.stockInfo}>
                      <div>
                        <dt>보관 위치</dt>
                        <dd className={styles.place}>{row.보관위치}</dd>
                      </div>
                      <div>
                        <dt>개봉일</dt>
                        <dd>{row.개봉일 || "미개봉"}</dd>
                      </div>
                      <div>
                        <dt>유효기한</dt>
                        <dd className={state === "expired" ? styles.dateExpired : ""}>
                          {row.유효기한 || "-"}
                          {state === "expired" && (
                            <span className={styles.dayNote}> ({-days}일 지남)</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>남은 양</dt>
                        <dd className={styles.amount}>
                          <span className={styles.bars} aria-hidden="true">
                            {[1, 2, 3].map((n) => (
                              <span
                                key={n}
                                className={`${styles.bar} ${n <= level ? styles.barOn : ""}`}
                              />
                            ))}
                          </span>
                          {row.남은양}
                        </dd>
                      </div>
                    </dl>

                    {row.비고 && <p className={styles.note}>📝 {row.비고}</p>}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ===== 4. 물리화학적 특성 ===== */}
        {msds.properties.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>물리화학적 특성</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <tbody>
                  {msds.properties.map((row) => (
                    <tr key={row.label}>
                      <th>{row.label}</th>
                      <td>{row.value || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ===== 5. 안전관리 (MSDS) ===== */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>안전관리 (MSDS)</h2>

          <div className={styles.accordions}>
            <details className={styles.accordion} open>
              <summary>🚨 응급조치 요령</summary>
              {msds.firstAid.map((group) => (
                <div key={group.label} className={styles.group}>
                  <h3>{group.label}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>

            <details className={styles.accordion}>
              <summary>📦 취급 및 저장방법</summary>
              {msds.handling.map((group) => (
                <div key={group.label} className={styles.group}>
                  <h3>{group.label}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>

            {msds.precautions.length > 0 && (
              <details className={styles.accordion}>
                <summary>📋 예방·대응·저장·폐기 조치문구</summary>
                {msds.precautions.map((group) => (
                  <div key={group.title} className={styles.group}>
                    <h3>{group.title}</h3>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.code + item.text}>
                          <span className={styles.code}>{item.code}</span>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            )}
          </div>

          <p className={styles.source}>
            출처: 안전보건공단 물질안전보건자료(MSDS). 참고용이며 실제 취급 시에는
            시약병 라벨과 선생님의 안내를 따르세요.
          </p>
        </section>
      </main>
    </div>
  );
}

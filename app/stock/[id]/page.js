// 재고 상세 화면 (5차시)
//
// 주소 예) /stock/3   (3번 재고)
//
// 보여주는 순서
//   1) 시약 이름 + 재고 번호
//   2) 재고 정보    : 개봉일·유효기한·남은 양·보관 위치·비고
//   3) 바구니 버튼  : 담기 / 빼기 / 사용중 안내 (StockActions)
//   4) 안전관리     : 위험성 요약 + MSDS 취급·저장방법, 응급조치

import Link from "next/link";
import styles from "./page.module.css";
import SiteHeader from "../../../components/SiteHeader";
import StockActions from "../../../components/StockActions";
import { LiveBadges } from "../../../components/LiveStatus";
import {
  loadReagents,
  loadInventory,
  findReagent,
  getExpiryInfo,
} from "../../../lib/data";
import { buildMsdsView } from "../../../lib/msds";

export const dynamic = "force-dynamic";

const AMOUNT_LEVEL = { 상: 3, 중: 2, 하: 1 };

export default async function StockDetailPage({ params }) {
  const inventory = await loadInventory();
  const row = inventory.find((item) => item.재고번호 === params.id);

  if (!row) {
    return (
      <div className={styles.page}>
        <SiteHeader />
        <main className={styles.container}>
          <div className={styles.notFound}>
            <p className={styles.notFoundTitle}>없는 재고 번호입니다.</p>
            <Link href="/reagents" className={styles.link}>
              전체 시약 보기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const reagent = findReagent(await loadReagents(), row.시약명);
  const msds = reagent ? buildMsdsView(reagent) : null;
  const { state, days } = getExpiryInfo(row, new Date());
  const level = AMOUNT_LEVEL[row.남은양] ?? 0;
  const signalClass = msds?.signal === "위험" ? styles.signalDanger : styles.signalWarning;

  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.container}>
        <Link href={`/reagents/${encodeURIComponent(row.시약명)}`} className={styles.back}>
          ← {row.시약명} 재고 목록으로
        </Link>

        {/* ===== 1. 제목 ===== */}
        <section className={styles.titleBlock}>
          <h1 className={styles.title}>{row.시약명}</h1>
          <span className={styles.stockNo}>재고 #{row.재고번호}</span>
          <div className={styles.badges}>
            {state === "expired" && <span className={styles.badgeExpired}>유효기한 만료</span>}
            {state === "soon" && <span className={styles.badgeSoon}>임박 D-{days}</span>}
            <LiveBadges id={row.재고번호} styles={styles} />
          </div>
        </section>

        <div className={styles.layout}>
          <div className={styles.main}>
            {/* ===== 2. 재고 정보 ===== */}
            <section className={`${styles.card} ${state === "expired" ? styles.cardExpired : ""}`}>
              <h2 className={styles.cardTitle}>재고 정보</h2>
              <dl className={styles.info}>
                <div className={styles.placeBox}>
                  <dt>보관 위치 (시약장)</dt>
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
                    {state === "expired" && <span className={styles.dayNote}> ({-days}일 지남)</span>}
                    {state === "soon" && <span className={styles.daySoon}> ({days}일 남음)</span>}
                  </dd>
                </div>
                <div>
                  <dt>남은 양</dt>
                  <dd className={styles.amount}>
                    <span className={styles.bars} aria-hidden="true">
                      {[1, 2, 3].map((n) => (
                        <span key={n} className={`${styles.bar} ${n <= level ? styles.barOn : ""}`} />
                      ))}
                    </span>
                    {row.남은양}
                  </dd>
                </div>
                <div>
                  <dt>구매일</dt>
                  <dd>{row.구매일 || "-"}</dd>
                </div>
              </dl>
              {row.비고 && <p className={styles.note}>📝 {row.비고}</p>}
            </section>

            {/* ===== 3. 바구니 ===== */}
            <StockActions id={row.재고번호} expired={state === "expired"} place={row.보관위치} />
          </div>

          {/* ===== 4. 안전관리 ===== */}
          {msds && (
            <aside className={styles.safety}>
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>안전관리</h2>
                  {msds.signal && <span className={`${styles.signal} ${signalClass}`}>{msds.signal}</span>}
                </div>

                {msds.pictograms.length > 0 && (
                  <div className={styles.pictograms}>
                    {msds.pictograms.map((item) => (
                      <span key={item.key} className={styles.pictogram}>
                        {item.emoji} {item.name}
                      </span>
                    ))}
                  </div>
                )}

                {msds.hazardStatements.length > 0 && (
                  <ul className={styles.statements}>
                    {msds.hazardStatements.slice(0, 4).map((item) => (
                      <li key={item.code}>
                        <span className={styles.code}>{item.code}</span> {item.text}
                      </li>
                    ))}
                  </ul>
                )}

                <details className={styles.accordion} open>
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

                <details className={styles.accordion}>
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

                <Link href={`/reagents/${encodeURIComponent(row.시약명)}`} className={styles.moreLink}>
                  전체 MSDS 보기 ›
                </Link>
              </section>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

// 시약병 라벨 인쇄 화면 (추가 기능)
//
// 주소 예) /labels?ids=101,102      고른 재고의 라벨
//          /labels?reagent=황산      그 시약의 재고 라벨 전부
//
// 라벨 한 장에: 시약 이름·정식명칭·CAS, GHS 그림문자, 신호어, 주요 유해문구,
//               재고번호·보관 위치·개봉일·유효기한, 필요한 보호구
// A4 용지에 2열로 인쇄된다. (인쇄할 때는 헤더·버튼이 숨겨진다)

import Link from "next/link";
import styles from "./page.module.css";
import SiteHeader from "../../components/SiteHeader";
import PrintButton from "../../components/PrintButton";
import { loadReagents, loadInventory, findReagent } from "../../lib/data";
import { buildMsdsView } from "../../lib/msds";
import { ppeFromMsds, PPE_ITEMS } from "../../lib/ppe";
import { describeAmount } from "../../lib/amount";

export const dynamic = "force-dynamic";

export const metadata = { title: "라벨 인쇄 · 시약관리대장" };

const read = (value) => (Array.isArray(value) ? value[0] : value ?? "").trim();

export default async function LabelsPage({ searchParams }) {
  const reagentName = read(searchParams.reagent);
  const ids = read(searchParams.ids)
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d{1,9}$/.test(id))
    .slice(0, 60);

  const [reagents, inventory] = await Promise.all([loadReagents(), loadInventory()]);
  const rows = reagentName
    ? inventory.filter((row) => row.시약명 === reagentName)
    : inventory.filter((row) => ids.includes(row.재고번호));

  // 시약별 MSDS 요약은 한 번만 계산
  const infoCache = new Map();
  const infoOf = (name) => {
    if (!infoCache.has(name)) {
      const reagent = findReagent(reagents, name);
      const msds = reagent ? buildMsdsView(reagent) : null;
      infoCache.set(name, { reagent, msds, ppe: msds ? ppeFromMsds(msds) : [] });
    }
    return infoCache.get(name);
  };

  const backHref = reagentName
    ? `/reagents/${encodeURIComponent(reagentName)}`
    : ids.length === 1
      ? `/stock/${ids[0]}`
      : "/reagents";

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.container}>
        <div className={`${styles.bar} noPrint`}>
          <div>
            <Link href={backHref} className={styles.back}>
              ← 돌아가기
            </Link>
            <h1 className={styles.title}>🏷 라벨 인쇄 · {rows.length}장</h1>
            <p className={styles.hint}>A4 용지에 2열로 인쇄돼요. 인쇄 창에서 &quot;배경 그래픽&quot;을 켜면 색이 함께 나와요.</p>
          </div>
          {rows.length > 0 && <PrintButton className={styles.print} label="🖨 인쇄하기" />}
        </div>

        {rows.length === 0 ? (
          <p className={styles.empty}>인쇄할 재고가 없어요.</p>
        ) : (
          <div className={styles.sheet}>
            {rows.map((row) => {
              const { reagent, msds, ppe } = infoOf(row.시약명);
              const danger = msds?.signal === "위험";
              return (
                <article key={row.재고번호} className={styles.label}>
                  <div className={styles.labelHead}>
                    <span>CAS {reagent?.CAS번호 || "-"}</span>
                    <span>재고 #{row.재고번호}</span>
                  </div>

                  <div className={styles.labelBody}>
                    <div className={styles.nameBlock}>
                      <p className={styles.name}>{row.시약명}</p>
                      {reagent?.정식명칭 && reagent.정식명칭 !== row.시약명 && (
                        <p className={styles.official}>{reagent.정식명칭}</p>
                      )}
                      {msds?.signal && (
                        <span className={`${styles.signal} ${danger ? styles.signalDanger : ""}`}>{msds.signal}</span>
                      )}
                    </div>
                    <div className={styles.ghs}>
                      {(msds?.pictograms ?? []).slice(0, 4).map((item) => (
                        <span key={item.key} className={styles.diamond} title={item.name}>
                          <span>{item.emoji}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {msds?.hazardStatements?.length > 0 && (
                    <ul className={styles.hazards}>
                      {msds.hazardStatements.slice(0, 3).map((item) => (
                        <li key={item.code}>
                          <b>{item.code}</b> {item.text}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className={styles.ppe}>
                    {ppe.map((key) => (
                      <span key={key}>
                        {PPE_ITEMS[key].icon} {PPE_ITEMS[key].label}
                      </span>
                    ))}
                  </div>

                  <dl className={styles.foot}>
                    <div>
                      <dt>위치</dt>
                      <dd>{row.보관위치}</dd>
                    </div>
                    <div>
                      <dt>개봉일</dt>
                      <dd>{row.개봉일 || "미개봉"}</dd>
                    </div>
                    <div>
                      <dt>유효기한</dt>
                      <dd>{row.유효기한 || "-"}</dd>
                    </div>
                    <div>
                      <dt>용량</dt>
                      <dd>{describeAmount(row).mode === "정량" ? `${row.전체용량} ${row.단위}` : "-"}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

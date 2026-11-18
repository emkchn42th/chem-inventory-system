// 폐기 기록 화면 (추가 기능)
// 만료·파손으로 폐기 처리한 시약병의 기록. 누구나 볼 수 있고, 폐기 처리는 관리자만 한다.

import Link from "next/link";
import styles from "../history/page.module.css";
import SiteHeader from "../../components/SiteHeader";
import PrintButton from "../../components/PrintButton";
import { loadDisposed } from "../../lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "폐기 기록 · 시약관리대장" };

export default async function DisposalPage() {
  const list = await loadDisposed();

  // 처리 방법별 개수
  const byMethod = {};
  list.forEach((row) => {
    byMethod[row.폐기방법 || "기타"] = (byMethod[row.폐기방법 || "기타"] ?? 0) + 1;
  });
  const thisYear = new Date().getFullYear().toString();

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>🗑 폐기 기록</h1>
          <div className={`${styles.tools} noPrint`}>
            <Link href="/history" className={styles.tool}>
              📒 대여 장부
            </Link>
            <PrintButton className={styles.tool} />
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>전체 폐기</span>
            <b>{list.length}</b>
          </div>
          <div className={styles.stat}>
            <span>올해 폐기</span>
            <b>{list.filter((row) => (row.폐기일 || "").startsWith(thisYear)).length}</b>
          </div>
          <div className={styles.stat}>
            <span>처리 방법</span>
            <b className={styles.methodSummary}>
              {Object.entries(byMethod)
                .map(([method, count]) => `${method} ${count}`)
                .join(" · ") || "-"}
            </b>
          </div>
        </div>

        {list.length === 0 ? (
          <p className={styles.empty}>
            아직 폐기 기록이 없어요. 관리자는 재고의 &quot;수정·삭제·폐기&quot; 화면에서 폐기 처리할 수 있어요.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>폐기일</th>
                  <th>시약</th>
                  <th>처리 방법</th>
                  <th>처리한 사람</th>
                  <th>원래 위치</th>
                  <th>메모</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.재고번호}>
                    <td className={styles.time}>{row.폐기일 || "-"}</td>
                    <td>
                      <Link href={`/stock/${row.재고번호}`} className={styles.name}>
                        {row.시약명} <span className={styles.no}>#{row.재고번호}</span>
                      </Link>
                    </td>
                    <td>{row.폐기방법 || "-"}</td>
                    <td>{row.처리자 || "-"}</td>
                    <td className={styles.time}>{row.보관위치}</td>
                    <td className={styles.memo}>{row.폐기메모 || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

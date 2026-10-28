// 대여·반납 장부 화면 (추가 기능 단계)
//
// 주소 예) /history                 전체 기록 (최근 것부터)
//          /history?status=open     아직 반납 안 된 것만
//          /history?q=에탄올         시약 이름이나 대여자로 찾기
//
// 재고 목록과 대여 기록을 CSV(엑셀)로 내려받을 수 있다.

import Link from "next/link";
import styles from "./page.module.css";
import SiteHeader from "../../components/SiteHeader";
import PrintButton from "../../components/PrintButton";
import { loadInventory, loadRentals } from "../../lib/data";
import { isSupabaseConfigured } from "../../lib/supabase";
import { formatKST } from "../../lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "대여 장부 · 시약관리대장" };

const STATUS = [
  { key: "", label: "전체" },
  { key: "open", label: "사용중" },
  { key: "returned", label: "반납 완료" },
];

const read = (value) => (Array.isArray(value) ? value[0] : value ?? "").trim();
const normalize = (text) => (text ?? "").toLowerCase().replace(/\s+/g, "");

export default async function HistoryPage({ searchParams }) {
  const q = read(searchParams.q);
  const status = STATUS.some((item) => item.key === read(searchParams.status)) ? read(searchParams.status) : "";

  const [inventory, rentals] = await Promise.all([loadInventory(), loadRentals()]);
  const byId = new Map(inventory.map((row) => [row.재고번호, row]));

  const all = rentals.map((rental) => ({ ...rental, stock: byId.get(rental.재고번호) ?? null }));
  const word = normalize(q);
  const list = all.filter((item) => {
    if (status === "open" && item.반납시각) return false;
    if (status === "returned" && !item.반납시각) return false;
    if (!word) return true;
    return [item.stock?.시약명, item.대여자, `#${item.재고번호}`].some((text) => normalize(text).includes(word));
  });

  const openCount = all.filter((item) => !item.반납시각).length;
  const borrowers = new Set(all.map((item) => item.대여자).filter(Boolean)).size;
  const linkWith = (changes) => {
    const query = { q, status, ...changes };
    Object.keys(query).forEach((key) => !query[key] && delete query[key]);
    return { pathname: "/history", query };
  };

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.container}>
        <div className={styles.head}>
          <h1 className={styles.title}>📒 대여·반납 장부</h1>
          <div className={`${styles.tools} noPrint`}>
            <a href="/export/inventory" className={styles.tool} download>
              ⬇ 재고 목록 CSV
            </a>
            <a href="/export/rentals" className={styles.tool} download>
              ⬇ 대여 기록 CSV
            </a>
            <PrintButton className={styles.tool} />
          </div>
        </div>

        {!isSupabaseConfigured() && (
          <p className={styles.notice}>DB가 연결되지 않아 대여 기록이 없어요. (.env.local 을 확인하세요)</p>
        )}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>전체 기록</span>
            <b>{all.length}</b>
          </div>
          <div className={styles.stat}>
            <span>지금 사용중</span>
            <b>{openCount}</b>
          </div>
          <div className={styles.stat}>
            <span>대여한 사람</span>
            <b>{borrowers}</b>
          </div>
        </div>

        <div className={`${styles.controls} noPrint`}>
          <form action="/history" method="get" className={styles.search}>
            {status && <input type="hidden" name="status" value={status} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="시약 이름, 대여자, #재고번호로 찾기"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              찾기
            </button>
          </form>
          <div className={styles.tabs}>
            {STATUS.map((item) => (
              <Link
                key={item.key || "all"}
                href={linkWith({ status: item.key })}
                className={`${styles.tab} ${status === item.key ? styles.tabActive : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <p className={styles.empty}>{q || status ? "조건에 맞는 기록이 없어요." : "아직 대여 기록이 없어요."}</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>대여 시각</th>
                  <th>시약</th>
                  <th>대여자</th>
                  <th>위치</th>
                  <th>반납</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.번호}>
                    <td className={styles.time}>{formatKST(item.대여시각) || "기록 없음"}</td>
                    <td>
                      {item.stock ? (
                        <Link href={`/stock/${item.재고번호}`} className={styles.name}>
                          {item.stock.시약명} <span className={styles.no}>#{item.재고번호}</span>
                        </Link>
                      ) : (
                        <span className={styles.no}>(삭제된 재고 #{item.재고번호})</span>
                      )}
                    </td>
                    <td>{item.대여자 || <span className={styles.no}>-</span>}</td>
                    <td>{item.stock?.보관위치 ?? "-"}</td>
                    <td>
                      {item.반납시각 ? (
                        <span className={styles.time}>{formatKST(item.반납시각)}</span>
                      ) : (
                        <span className={styles.inUse}>사용중</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={styles.foot}>최근 300건까지 보여요. 전체 기록은 CSV로 내려받으세요.</p>
      </main>
    </div>
  );
}

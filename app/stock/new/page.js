// 재고 추가 화면 (7차시)
//
// 주소 예) /stock/new                  (시약을 직접 고른다)
//          /stock/new?reagent=에탄올   (에탄올이 미리 선택된다)

import Link from "next/link";
import styles from "./page.module.css";
import SiteHeader from "../../../components/SiteHeader";
import StockForm from "../../../components/StockForm";
import { loadReagents, loadInventory } from "../../../lib/data";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { todayText } from "../../../lib/stock-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "재고 추가 · 시약관리대장" };

export default async function NewStockPage({ searchParams }) {
  const reagents = await loadReagents();
  const inventory = await loadInventory();

  const wanted = Array.isArray(searchParams.reagent) ? searchParams.reagent[0] : searchParams.reagent;
  const reagentNames = reagents.map((reagent) => reagent.시약명);
  const defaultReagent = reagentNames.includes(wanted) ? wanted : "";

  // 이미 쓰는 위치 목록 (입력할 때 참고용 + 중복 방지)
  const locations = [...new Set(inventory.map((row) => row.보관위치))].sort();

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.container}>
        <Link
          href={defaultReagent ? `/reagents/${encodeURIComponent(defaultReagent)}` : "/reagents"}
          className={styles.back}
        >
          ← 돌아가기
        </Link>
        <h1 className={styles.title}>재고 추가하기</h1>
        <p className={styles.sub}>새로 들어온 시약병의 정보를 입력하세요. * 는 꼭 입력해야 해요.</p>

        <div className={styles.card}>
          <StockForm
            reagentNames={reagentNames}
            defaultReagent={defaultReagent}
            locations={locations}
            today={todayText()}
            dbReady={isSupabaseConfigured()}
          />
        </div>
      </main>
    </div>
  );
}

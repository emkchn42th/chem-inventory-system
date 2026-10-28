// 재고 수정 화면 (추가 기능 단계)
//
// 주소 예) /stock/3/edit
// 재고 추가 화면과 같은 폼(StockForm)을 쓰고, 처음부터 지금 값이 채워져 있다.
// 아래쪽에서 재고를 지울 수도 있다. (보관중일 때만)

import Link from "next/link";
import styles from "../../new/page.module.css";
import SiteHeader from "../../../../components/SiteHeader";
import StockForm from "../../../../components/StockForm";
import DeleteStock from "../../../../components/DeleteStock";
import { loadReagents, loadInventory } from "../../../../lib/data";
import { isSupabaseConfigured } from "../../../../lib/supabase";
import { todayText } from "../../../../lib/stock-form";
import { updateStock } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "재고 수정 · 시약관리대장" };

export default async function EditStockPage({ params }) {
  const [reagents, inventory] = await Promise.all([loadReagents(), loadInventory()]);
  const row = inventory.find((item) => item.재고번호 === params.id);

  if (!row) {
    return (
      <div className={styles.page}>
        <SiteHeader />
        <main className={styles.container}>
          <h1 className={styles.title}>없는 재고 번호입니다.</h1>
          <Link href="/reagents" className={styles.back}>
            전체 시약 보기
          </Link>
        </main>
      </div>
    );
  }

  const initial = {
    id: row.재고번호,
    reagent: row.시약명,
    purchased: row.구매일,
    opened: row.개봉일,
    unopened: !row.개봉일,
    expires: row.유효기한,
    amount: row.남은양 || "상",
    location: row.보관위치,
    note: row.비고,
  };
  const locations = [...new Set(inventory.map((item) => item.보관위치))].sort();

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.container}>
        <Link href={`/stock/${row.재고번호}`} className={styles.back}>
          ← 재고 상세로
        </Link>
        <h1 className={styles.title}>
          재고 수정 · {row.시약명} #{row.재고번호}
        </h1>
        <p className={styles.sub}>바뀐 내용만 고친 뒤 저장하세요. 남은 양이 줄었을 때도 여기서 바꿔요.</p>

        <div className={styles.card}>
          <StockForm
            action={updateStock}
            mode="edit"
            initial={initial}
            reagentNames={reagents.map((reagent) => reagent.시약명)}
            defaultReagent={row.시약명}
            locations={locations}
            today={todayText()}
            dbReady={isSupabaseConfigured()}
            cancelHref={`/stock/${row.재고번호}`}
          />
        </div>

        <DeleteStock id={row.재고번호} name={row.시약명} inUse={row.현재상태 === "사용중"} />
      </main>
    </div>
  );
}

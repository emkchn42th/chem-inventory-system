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
import { getUserWithRole } from "../../../../lib/auth";
import LoginRequired from "../../../../components/LoginRequired";
import DisposeStock from "../../../../components/DisposeStock";
import { findReagent, getExpiryInfo } from "../../../../lib/data";
import { buildMsdsView } from "../../../../lib/msds";

export const dynamic = "force-dynamic";

export const metadata = { title: "재고 수정 · 시약관리대장" };

export default async function EditStockPage({ params }) {
  const [reagents, inventory, user] = await Promise.all([loadReagents(), loadInventory(), getUserWithRole()]);
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
    amountMode: row.잔량방식 || "정성",
    amountValue: row.잔량값,
    capacity: row.전체용량,
    unit: row.단위 || "mL",
    location: row.보관위치,
    note: row.비고,
  };
  // MSDS 의 폐기 문구 (예: P501 폐기물 관련 법령에 따라...)
  const reagent = findReagent(reagents, row.시약명);
  const disposalGuide = reagent
    ? (buildMsdsView(reagent).precautions.find((group) => group.title === "폐기")?.items ?? []).map(
        (item) => `${item.code} ${item.text}`
      )
    : [];
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

        {/* 관리자(선생님)만 수정·삭제·폐기할 수 있다 */}
        {user?.isAdmin ? (
          <>
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

            {/* 폐기: 지우지 않고 기록을 남긴다. 아래 "삭제"는 잘못 입력한 재고를 지울 때만 */}
            <DisposeStock
              id={row.재고번호}
              name={row.시약명}
              inUse={row.현재상태 === "사용중"}
              expired={getExpiryInfo(row).state === "expired"}
              guide={disposalGuide}
            />
            <DeleteStock id={row.재고번호} name={row.시약명} inUse={row.현재상태 === "사용중"} />
          </>
        ) : (
          <LoginRequired next={`/stock/${row.재고번호}/edit`} what="재고 수정·삭제·폐기" adminOnly={Boolean(user)} />
        )}
      </main>
    </div>
  );
}

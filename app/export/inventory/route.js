// 재고 목록 CSV 내려받기 (추가 기능 단계)
// 주소: /export/inventory  → 엑셀에서 바로 열리는 CSV 파일

import { loadInventory } from "../../../lib/data";
import { getExpiryInfo } from "../../../lib/expiry";
import { toCsv, todayKST } from "../../../lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const inventory = await loadInventory();
  const today = new Date();

  const rows = [
    ["재고번호", "시약명", "구매일", "개봉일", "유효기한", "유효기한 상태", "남은양", "보관위치", "현재상태", "비고"],
    ...inventory.map((row) => {
      const { state, days } = getExpiryInfo(row, today);
      const label =
        state === "expired" ? `만료 (${-days}일 지남)` : state === "soon" ? `임박 (D-${days})` : state === "ok" ? "정상" : "";
      return [row.재고번호, row.시약명, row.구매일, row.개봉일 || "미개봉", row.유효기한, label, row.남은양, row.보관위치, row.현재상태, row.비고];
    }),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory-${todayKST()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

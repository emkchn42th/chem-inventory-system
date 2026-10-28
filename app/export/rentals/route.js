// 대여·반납 기록 CSV 내려받기 (추가 기능 단계)
// 주소: /export/rentals

import { loadInventory, loadRentals } from "../../../lib/data";
import { toCsv, formatKST, todayKST } from "../../../lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const [inventory, rentals] = await Promise.all([loadInventory(), loadRentals()]);
  const byId = new Map(inventory.map((row) => [row.재고번호, row]));

  const rows = [
    ["기록번호", "재고번호", "시약명", "보관위치", "대여자", "대여 시각", "반납 시각", "상태"],
    ...rentals.map((rental) => {
      const stock = byId.get(rental.재고번호);
      return [
        rental.번호,
        rental.재고번호,
        stock?.시약명 ?? "(삭제된 재고)",
        stock?.보관위치 ?? "",
        rental.대여자,
        formatKST(rental.대여시각) || "기록 없음",
        formatKST(rental.반납시각),
        rental.반납시각 ? "반납 완료" : "사용중",
      ];
    }),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rentals-${todayKST()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

// 재고 바구니 화면 (5차시) — 실제 내용은 BasketView 가 그린다.
import SiteHeader from "../../components/SiteHeader";
import BasketView from "../../components/BasketView";

export const metadata = { title: "재고 바구니 · 시약관리대장" };

export default function BasketPage() {
  return (
    <>
      <SiteHeader />
      <BasketView />
    </>
  );
}

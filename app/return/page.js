// 반납하기 화면 (5차시) — 실제 내용은 ReturnView 가 그린다.
import SiteHeader from "../../components/SiteHeader";
import ReturnView from "../../components/ReturnView";

export const metadata = { title: "반납하기 · 시약관리대장" };

export default function ReturnPage() {
  return (
    <>
      <SiteHeader />
      <ReturnView />
    </>
  );
}

// 모든 화면(페이지)에 공통으로 적용되는 레이아웃 파일.
// Next.js의 App Router에서는 이 파일이 <html>, <body> 태그를 담당하고,
// 각 페이지(app/page.js 등)는 children 자리에 끼워진다.
import "./globals.css";
import { StoreProvider } from "../lib/store";
import { loadInventory } from "../lib/data";

export const metadata = {
  title: "시약관리대장",
  description: "화학 시약 재고 및 안전관리 통합 시약관리대장 시스템",
};

// DB 내용이 바뀌면 바로 보이도록 매번 새로 그린다.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  // 바구니·반납 화면이 재고 정보를 알 수 있도록 서버에서 읽은 재고를 나눠 준다.
  // (6차시에 DB를 붙이면 loadInventory 가 DB에서 읽는다)
  const inventory = await loadInventory();

  return (
    <html lang="ko">
      <body>
        <StoreProvider inventory={inventory}>{children}</StoreProvider>
      </body>
    </html>
  );
}

// 모든 화면(페이지)에 공통으로 적용되는 레이아웃 파일.
// Next.js의 App Router에서는 이 파일이 <html>, <body> 태그를 담당하고,
// 각 페이지(app/page.js 등)는 children 자리에 끼워진다.
import "./globals.css";

export const metadata = {
  title: "시약관리대장",
  description: "화학 시약 재고 및 안전관리 통합 시약관리대장 시스템",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

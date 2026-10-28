"use client";

// 인쇄 버튼 (추가 기능 단계)
// 접혀 있는 MSDS 항목(<details>)을 모두 펼친 뒤 인쇄 창을 연다.
// 인쇄할 때는 헤더·버튼 같은 화면 전용 요소가 숨겨진다. (globals.css 의 @media print)

export default function PrintButton({ className, label = "🖨 인쇄" }) {
  function handlePrint() {
    const closed = [...document.querySelectorAll("details:not([open])")];
    closed.forEach((item) => item.setAttribute("open", ""));
    window.print();
    // 인쇄 창이 닫히면 원래대로 접는다
    closed.forEach((item) => item.removeAttribute("open"));
  }

  return (
    <button type="button" className={`${className ?? ""} noPrint`} onClick={handlePrint}>
      {label}
    </button>
  );
}

"use client";

// 라이트 / 다크 모드 전환 버튼 (추가 기능 단계)
// 처음에는 항상 밝은 화면으로 열고, 버튼을 누르면 그 선택을 기억한다.
// 실제 색 바꾸기는 app/globals.css 의 [data-theme="dark"] 값이 맡는다.

import { useEffect, useState } from "react";

export default function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(null); // 화면이 준비되기 전에는 모름

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // 저장이 안 돼도 이번 화면에는 적용된다
    }
    setTheme(next);
  }

  const label = theme === "dark" ? "라이트 모드로 바꾸기" : "다크 모드로 바꾸기";
  return (
    <button type="button" className={className} onClick={toggle} aria-label={label} title={label}>
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

// 화면이 그려지기 전에 테마를 정하는 짧은 스크립트 (깜빡임 방지용, layout.js 에서 사용)
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'){t='light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})();`;

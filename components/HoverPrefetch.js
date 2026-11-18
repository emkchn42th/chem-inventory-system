"use client";

// 링크에 마우스를 올리면 그 화면을 미리 받아 둔다 (속도 개선)
//
// 사람은 링크에 마우스를 올리고 실제로 누르기까지 보통 0.1~0.3초가 걸린다.
// 그 사이에 다음 화면을 서버에서 받아 두면, 누르는 순간 바로 바뀐다.
// (휴대폰은 손가락이 닿는 순간(touchstart)에 시작한다)
// 링크마다 따로 달지 않고, 화면 전체에서 한 번에 처리한다.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const RECENT_MS = 25000; // 같은 링크는 25초 안에 다시 받지 않는다

export default function HoverPrefetch() {
  const router = useRouter();

  useEffect(() => {
    const done = new Map();

    function prefetchFrom(event) {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return; // 다른 사이트 링크는 건드리지 않음
      if (url.pathname.startsWith("/export")) return; // 파일 내려받기 링크 제외
      const href = url.pathname + url.search;
      if (href === window.location.pathname + window.location.search) return;

      const last = done.get(href);
      if (last && Date.now() - last < RECENT_MS) return;
      done.set(href, Date.now());
      // kind "full": 로딩 화면만이 아니라 화면 내용 전체를 미리 받는다
      router.prefetch(href, { kind: "full" });
    }

    document.addEventListener("mouseover", prefetchFrom, { passive: true });
    document.addEventListener("touchstart", prefetchFrom, { passive: true });
    document.addEventListener("focusin", prefetchFrom);
    return () => {
      document.removeEventListener("mouseover", prefetchFrom);
      document.removeEventListener("touchstart", prefetchFrom);
      document.removeEventListener("focusin", prefetchFrom);
    };
  }, [router]);

  return null;
}

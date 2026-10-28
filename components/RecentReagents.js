"use client";

// 최근 본 시약 (추가 기능 단계)
//   TrackRecent     : 시약 상세 화면에 넣어 두면 "봤다"는 기록을 남긴다.
//   RecentReagents  : 메인 화면에 최근 본 시약을 칩으로 보여 준다.
// 기록은 이 브라우저에만 저장된다. (사람마다 다르니까)

import { useEffect } from "react";
import Link from "next/link";
import styles from "./RecentReagents.module.css";
import { useStore } from "../lib/store";

export function TrackRecent({ name }) {
  const { ready, addRecent } = useStore();
  useEffect(() => {
    if (ready) addRecent(name);
  }, [ready, name, addRecent]);
  return null;
}

export function RecentReagents() {
  const { ready, recent, infoOf } = useStore();
  const items = ready ? recent.map(infoOf).filter(Boolean) : [];
  if (items.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>최근 본 시약</h2>
      <div className={styles.row}>
        {items.map((item) => (
          <Link key={item.name} href={`/reagents/${encodeURIComponent(item.name)}`} className={styles.chip}>
            <span className={styles.icons} aria-hidden="true">
              {item.pictograms.slice(0, 2).map((p) => p.emoji).join("") || "🧪"}
            </span>
            {item.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

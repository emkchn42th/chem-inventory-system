"use client";

// 헤더 검색창 + 자동완성 + "/" 단축키 (추가 기능 단계)
//
// - 글자를 입력하면 아래에 맞는 시약 후보가 뜬다. (이름·정식명칭·CAS 번호로 찾음)
// - ↑ ↓ 로 고르고 Enter 를 누르면 그 시약 상세로 바로 간다.
// - 후보를 고르지 않고 Enter 를 누르면 예전처럼 검색 결과 목록(/reagents?q=)으로 간다.
// - 어느 화면에서든 "/" 키를 누르면 검색창으로 커서가 이동한다.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SiteHeader.module.css";
import { useStore } from "../lib/store";

const normalize = (text) => (text ?? "").toLowerCase().replace(/\s+/g, "");

// 찾은 부분을 굵게 보여 주기
function Highlight({ text, word }) {
  const index = text.toLowerCase().indexOf(word.toLowerCase());
  if (!word || index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + word.length)}</mark>
      {text.slice(index + word.length)}
    </>
  );
}

export default function HeaderSearch({ keyword = "" }) {
  const router = useRouter();
  const { reagents } = useStore();
  const inputRef = useRef(null);
  const [value, setValue] = useState(keyword);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => setValue(keyword), [keyword]);

  // "/" 단축키
  useEffect(() => {
    function onKey(event) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || document.activeElement?.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const word = value.trim();
  const results = useMemo(() => {
    const target = normalize(word);
    if (!target) return [];
    return reagents
      .filter((item) => [item.name, item.official, item.cas].some((text) => normalize(text).includes(target)))
      .slice(0, 6);
  }, [word, reagents]);

  function go(item) {
    setOpen(false);
    router.push(`/reagents/${encodeURIComponent(item.name)}`);
  }

  function onKeyDown(event) {
    if (!open || results.length === 0) {
      if (event.key === "ArrowDown" && results.length > 0) setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      go(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.searchWrap}>
      <form action="/reagents" method="get" className={styles.searchBar} role="search">
        <input
          ref={inputRef}
          type="text"
          name="q"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          aria-label="시약 검색"
          aria-expanded={open && word.length > 0}
          aria-controls="search-suggest"
          className={styles.searchInput}
          placeholder="찾는 시약 이름을 입력하세요 (예: 에탄올, 염산)"
        />
        {!value && <kbd className={styles.shortcutHint} title="어디서든 / 키를 누르면 검색창으로 이동">/</kbd>}
        <button type="submit" className={styles.searchButton}>
          검색
        </button>
      </form>

      {open && word.length > 0 && (
        <ul id="search-suggest" className={styles.suggest} role="listbox">
          {results.length === 0 ? (
            <li className={styles.suggestEmpty}>일치하는 시약이 없어요. Enter 로 전체 검색해 보세요.</li>
          ) : (
            results.map((item, index) => (
              <li
                key={item.name}
                role="option"
                aria-selected={index === active}
                className={`${styles.suggestItem} ${index === active ? styles.suggestActive : ""}`}
                onMouseDown={(event) => {
                  event.preventDefault(); // 입력칸이 먼저 닫히지 않게
                  go(item);
                }}
                onMouseEnter={() => setActive(index)}
              >
                <span className={styles.suggestName}>
                  <Highlight text={item.name} word={word} />
                </span>
                <span className={styles.suggestMeta}>
                  {item.official && item.official !== item.name ? `${item.official} · ` : ""}CAS {item.cas}
                </span>
                <span className={styles.suggestIcons} aria-hidden="true">
                  {item.pictograms.map((p) => p.emoji).join("")}
                </span>
                {item.signal && (
                  <span className={`${styles.suggestSignal} ${item.signal === "위험" ? styles.suggestDanger : ""}`}>
                    {item.signal}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

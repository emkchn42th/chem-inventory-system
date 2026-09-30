"use client";

// 바구니·대여·반납 상태를 브라우저에 저장하는 곳 (5차시)
//
// 아직 DB(Supabase)가 없으므로 상태를 브라우저의 localStorage 에 저장한다.
// 새로고침해도 유지되지만 "이 브라우저 안에서만" 보인다.
// 6~8차시에 DB를 붙이면 이 파일의 저장 부분만 DB 호출로 바꾸면 된다.
//
// 저장하는 것
//   basket    : 바구니에 담은 재고번호 목록          예) ["1", "5"]
//   overrides : CSV 상태 대신 적용할 현재 상태      예) { "1": "사용중" }
//   log       : 대여·반납 기록 (최근 것이 뒤에)
//               { id, rentedAt, returnedAt }  (날짜는 글자로 저장)

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { getExpiryInfo } from "./expiry";

const KEY = "chem-inventory-state-v1";
const EMPTY = { basket: [], overrides: {}, log: [] };

let cache = EMPTY;
let loaded = false;
const listeners = new Set();

function readStorage() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        basket: Array.isArray(parsed.basket) ? parsed.basket : [],
        overrides: parsed.overrides ?? {},
        log: Array.isArray(parsed.log) ? parsed.log : [],
      };
    }
  } catch {
    // 저장소를 못 읽으면 빈 상태로 시작한다
  }
  return EMPTY;
}

function getSnapshot() {
  if (!loaded) {
    cache = readStorage();
    loaded = true;
  }
  return cache;
}

function getServerSnapshot() {
  return EMPTY;
}

function subscribe(callback) {
  listeners.add(callback);
  // 다른 탭에서 바꾼 내용도 반영
  const onStorage = (event) => {
    if (event.key === KEY) {
      cache = readStorage();
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function commit(next) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 실패해도 화면은 계속 동작
  }
  listeners.forEach((listener) => listener());
}

// ---------------------------------------------------------------
// React 에서 쓰는 부분
// ---------------------------------------------------------------

const InventoryContext = createContext([]);

// layout.js 에서 서버가 읽은 재고 목록을 넘겨받아 아래쪽 화면 전체에 나눠 준다.
export function StoreProvider({ inventory, children }) {
  return (
    <InventoryContext.Provider value={inventory}>
      {children}
    </InventoryContext.Provider>
  );
}

const subscribeNothing = () => () => {};

export function useStore() {
  const inventory = useContext(InventoryContext);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // 서버에서 그린 화면과 맞추기 위해, 브라우저가 준비되기 전에는 false
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);

  // 재고 하나의 현재 상태 (저장된 값이 있으면 그것, 없으면 CSV 값)
  const statusOf = useCallback(
    (id) => {
      const row = inventory.find((item) => item.재고번호 === String(id));
      return state.overrides[id] ?? row?.현재상태 ?? "보관중";
    },
    [inventory, state]
  );

  const view = useMemo(() => {
    const byId = new Map(inventory.map((row) => [row.재고번호, row]));
    const now = new Date();

    const basketRows = state.basket
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((row) => ({ ...row, expiry: getExpiryInfo(row, now) }));

    // 지금 사용중인 재고 + 언제부터 사용중인지
    const inUseRows = inventory
      .filter((row) => (state.overrides[row.재고번호] ?? row.현재상태) === "사용중")
      .map((row) => {
        const open = [...state.log]
          .reverse()
          .find((entry) => entry.id === row.재고번호 && !entry.returnedAt);
        return { ...row, rentedAt: open?.rentedAt ?? null };
      });

    // 반납 완료 기록 (최근 순)
    const returnedLog = [...state.log]
      .filter((entry) => entry.returnedAt && byId.has(entry.id))
      .reverse()
      .slice(0, 10)
      .map((entry) => ({ ...entry, row: byId.get(entry.id) }));

    return { byId, basketRows, inUseRows, returnedLog };
  }, [inventory, state]);

  // ----- 동작 -----
  const addToBasket = useCallback((id) => {
    const current = getSnapshot();
    if (current.basket.includes(id)) return;
    commit({ ...current, basket: [...current.basket, id] });
  }, []);

  const removeFromBasket = useCallback((id) => {
    const current = getSnapshot();
    commit({ ...current, basket: current.basket.filter((item) => item !== id) });
  }, []);

  // 바구니에 담긴 재고를 모두 "사용중"으로 바꾼다. 대여한 재고 목록을 돌려준다.
  const rentBasket = useCallback(() => {
    const current = getSnapshot();
    const now = new Date().toISOString();
    const overrides = { ...current.overrides };
    const log = [...current.log];
    current.basket.forEach((id) => {
      overrides[id] = "사용중";
      log.push({ id, rentedAt: now, returnedAt: null });
    });
    commit({ basket: [], overrides, log });
  }, []);

  // 사용중인 재고를 반납 처리한다. (다시 "보관중")
  const returnStock = useCallback((id) => {
    const current = getSnapshot();
    const now = new Date().toISOString();
    const overrides = { ...current.overrides, [id]: "보관중" };
    let closed = false;
    const log = [...current.log]
      .reverse()
      .map((entry) => {
        if (!closed && entry.id === id && !entry.returnedAt) {
          closed = true;
          return { ...entry, returnedAt: now };
        }
        return entry;
      })
      .reverse();
    // 원래부터 사용중이던 재고(대여 기록이 없음)도 기록을 남긴다
    if (!closed) log.push({ id, rentedAt: null, returnedAt: now });
    commit({ ...current, overrides, log });
  }, []);

  return {
    ready,
    basket: state.basket,
    statusOf,
    addToBasket,
    removeFromBasket,
    rentBasket,
    returnStock,
    ...view,
  };
}

// 날짜 글자를 "9월 30일 14:05" 처럼 보기 좋게
export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
}

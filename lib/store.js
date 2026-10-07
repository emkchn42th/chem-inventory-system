"use client";

// 바구니와 화면에 필요한 재고·대여 정보를 모아 주는 곳 (5차시 → 8차시에 개편)
//
// 무엇을 어디에 저장하나
//   바구니(담아 둔 재고)  : 사람마다 다른 "임시 장바구니"라서 이 브라우저(localStorage)에 둔다.
//   대여자 이름           : 매번 쓰기 귀찮으니 브라우저에 기억해 둔다.
//   재고 상태·대여 기록    : 모두가 같이 봐야 하므로 DB(Supabase)에 있다.
//                           서버(layout.js)가 읽어서 StoreProvider 로 내려 준다.
//
// 대여/반납을 하면 DB가 바뀌고, router.refresh() 로 서버가 새로 읽어 와서
// 모든 화면의 숫자와 상태가 함께 바뀐다.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { getExpiryInfo } from "./expiry";

const KEY = "chem-inventory-basket-v2";
const EMPTY = { basket: [], borrower: "" };

let cache = EMPTY;
let loaded = false;
const listeners = new Set();

function readStorage() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        basket: Array.isArray(parsed.basket) ? parsed.basket.map(String) : [],
        borrower: typeof parsed.borrower === "string" ? parsed.borrower : "",
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

const DataContext = createContext({ inventory: [], rentals: [] });

// layout.js 에서 서버가 읽은 재고·대여 기록을 아래쪽 화면 전체에 나눠 준다.
export function StoreProvider({ inventory, rentals, children }) {
  const value = useMemo(() => ({ inventory, rentals }), [inventory, rentals]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

const subscribeNothing = () => () => {};

export function useStore() {
  const { inventory, rentals } = useContext(DataContext);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // 서버에서 그린 화면과 맞추기 위해, 브라우저가 준비되기 전에는 false
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);

  const view = useMemo(() => {
    const byId = new Map(inventory.map((row) => [row.재고번호, row]));
    const now = new Date();

    // 바구니에 담긴 재고 (그 사이 DB에서 사라진 번호는 건너뛴다)
    const basketRows = state.basket
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((row) => ({ ...row, expiry: getExpiryInfo(row, now) }));

    // 아직 반납 안 된 대여 기록 (재고번호별로 가장 최근 것)
    const openByStock = new Map();
    rentals.forEach((rental) => {
      if (!rental.반납시각 && !openByStock.has(rental.재고번호)) {
        openByStock.set(rental.재고번호, rental);
      }
    });

    // 지금 사용중인 재고 + 누가, 언제부터
    const inUseRows = inventory
      .filter((row) => row.현재상태 === "사용중")
      .map((row) => {
        const open = openByStock.get(row.재고번호);
        return { ...row, rentedAt: open?.대여시각 ?? null, borrower: open?.대여자 ?? "" };
      });

    // 최근 반납 기록
    const returnedLog = rentals
      .filter((rental) => rental.반납시각 && byId.has(rental.재고번호))
      .slice(0, 10)
      .map((rental) => ({ ...rental, row: byId.get(rental.재고번호) }));

    return { basketRows, inUseRows, returnedLog };
  }, [inventory, rentals, state.basket]);

  const statusOf = useCallback(
    (id) => inventory.find((row) => row.재고번호 === String(id))?.현재상태 ?? "보관중",
    [inventory]
  );

  // ----- 바구니 동작 (브라우저 안에서만) -----
  const addToBasket = useCallback((id) => {
    const current = getSnapshot();
    if (current.basket.includes(id)) return;
    commit({ ...current, basket: [...current.basket, id] });
  }, []);

  const removeFromBasket = useCallback((id) => {
    const current = getSnapshot();
    commit({ ...current, basket: current.basket.filter((item) => item !== id) });
  }, []);

  // 대여가 끝난 재고만 바구니에서 뺀다
  const removeManyFromBasket = useCallback((ids) => {
    const current = getSnapshot();
    commit({ ...current, basket: current.basket.filter((item) => !ids.includes(item)) });
  }, []);

  const setBorrower = useCallback((name) => {
    commit({ ...getSnapshot(), borrower: name });
  }, []);

  return {
    ready,
    basket: state.basket,
    borrower: state.borrower,
    statusOf,
    addToBasket,
    removeFromBasket,
    removeManyFromBasket,
    setBorrower,
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

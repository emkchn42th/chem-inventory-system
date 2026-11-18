"use server";

// 대여·반납을 DB에 기록하는 서버 함수들 (8차시 → 로그인 기능 단계에서 개편)
//
// 대여 : 재고를 "사용중"으로 바꾸고 + 대여 기록(누가 빌렸는지 포함)을 남긴다.
// 반납 : 재고를 "보관중"으로 되돌리고 + 대여 기록에 반납 시각을 채운다.
//
// 실제 처리는 DB 안의 함수(rent_stocks, return_stock)가 한다. (supabase/policies_auth.sql)
// DB 함수가 로그인한 사람의 출입증을 보고 직접 확인하므로,
//   - 로그인하지 않으면 대여·반납할 수 없고
//   - 다른 사람이 빌린 재고는 반납할 수 없다.

import { loadInventory, refreshInventoryCache } from "../../lib/data";
import { getExpiryInfo } from "../../lib/expiry";
import { isSupabaseConfigured, callRpc } from "../../lib/supabase";
import { getUser, getAccessToken } from "../../lib/auth";
import { describeAmount } from "../../lib/amount";

const NO_DB = "DB가 연결되어 있지 않아 기록할 수 없어요. (.env.local 의 Supabase 설정을 확인하세요)";
const NO_LOGIN = "로그인이 필요해요. 로그인한 뒤 다시 시도해 주세요.";
const SQL_HINT = "저장하지 못했어요. Supabase 설정(policies_auth.sql)을 확인하세요.";

// 대여하기. ids : 재고번호 글자 목록
// 돌려주는 값 : { ok, rented: [{id, 시약명, 보관위치, 남은양}], skipped: [{id, 시약명, reason}], message }
export async function rentStocks(ids) {
  if (!isSupabaseConfigured()) return { ok: false, rented: [], skipped: [], message: NO_DB };
  const user = getUser();
  const token = getAccessToken();
  if (!user || !token) return { ok: false, rented: [], skipped: [], message: NO_LOGIN, needLogin: true };

  const wanted = [...new Set((Array.isArray(ids) ? ids : []).map(String))].filter((id) =>
    /^\d{1,9}$/.test(id)
  );
  if (wanted.length === 0) return { ok: false, rented: [], skipped: [], message: "대여할 재고가 없어요." };
  if (wanted.length > 20)
    return { ok: false, rented: [], skipped: [], message: "한 번에 20개까지만 대여할 수 있어요." };

  // 안내 문구를 위해 먼저 한 번 살펴본다 (최종 판단은 DB 함수가 한다)
  const inventory = await loadInventory();
  const byId = new Map(inventory.map((row) => [row.재고번호, row]));
  const skipped = [];
  const candidates = [];

  wanted.forEach((id) => {
    const row = byId.get(id);
    if (!row) return skipped.push({ id, 시약명: "?", reason: "없는 재고예요." });
    if (getExpiryInfo(row).state === "expired")
      return skipped.push({ id, 시약명: row.시약명, reason: "유효기한이 지나 대여할 수 없어요." });
    if (row.현재상태 === "사용중")
      return skipped.push({ id, 시약명: row.시약명, reason: "이미 사용중인 재고예요." });
    candidates.push(id);
  });

  if (candidates.length === 0)
    return { ok: false, rented: [], skipped, message: "대여할 수 있는 재고가 없어요." };

  let rentedIds;
  try {
    const result = await callRpc(
      "rent_stocks",
      { p_ids: candidates.map(Number), p_borrower: user.label },
      token
    );
    rentedIds = (Array.isArray(result) ? result : []).map(String);
    refreshInventoryCache(); // 서버에 보관해 둔 재고 목록을 버리고 새로 읽게 한다
  } catch (error) {
    console.error(error);
    return { ok: false, rented: [], skipped, message: SQL_HINT };
  }

  candidates
    .filter((id) => !rentedIds.includes(id))
    .forEach((id) =>
      skipped.push({ id, 시약명: byId.get(id).시약명, reason: "방금 다른 사람이 대여했어요." })
    );

  if (rentedIds.length === 0)
    return { ok: false, rented: [], skipped, message: "대여할 수 있는 재고가 없어요." };

  const rented = rentedIds.map((id) => {
    const row = byId.get(id);
    return { id, 시약명: row.시약명, 보관위치: row.보관위치, 남은양: describeAmount(row).text };
  });
  return { ok: true, rented, skipped, message: "" };
}

// 반납하기. id : 재고번호 글자
export async function returnStock(idText) {
  if (!isSupabaseConfigured()) return { ok: false, message: NO_DB };
  const token = getAccessToken();
  if (!token) return { ok: false, message: NO_LOGIN, needLogin: true };

  const id = String(idText ?? "");
  if (!/^\d{1,9}$/.test(id)) return { ok: false, message: "잘못된 재고 번호예요." };

  try {
    const result = await callRpc("return_stock", { p_id: Number(id) }, token);
    if (result === "ok") {
      refreshInventoryCache();
      return { ok: true, message: "" };
    }
    if (result === "not_yours") return { ok: false, message: "다른 사람이 빌린 재고는 반납할 수 없어요." };
    if (result === "not_in_use") return { ok: false, message: "이미 반납된 재고예요." };
    if (result === "login") return { ok: false, message: NO_LOGIN, needLogin: true };
    return { ok: false, message: SQL_HINT };
  } catch (error) {
    console.error(error);
    return { ok: false, message: SQL_HINT };
  }
}

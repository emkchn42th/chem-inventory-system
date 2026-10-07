"use server";

// 대여·반납을 DB에 기록하는 서버 함수들 (8차시)
//
// 대여 : 재고 상태를 "사용중"으로 바꾸고 + 대여 기록(rentals)을 남긴다.
// 반납 : 재고 상태를 "보관중"으로 되돌리고 + 대여 기록에 반납 시각을 채운다.
//
// 상태를 바꿀 때 "지금 보관중인 것만" 이라는 조건을 함께 걸어서,
// 두 사람이 동시에 같은 재고를 대여해도 먼저 누른 사람만 성공한다.

import { loadInventory } from "../../lib/data";
import { getExpiryInfo } from "../../lib/expiry";
import { isSupabaseConfigured, insertRows, updateRows } from "../../lib/supabase";

const NO_DB = "DB가 연결되어 있지 않아 기록할 수 없어요. (.env.local 의 Supabase 설정을 확인하세요)";

// 대여하기. ids : 재고번호 글자 목록, borrower : 대여자 (비워도 됨)
// 돌려주는 값 : { ok, rented: [{id, 시약명, 보관위치, 남은양}], skipped: [{id, 시약명, reason}], message }
export async function rentStocks(ids, borrowerText) {
  if (!isSupabaseConfigured()) return { ok: false, rented: [], skipped: [], message: NO_DB };

  const wanted = [...new Set((Array.isArray(ids) ? ids : []).map(String))].filter((id) =>
    /^\d{1,9}$/.test(id)
  );
  if (wanted.length === 0) return { ok: false, rented: [], skipped: [], message: "대여할 재고가 없어요." };
  if (wanted.length > 20)
    return { ok: false, rented: [], skipped: [], message: "한 번에 20개까지만 대여할 수 있어요." };

  const borrower = String(borrowerText ?? "").trim();
  if (borrower.length > 20)
    return { ok: false, rented: [], skipped: [], message: "대여자는 20자까지 쓸 수 있어요." };

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

  let changed;
  try {
    // 1) 지금 보관중인 것만 사용중으로 바꾼다. 실제로 바뀐 줄만 돌아온다.
    changed = await updateRows("inventory", `id=in.(${candidates.join(",")})&status=eq.보관중`, {
      status: "사용중",
    });
  } catch (error) {
    console.error(error);
    return { ok: false, rented: [], skipped, message: "저장하지 못했어요. Supabase 설정(8차시 SQL)을 확인하세요." };
  }

  const changedIds = changed.map((row) => String(row.id));
  candidates
    .filter((id) => !changedIds.includes(id))
    .forEach((id) =>
      skipped.push({ id, 시약명: byId.get(id).시약명, reason: "방금 다른 사람이 대여했어요." })
    );

  if (changedIds.length === 0)
    return { ok: false, rented: [], skipped, message: "대여할 수 있는 재고가 없어요." };

  try {
    // 2) 대여 기록을 남긴다
    await insertRows(
      "rentals",
      changedIds.map((id) => ({ inventory_id: Number(id), borrower }))
    );
  } catch (error) {
    console.error(error);
    // 기록 저장에 실패하면 상태를 원래대로 돌려 놓는다
    try {
      await updateRows("inventory", `id=in.(${changedIds.join(",")})`, { status: "보관중" });
    } catch (revertError) {
      console.error(revertError);
    }
    return { ok: false, rented: [], skipped, message: "대여 기록을 저장하지 못했어요. 다시 시도해 주세요." };
  }

  const rented = changedIds.map((id) => {
    const row = byId.get(id);
    return { id, 시약명: row.시약명, 보관위치: row.보관위치, 남은양: row.남은양 };
  });
  return { ok: true, rented, skipped, message: "" };
}

// 반납하기. id : 재고번호 글자
export async function returnStock(idText) {
  if (!isSupabaseConfigured()) return { ok: false, message: NO_DB };

  const id = String(idText ?? "");
  if (!/^\d{1,9}$/.test(id)) return { ok: false, message: "잘못된 재고 번호예요." };

  try {
    const changed = await updateRows("inventory", `id=eq.${id}&status=eq.사용중`, { status: "보관중" });
    if (changed.length === 0) return { ok: false, message: "이미 반납된 재고예요." };

    // 아직 반납되지 않은 대여 기록에 반납 시각을 채운다
    await updateRows("rentals", `inventory_id=eq.${id}&returned_at=is.null`, {
      returned_at: new Date().toISOString(),
    });
    return { ok: true, message: "" };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "저장하지 못했어요. Supabase 설정(8차시 SQL)을 확인하세요." };
  }
}

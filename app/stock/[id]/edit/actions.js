"use server";

// 재고 수정·삭제 서버 함수 (추가 기능 단계)

import { redirect } from "next/navigation";
import { loadReagents, loadInventory } from "../../../../lib/data";
import { isSupabaseConfigured, updateRows, deleteRows } from "../../../../lib/supabase";
import { validateStockForm } from "../../../../lib/stock-form";

const NO_DB = "DB가 연결되어 있지 않아 저장할 수 없어요. (.env.local 의 Supabase 설정을 확인하세요)";

// 수정 저장 (useFormState 로 부름)
export async function updateStock(prevState, formData) {
  const raw = Object.fromEntries(formData.entries());
  const id = String(raw.id ?? "");
  if (!isSupabaseConfigured()) return { errors: {}, values: raw, message: NO_DB };
  if (!/^\d{1,9}$/.test(id)) return { errors: {}, values: raw, message: "잘못된 재고 번호예요." };

  const [reagents, inventory] = await Promise.all([loadReagents(), loadInventory()]);
  const current = inventory.find((row) => row.재고번호 === id);
  if (!current) return { errors: {}, values: raw, message: "이미 삭제된 재고예요." };

  // 시약 종류는 바꿀 수 없다 (폼 값이 아니라 DB 값을 쓴다)
  raw.reagent = current.시약명;

  // 자기 자신의 위치는 "이미 쓰는 위치"에서 뺀다
  const usedLocations = {};
  inventory.forEach((row) => {
    if (row.재고번호 !== id) usedLocations[row.보관위치.toUpperCase()] = row.재고번호;
  });

  const result = validateStockForm(raw, {
    reagentNames: reagents.map((reagent) => reagent.시약명),
    usedLocations,
  });
  if (!result.ok) {
    return { errors: result.errors, values: result.values, message: "입력한 내용을 다시 확인해 주세요." };
  }

  const v = result.values;
  try {
    const changed = await updateRows("inventory", `id=eq.${id}`, {
      purchased_on: v.purchased || null,
      opened_on: v.opened || null,
      expires_on: v.expires,
      amount: v.amount,
      location: v.location,
      note: v.note,
    });
    if (changed.length === 0) throw new Error("no row updated");
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      values: v,
      message: "저장하지 못했어요. Supabase 수정 권한(policies_extra.sql) 설정을 확인하세요.",
    };
  }

  redirect(`/stock/${id}?edited=1`);
}

// 삭제 (보관중일 때만). 돌려주는 값: { ok, message, name }
export async function deleteStock(idText) {
  const id = String(idText ?? "");
  if (!isSupabaseConfigured()) return { ok: false, message: NO_DB };
  if (!/^\d{1,9}$/.test(id)) return { ok: false, message: "잘못된 재고 번호예요." };

  const inventory = await loadInventory();
  const current = inventory.find((row) => row.재고번호 === id);
  if (!current) return { ok: false, message: "이미 삭제된 재고예요." };
  if (current.현재상태 === "사용중") {
    return { ok: false, message: "사용중인 재고는 지울 수 없어요. 먼저 반납해 주세요." };
  }

  try {
    const deleted = await deleteRows("inventory", `id=eq.${id}&status=eq.보관중`);
    if (deleted.length === 0) return { ok: false, message: "지우지 못했어요. 방금 누군가 대여했을 수 있어요." };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "지우지 못했어요. Supabase 삭제 권한(policies_extra.sql) 설정을 확인하세요.",
    };
  }
  return { ok: true, message: "", name: current.시약명 };
}

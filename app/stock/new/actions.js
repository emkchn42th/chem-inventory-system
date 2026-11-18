"use server";

// 재고 추가 버튼을 눌렀을 때 서버에서 실행되는 함수 (7차시)
//   1) 입력값 검사  2) DB에 저장  3) 저장된 재고 상세 화면으로 이동

import { redirect } from "next/navigation";
import { loadReagents, loadInventory, refreshInventoryCache } from "../../../lib/data";
import { isSupabaseConfigured, insertRow } from "../../../lib/supabase";
import { validateStockForm } from "../../../lib/stock-form";
import { getAccessToken } from "../../../lib/auth";

const NEED_LOGIN = { errors: {}, message: "로그인이 필요해요. 로그인한 뒤 다시 저장해 주세요." };


// useFormState 로 부르면 (이전 결과, 폼 값) 두 개를 받는다.
export async function addStock(prevState, formData) {
  const raw = Object.fromEntries(formData.entries());

  // DB가 연결되지 않았으면 저장할 곳이 없다
  if (!isSupabaseConfigured()) {
    return {
      errors: {},
      values: raw,
      message: "DB가 연결되어 있지 않아 저장할 수 없어요. (.env.local 의 Supabase 설정을 확인하세요)",
    };
  }

  // 재고 추가는 로그인한 사람만 (DB 규칙에서도 한 번 더 막는다)
  const token = getAccessToken();
  if (!token) return { ...NEED_LOGIN, values: raw };

  const [reagents, inventory] = await Promise.all([loadReagents(), loadInventory()]);

  const usedLocations = {};
  inventory.forEach((row) => {
    usedLocations[row.보관위치.toUpperCase()] = row.재고번호;
  });

  const result = validateStockForm(raw, {
    reagentNames: reagents.map((reagent) => reagent.시약명),
    usedLocations,
  });

  if (!result.ok) {
    return { errors: result.errors, values: result.values, message: "입력한 내용을 다시 확인해 주세요." };
  }

  const v = result.values;
  let saved;
  try {
    saved = await insertRow("inventory", {
      reagent_name: v.reagent,
      purchased_on: v.purchased || null,
      opened_on: v.opened || null,
      expires_on: v.expires,
      amount: v.amount,
      amount_mode: v.amountMode,
      amount_value: v.amountMode === "정량" ? Number(v.amountValue) : null,
      capacity: v.amountMode === "정량" ? Number(v.capacity) : null,
      unit: v.amountMode === "정량" ? v.unit : null,
      location: v.location,
      status: "보관중",
      note: v.note,
    }, token);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      values: v,
      message: "저장하지 못했어요. Supabase 권한(policies_auth.sql) 설정을 확인하세요.",
    };
  }

  refreshInventoryCache(); // 새 재고가 바로 보이도록

  // redirect 는 try 밖에서 불러야 한다 (이동도 내부적으로 예외로 처리되기 때문)
  redirect(`/stock/${saved.id}?added=1`);
}

"use server";

// 재고 추가 버튼을 눌렀을 때 서버에서 실행되는 함수 (7차시)
//   1) 입력값 검사  2) DB에 저장  3) 저장된 재고 상세 화면으로 이동

import { redirect } from "next/navigation";
import { loadReagents, loadInventory } from "../../../lib/data";
import { isSupabaseConfigured, insertRow } from "../../../lib/supabase";
import { validateStockForm } from "../../../lib/stock-form";

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
      location: v.location,
      status: "보관중",
      note: v.note,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      values: v,
      message: "저장하지 못했어요. Supabase 쓰기 권한(7차시 SQL) 설정을 확인하세요.",
    };
  }

  // redirect 는 try 밖에서 불러야 한다 (이동도 내부적으로 예외로 처리되기 때문)
  redirect(`/stock/${saved.id}?added=1`);
}

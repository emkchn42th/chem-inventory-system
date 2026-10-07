// 재고 추가 입력값을 검사하는 함수 (7차시)
//
// 화면(브라우저)에서 한 번 막더라도, 서버에서 반드시 다시 검사한다.
// 그래서 검사 규칙을 이 파일 하나에 모아 두고 서버(actions.js)에서 쓴다.

export const AMOUNTS = ["상", "중", "하"];

// "2025-03-04" 같은 날짜 글자가 진짜 있는 날짜인지 확인 (예: 2월 30일은 거짓)
function isRealDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

// 오늘 날짜를 "YYYY-MM-DD" 로 (한국 시간 기준)
export function todayText(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// raw          : 폼에서 받은 값 (전부 글자)
// reagentNames : 등록된 시약 이름 목록
// usedLocations: 이미 쓰고 있는 위치 { "A-1-2": "1", ... }  (위치 -> 재고번호)
// 돌려주는 것   : { ok, errors: { 항목: 메시지 }, values: 다듬어진 값 }
export function validateStockForm(raw, { reagentNames, usedLocations }, now = new Date()) {
  const today = todayText(now);
  const errors = {};

  const get = (key) => String(raw[key] ?? "").trim();
  const values = {
    reagent: get("reagent"),
    purchased: get("purchased"),
    opened: get("opened"),
    unopened: raw.unopened === "on" || raw.unopened === true,
    expires: get("expires"),
    amount: get("amount") || "상",
    location: get("location").toUpperCase(),
    note: get("note"),
  };
  if (values.unopened) values.opened = ""; // 미개봉이면 개봉일은 비운다

  // 시약
  if (!values.reagent) errors.reagent = "시약을 선택하세요.";
  else if (!reagentNames.includes(values.reagent)) errors.reagent = "등록되지 않은 시약입니다.";

  // 구매일 (선택)
  if (values.purchased) {
    if (!isRealDate(values.purchased)) errors.purchased = "날짜 형식이 올바르지 않습니다.";
    else if (values.purchased > today) errors.purchased = "구매일은 오늘보다 늦을 수 없어요.";
  }

  // 개봉일 (개봉했다면 필수)
  if (!values.unopened) {
    if (!values.opened) errors.opened = "개봉일을 입력하거나 '아직 개봉 안 함'을 선택하세요.";
    else if (!isRealDate(values.opened)) errors.opened = "날짜 형식이 올바르지 않습니다.";
    else if (values.opened > today) errors.opened = "개봉일은 오늘보다 늦을 수 없어요.";
    else if (values.purchased && !errors.purchased && values.opened < values.purchased)
      errors.opened = "개봉일은 구매일보다 빠를 수 없어요.";
  }

  // 유효기한 (필수)
  if (!values.expires) errors.expires = "유효기한을 입력하세요.";
  else if (!isRealDate(values.expires)) errors.expires = "날짜 형식이 올바르지 않습니다.";
  else {
    const start = values.opened && !errors.opened ? values.opened : values.purchased;
    if (start && !errors.purchased && values.expires <= start)
      errors.expires = "유효기한은 개봉일(구매일)보다 뒤여야 해요.";
  }

  // 남은 양
  if (!AMOUNTS.includes(values.amount)) errors.amount = "남은 양을 선택하세요.";

  // 보관 위치 (예: A-1-2)
  if (!values.location) errors.location = "보관 위치를 입력하세요.";
  else if (!/^[A-Z0-9가-힣-]{1,12}$/.test(values.location))
    errors.location = "영문·숫자·하이픈(-)만 12자까지 쓸 수 있어요. (예: A-1-2)";
  else if (usedLocations[values.location])
    errors.location = `이미 재고 #${usedLocations[values.location]} 이(가) 있는 위치예요.`;

  // 비고 (선택)
  if (values.note.length > 100) errors.note = "비고는 100자까지 쓸 수 있어요.";

  return { ok: Object.keys(errors).length === 0, errors, values };
}

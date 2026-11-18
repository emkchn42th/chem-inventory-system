// 개인보호구·주의 표시 (추가 기능)
//
// MSDS 의 유해·위험문구(H 코드), 그림문자(GHS), 유해성 분류를 보고
// "이 시약을 다룰 때 무엇을 착용·주의해야 하는지"를 아이콘으로 정리한다.
// ※ 학교 실험실 기준으로 단순화한 참고용 안내다. 실제 규칙은 선생님 안내를 따른다.

// 순서대로 화면에 표시된다
export const PPE_ITEMS = {
  goggles: { icon: "🥽", label: "보안경", detail: "눈에 튀지 않게 보안경을 쓰세요." },
  gloves: { icon: "🧤", label: "보호장갑", detail: "피부에 닿지 않게 장갑을 끼세요." },
  coat: { icon: "🥼", label: "실험복", detail: "실험복을 입고 소매를 내리세요." },
  hood: { icon: "🌬️", label: "후드·환기", detail: "증기·가스를 마시지 않게 후드나 환기가 되는 곳에서 쓰세요." },
  mask: { icon: "😷", label: "마스크", detail: "가루가 날리지 않게 하고 마스크를 쓰세요." },
  noFire: { icon: "🔥", label: "화기 엄금", detail: "불꽃·열원 가까이에 두지 마세요." },
  noWater: { icon: "💧", label: "물 접촉 금지", detail: "물과 닿으면 위험해요. 젖은 손·도구로 다루지 마세요." },
};

const has = (codes, list) => list.some((code) => codes.has(code));

// msds : lib/msds.js 의 buildMsdsView 결과
// 돌려주는 값 : ["goggles", "gloves", ...]  (PPE_ITEMS 의 이름)
export function ppeFromMsds(msds) {
  const codes = new Set(
    (msds.hazardStatements ?? []).flatMap((item) => String(item.code ?? "").split("+").map((code) => code.trim()))
  );
  const pictos = new Set((msds.pictograms ?? []).map((item) => item.key));
  const classes = (msds.classes ?? []).join(" ");

  const result = new Set(["goggles", "coat"]); // 학교 실험실 기본

  // 피부: 부식성·자극성·피부 흡수 독성·피부 과민성
  if (pictos.has("GHS05") || has(codes, ["H314", "H315", "H317", "H310", "H311", "H312"]) || /피부/.test(classes))
    result.add("gloves");
  // 흡입: 흡입 독성·호흡기 자극·졸음/현기증, 인화성 액체(증기)
  if (has(codes, ["H330", "H331", "H332", "H334", "H335", "H336"]) || /인화성 액체|흡입/.test(classes)) result.add("hood");
  // 가루 흡입 (고체이면서 호흡기 자극)
  if (has(codes, ["H335", "H334"]) && /고체|분진/.test(classes)) result.add("mask");
  // 불: 인화성·자연발화성·산화성
  if (pictos.has("GHS02") || pictos.has("GHS03") || /인화성|자연발화|산화성/.test(classes)) result.add("noFire");
  // 물: 물과 반응해 인화성 가스 발생
  if (has(codes, ["H260", "H261", "EUH014"]) || /물반응성/.test(classes)) result.add("noWater");

  return Object.keys(PPE_ITEMS).filter((key) => result.has(key));
}

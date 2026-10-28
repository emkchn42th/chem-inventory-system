// 함께 두면 위험한 시약 조합 찾기 (추가 기능 단계)
//
// 바구니에 담은 시약들 중 같이 운반·보관하면 위험한 짝이 있으면 경고한다.
// 카테고리 태그(산/염기/금속…)와 MSDS의 유해성·위험성 분류(인화성, 산화성)를 보고 판단한다.
//
// ※ 일반적인 화학 안전 원칙을 단순화한 "참고용" 규칙이다.
//   실제 시약실 규칙은 선생님께 확인하고 아래 RULES 를 고치면 된다.

const has = (info, test) => test(info);
const isAcid = (info) => info.categories.includes("산");
const isBase = (info) => info.categories.includes("염기");
const isMetal = (info) => info.categories.includes("금속");
// 인화성·산화성은 그림문자보다 "유해성·위험성 분류" 글을 보고 판단한다.
// (MSDS 자료에 따라 그림문자 번호가 분류와 맞지 않는 경우가 있어서)
const classText = (info) => (info.classes ?? []).join(" ");
const isFlammable = (info) => /인화성|자연발화성|가연성/.test(classText(info));
const isOxidizer = (info) => /산화성/.test(classText(info));

export const RULES = [
  {
    a: isAcid,
    b: isBase,
    title: "산 + 염기",
    message: "섞이면 열이 나며 격렬하게 반응할 수 있어요. 따로 운반하고 따로 보관하세요.",
  },
  {
    a: isAcid,
    b: isMetal,
    title: "산 + 금속",
    message: "금속이 산과 만나면 수소 기체가 생겨 불이 붙을 수 있어요.",
  },
  {
    a: isFlammable,
    b: isOxidizer,
    title: "인화성 + 산화성",
    message: "산화성 물질은 불을 더 크게 만들어요. 인화성 물질과 멀리 두세요.",
  },
];

// infos : 시약 요약 정보 목록 (lib/reagent-index.js 의 모양)
// 돌려주는 값 : [{ title, message, pair: ["염산", "수산화나트륨"] }, ...]
export function findDangerousPairs(infos) {
  const unique = [...new Map(infos.map((info) => [info.name, info])).values()];
  const warnings = [];

  RULES.forEach((rule) => {
    unique.forEach((x) => {
      unique.forEach((y) => {
        if (x.name === y.name) return;
        if (has(x, rule.a) && has(y, rule.b)) {
          warnings.push({ title: rule.title, message: rule.message, pair: [x.name, y.name] });
        }
      });
    });
  });
  return warnings;
}

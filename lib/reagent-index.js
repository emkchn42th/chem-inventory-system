// 시약 "요약 카드" 정보 (추가 기능 단계)
//
// 검색 자동완성, 최근 본 시약, 호버 미리보기처럼 여러 화면에서
// 시약 이름·신호어·그림문자만 간단히 필요할 때 쓰는 가벼운 목록.
// 서버에서 만들어 브라우저로 넘긴다. (MSDS 전문은 넘기지 않음)

import { buildMsdsView } from "./msds";
import { getCategories } from "./data";

export function buildReagentIndex(reagents) {
  return reagents.map((reagent) => {
    const msds = buildMsdsView(reagent);
    return {
      name: reagent.시약명,
      official: reagent.정식명칭 || "",
      cas: reagent.CAS번호 || "",
      categories: getCategories(reagent),
      signal: msds.signal || "",
      pictograms: msds.pictograms.map((item) => ({ key: item.key, emoji: item.emoji, name: item.name })),
      classes: msds.classes, // 유해성·위험성 분류 (예: "인화성 액체 : 구분2")
      hazards: msds.hazardStatements.slice(0, 3).map((item) => item.text),
    };
  });
}

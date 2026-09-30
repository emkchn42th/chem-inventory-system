// 카테고리 목록.
// 메인 화면의 카테고리 카드와 목록 화면의 탭에서 같이 쓰기 때문에
// 한 곳에 모아 두었다. 카테고리를 바꾸려면 이 파일만 고치면 된다.
//
// key 는 CSS 클래스 이름(색깔)을 고르는 데 쓴다.
// 산은 붉은색, 염기는 푸른색 — 리트머스 종이 색과 맞췄다.
export const CATEGORIES = [
  { name: "산", emoji: "💧", key: "acid" },
  { name: "유기", emoji: "🧪", key: "organic" },
  { name: "염기", emoji: "⚗️", key: "base" },
  { name: "금속", emoji: "🔩", key: "metal" },
];

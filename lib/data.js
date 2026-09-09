// 1차시에 만든 data 폴더의 예시 데이터를 읽어오는 함수들.
//
// 지금은 파일에서 직접 읽지만, 6차시에 Supabase를 붙이면
// 이 파일 안의 함수만 DB 조회로 바꾸면 되도록 따로 떼어 두었다.
// (화면 코드는 그대로 두고 데이터 가져오는 곳만 교체하는 구조)

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

// data/reagents.json 읽기 — MSDS API로 수집한 시약 정보 5종
export function loadReagents() {
  const filePath = path.join(DATA_DIR, "reagents.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// data/inventory.csv 읽기 — 시약실 재고 10개
// CSV는 그냥 글자 덩어리라서, 줄 단위로 자른 뒤 쉼표로 나눠 객체로 바꾼다.
// 예) "1,에탄올,2025-03-04,..."  ->  { 재고번호: "1", 시약명: "에탄올", ... }
export function loadInventory() {
  const filePath = path.join(DATA_DIR, "inventory.csv");
  const text = fs.readFileSync(filePath, "utf-8").trim();

  const lines = text.split(/\r?\n/);   // 윈도우(\r\n), 리눅스(\n) 줄바꿈 모두 처리
  const headers = lines[0].split(",");  // 첫 줄은 열 이름

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });
}

// 재고 하나의 유효기한이 오늘 기준으로 지났는지 판단
export function isExpired(row, today = new Date()) {
  if (!row.유효기한) return false;
  return new Date(row.유효기한) < today;
}

// 화면 위쪽 "현황 요약"에 쓸 숫자들을 한 번에 계산
export function buildSummary(reagents, inventory) {
  const today = new Date();
  return {
    시약종류: reagents.length,
    전체재고: inventory.length,
    사용중: inventory.filter((row) => row.현재상태 === "사용중").length,
    만료: inventory.filter((row) => isExpired(row, today)).length,
  };
}

// 시약 하나의 카테고리 목록을 꺼낸다.
//
// 카테고리는 태그처럼 여러 개를 달 수 있다. 예를 들어 아세트산은
// 유기물이면서 산이므로 ["유기", "산"] 두 개를 갖는다.
// JSON에서는 배열, CSV에서는 "유기;산" 형태로 저장되므로
// 어느 쪽으로 읽어 오든 배열로 맞춰서 돌려준다.
export function getCategories(reagent) {
  const value = reagent.카테고리;

  if (Array.isArray(value)) return value;   // JSON에서 읽은 경우
  if (!value) return [];                    // 값이 비어 있는 경우

  return String(value)                      // CSV에서 읽은 경우
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

// 카테고리(산/유기/염기/금속)별로 시약이 몇 종인지 세기.
//
// 시약 하나가 카테고리를 여러 개 가질 수 있으므로, 각 카테고리마다
// 따로 세어 준다. 그래서 카테고리별 개수를 다 더하면 전체 시약 수보다
// 많아질 수 있다. (아세트산 한 종이 유기에도, 산에도 잡히기 때문)
export function countByCategory(reagents) {
  const counts = {};
  reagents.forEach((reagent) => {
    getCategories(reagent).forEach((category) => {
      counts[category] = (counts[category] || 0) + 1;
    });
  });
  return counts;
}

// 특정 카테고리에 속한 시약만 골라낸다.
// 3차시에서 카테고리 버튼을 눌렀을 때 목록을 거르는 데 쓸 예정이다.
export function filterByCategory(reagents, category) {
  return reagents.filter((reagent) => getCategories(reagent).includes(category));
}

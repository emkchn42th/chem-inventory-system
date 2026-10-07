// 1차시에 만든 data 폴더의 예시 데이터를 읽어오는 함수들.
//
// 지금은 파일에서 직접 읽지만, 6차시에 Supabase를 붙이면
// 이 파일 안의 함수만 DB 조회로 바꾸면 되도록 따로 떼어 두었다.
// (화면 코드는 그대로 두고 데이터 가져오는 곳만 교체하는 구조)

import fs from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, selectRows } from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");

// ---------------------------------------------------------------
// 6차시: 데이터를 어디서 읽을지 고른다.
//   .env.local 에 Supabase 주소·키가 있으면  -> DB(Supabase)에서 읽는다
//   없으면                                   -> 예전처럼 data/ 폴더 파일에서 읽는다
// 화면 코드는 어느 쪽인지 몰라도 되도록, 두 방식 모두 똑같은 모양으로 돌려준다.
// DB는 응답을 기다려야 하므로 loadReagents / loadInventory 는 async 함수다.
// (부르는 쪽에서 await 를 붙인다)
// ---------------------------------------------------------------

// DB의 날짜는 비어 있으면 null — 화면은 빈 글자("")를 기대하므로 바꿔 준다
const text = (value) => (value ?? "").toString();

// data/reagents.json 읽기 — MSDS API로 수집한 시약 정보
async function loadReagentsFromFile() {
  const filePath = path.join(DATA_DIR, "reagents.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Supabase 의 reagents 표 -> 화면이 쓰는 한글 이름 모양으로 바꾼다
async function loadReagentsFromDb() {
  const rows = await selectRows("reagents", "order=name.asc");
  return rows.map((row) => ({
    시약명: row.name,
    카테고리: row.categories ?? [],
    정식명칭: text(row.official_name),
    CAS번호: text(row.cas),
    chemId: text(row.chem_id),
    위험성: text(row.hazard),
    특성: text(row.properties),
    취급저장방법: text(row.handling),
    응급조치: text(row.first_aid),
  }));
}

export async function loadReagents() {
  return isSupabaseConfigured() ? loadReagentsFromDb() : loadReagentsFromFile();
}

// data/inventory.csv 읽기 — 시약실 재고
// CSV는 그냥 글자 덩어리라서, 줄 단위로 자른 뒤 쉼표로 나눠 객체로 바꾼다.
// 예) "1,에탄올,2025-03-04,..."  ->  { 재고번호: "1", 시약명: "에탄올", ... }
async function loadInventoryFromFile() {
  const filePath = path.join(DATA_DIR, "inventory.csv");
  const csv = fs.readFileSync(filePath, "utf-8").trim();

  const lines = csv.split(/\r?\n/);   // 윈도우(\r\n), 리눅스(\n) 줄바꿈 모두 처리
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

// Supabase 의 inventory 표 -> CSV 읽었을 때와 똑같은 모양(전부 글자)으로 바꾼다
async function loadInventoryFromDb() {
  const rows = await selectRows("inventory", "order=id.asc");
  return rows.map((row) => ({
    재고번호: String(row.id),
    시약명: row.reagent_name,
    구매일: text(row.purchased_on),
    개봉일: text(row.opened_on),
    유효기한: text(row.expires_on),
    남은양: text(row.amount),
    보관위치: text(row.location),
    현재상태: text(row.status),
    비고: text(row.note),
  }));
}

export async function loadInventory() {
  return isSupabaseConfigured() ? loadInventoryFromDb() : loadInventoryFromFile();
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
// 목록 화면에서 카테고리 카드/탭을 눌렀을 때 쓴다. (3차시)
export function filterByCategory(reagents, category) {
  return reagents.filter((reagent) => getCategories(reagent).includes(category));
}

// ---------------------------------------------------------------
// 3차시에 추가한 함수들
// ---------------------------------------------------------------

// 비교하기 좋게 글자를 다듬는다.
// 영어 대소문자를 없애고(Magnesium -> magnesium),
// 띄어쓰기를 모두 지운다(수산화 나트륨 -> 수산화나트륨).
function normalize(text) {
  return (text ?? "").toLowerCase().replace(/\s+/g, "");
}

// 시약 이름으로 찾기.
//
// 글자 일부만 쳐도 찾히도록 "포함하는지"로 비교한다. (예: "에탄" -> 에탄올)
// 우리가 붙인 이름(시약명)뿐 아니라 MSDS의 정식 명칭도 같이 본다.
// 그래서 "염화수소"로 찾아도 염산이 나온다.
// 검색어가 비어 있으면 전체 시약을 그대로 돌려준다.
export function searchByName(reagents, keyword) {
  const word = normalize(keyword);
  if (word === "") return reagents;

  return reagents.filter((reagent) => {
    const names = [reagent.시약명, reagent.정식명칭];
    return names.some((name) => normalize(name).includes(word));
  });
}

// 시약 하나의 재고 현황(전체 몇 개, 사용중 몇 개, 만료 몇 개)을 센다.
// 재고표(inventory.csv)의 "시약명"이 시약 정보의 "시약명"과 같은 것끼리 묶는다.
export function summarizeStock(inventory, reagentName, today = new Date()) {
  const rows = inventory.filter((row) => row.시약명 === reagentName);
  return {
    전체: rows.length,
    사용중: rows.filter((row) => row.현재상태 === "사용중").length,
    만료: rows.filter((row) => isExpired(row, today)).length,
  };
}

// ---------------------------------------------------------------
// 4차시에 추가한 함수들
// ---------------------------------------------------------------

// 시약 이름으로 시약 하나를 찾는다. 없으면 null.
export function findReagent(reagents, name) {
  return reagents.find((reagent) => reagent.시약명 === name) ?? null;
}

// 특정 시약의 재고 목록. 재고번호 순서로 돌려준다.
export function getStockOf(inventory, reagentName) {
  return inventory
    .filter((row) => row.시약명 === reagentName)
    .sort((a, b) => Number(a.재고번호) - Number(b.재고번호));
}

// 유효기한 상태 판단은 화면(브라우저)에서도 써야 해서 lib/expiry.js 로 옮겼다.
// (이 파일은 fs 를 쓰므로 브라우저 코드에서 불러올 수 없다)
export { getExpiryInfo } from "./expiry";

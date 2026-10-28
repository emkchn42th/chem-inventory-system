// 서버에서 날짜·시각을 한국 시간으로 보기 좋게 바꾸는 함수 (추가 기능 단계)
// (Vercel 서버는 세계 표준시(UTC)로 돌아가서, 그냥 쓰면 9시간 차이가 난다)

const KST = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// "2026-10-28T05:03:00Z" -> "2026-10-28 14:03"
export function formatKST(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(KST.formatToParts(date).map((part) => [part.type, part.value]));
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day} ${hour}:${parts.minute}`;
}

// 오늘 날짜 "2026-10-28" (한국 시간)
export function todayKST() {
  return formatKST(new Date().toISOString()).slice(0, 10);
}

// CSV(엑셀용) 한 칸 만들기
//  - 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감싼다
//  - = + - @ 로 시작하면 엑셀이 수식으로 실행할 수 있어서 앞에 ' 를 붙인다
export function csvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

// 표(2차원 배열)를 CSV 글자로. 맨 앞 ﻿ 는 엑셀이 한글을 깨지지 않게 읽도록 하는 표시
export function toCsv(rows) {
  return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

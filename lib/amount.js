// 남은 양 표시 (정량 / 정성) (피드백 반영 단계)
//
// 재고마다 남은 양을 두 가지 방법 중 하나로 기록한다.
//   정성 : 상 / 중 / 하                     (눈으로 대충 볼 때)
//   정량 : 350 / 500 mL 처럼 숫자로         (눈금·저울로 잴 때)
// 정량으로 기록해도 "상/중/하"를 자동으로 함께 계산해 둔다.
// (주문 필요 판단처럼 상/중/하를 쓰는 기능이 그대로 동작하도록)

export const UNITS = ["mL", "L", "g", "kg"];
export const AMOUNTS = ["상", "중", "하"];
export const MODES = ["정성", "정량"];

// 남은 비율(0~1)로 상/중/하 정하기: 2/3 이상 상, 1/3 이상 중, 그 아래는 하
export function levelFromRatio(ratio) {
  if (ratio >= 2 / 3) return "상";
  if (ratio >= 1 / 3) return "중";
  return "하";
}

// 350 -> "350", 12.5 -> "12.5", 0.333333 -> "0.33"
export function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return String(Math.round(number * 100) / 100);
}

// 재고 한 줄을 보고 화면에 보여 줄 남은 양 정보를 만든다
//   { mode, level(1~3), percent(정량일 때만), text, unit }
export function describeAmount(row) {
  const levelOf = { 상: 3, 중: 2, 하: 1 };
  const value = Number(row.잔량값);
  const capacity = Number(row.전체용량);

  if (row.잔량방식 === "정량" && Number.isFinite(value) && capacity > 0) {
    const percent = Math.max(0, Math.min(100, Math.round((value / capacity) * 100)));
    const level = levelFromRatio(value / capacity);
    return {
      mode: "정량",
      level: levelOf[level],
      levelText: level,
      percent,
      text: `${formatNumber(value)} / ${formatNumber(capacity)} ${row.단위} (${percent}%)`,
      short: `${formatNumber(value)}${row.단위}`,
    };
  }

  return {
    mode: "정성",
    level: levelOf[row.남은양] ?? 0,
    levelText: row.남은양 || "-",
    percent: null,
    text: row.남은양 || "-",
    short: row.남은양 || "-",
  };
}

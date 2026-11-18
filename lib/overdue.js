// 미반납 판단 (추가 기능)
// 빌린 지 하루(24시간)가 지났는데 반납하지 않았으면 "미반납"으로 본다.

export const OVERDUE_HOURS = 24;

// rentedAt : 대여 시각(ISO 글자). 기록이 없으면 null
// 돌려주는 값 : 미반납이면 지난 날수(1 이상), 아니면 0
export function overdueDays(rentedAt, now = new Date()) {
  if (!rentedAt) return 0;
  const hours = (now.getTime() - new Date(rentedAt).getTime()) / 3600000;
  if (!Number.isFinite(hours) || hours < OVERDUE_HOURS) return 0;
  return Math.floor(hours / 24);
}

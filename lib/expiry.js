// 유효기한 상태를 판단한다. (서버·브라우저 어디서든 쓸 수 있게 따로 뺀 파일)
//   expired : 이미 지남      -> 빨간 "만료" 경고
//   soon    : 90일 이내 임박 -> 주황 "임박" 표시
//   ok      : 여유 있음
//   none    : 유효기한 정보 없음
// days 는 오늘부터 유효기한까지 남은 날짜(지났으면 음수)
export function getExpiryInfo(row, today = new Date()) {
  if (!row.유효기한) return { state: "none", days: null };

  const DAY = 24 * 60 * 60 * 1000;
  const days = Math.ceil((new Date(row.유효기한) - today) / DAY);

  if (days < 0) return { state: "expired", days };
  if (days <= 90) return { state: "soon", days };
  return { state: "ok", days };
}

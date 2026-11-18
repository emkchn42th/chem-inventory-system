// 막대그래프 (추가 기능 · 사용 통계)
// 라이브러리 없이 HTML·CSS 로 그린다. 한 가지 값(대여 횟수)만 보여 주므로 한 색(파랑)만 쓴다.
//
//   direction="vertical"   : 월별·요일별처럼 순서가 있는 값 (세로 막대)
//   direction="horizontal" : 시약별처럼 이름이 긴 순위 (가로 막대, 끝에 숫자)
//   data : [{ label, value, note? }]
// 마우스를 올리면 정확한 값이 뜨고, 아래 "표로 보기"로 숫자를 확인할 수 있다.

import styles from "./BarChart.module.css";

export default function BarChart({ data, direction = "vertical", unit = "회", highlightLast = false, caption }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <figure className={styles.figure}>
      {direction === "vertical" ? (
        <div className={styles.vertical} role="img" aria-label={caption}>
          {data.map((item, index) => {
            const tip = `${item.label} · ${item.value}${unit}${item.note ? ` · ${item.note}` : ""}`;
            const showValue = highlightLast && index === data.length - 1;
            return (
              <div key={item.label} className={styles.vCol} data-tip={tip} tabIndex={0}>
                <div className={styles.vTrack}>
                  {showValue && <span className={styles.vValue}>{item.value}</span>}
                  <div
                    className={`${styles.vBar} ${item.value === 0 ? styles.zero : ""}`}
                    style={{ height: `${(item.value / max) * 100}%` }}
                  />
                </div>
                <span className={styles.vLabel}>{item.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.horizontal} role="img" aria-label={caption}>
          {data.map((item) => (
            <div key={item.label} className={styles.hRow} data-tip={`${item.label} · ${item.value}${unit}`} tabIndex={0}>
              <span className={styles.hLabel}>{item.label}</span>
              <div className={styles.hTrack}>
                <div className={styles.hBar} style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
              </div>
              <span className={styles.hValue}>
                {item.value}
                {unit}
              </span>
            </div>
          ))}
        </div>
      )}

      <details className={styles.table}>
        <summary>표로 보기</summary>
        <table>
          <tbody>
            {data.map((item) => (
              <tr key={item.label}>
                <th>{item.label}</th>
                <td>
                  {item.value}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

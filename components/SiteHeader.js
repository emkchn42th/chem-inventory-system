// 모든 화면 위쪽에 공통으로 들어가는 청록 헤더.
// 메인 화면과 목록 화면이 똑같은 헤더를 쓰도록 컴포넌트로 따로 떼어 냈다.
// (2차시에는 app/page.js 안에 있던 부분)
//
// 검색창은 <form> 으로 감쌌다. 엔터를 치거나 검색 버튼을 누르면
// 브라우저가 알아서 /reagents?q=입력한글자 주소로 이동한다.
// 자바스크립트 없이 HTML 기본 기능만으로 동작하는 방식이다.
//
// keyword : 목록 화면에서 방금 검색한 단어를 검색창에 다시 채워 넣을 때 쓴다.

import Link from "next/link";
import styles from "./SiteHeader.module.css";

export default function SiteHeader({ keyword = "" }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.top}>
          {/* 로고를 누르면 메인 화면으로 돌아간다 */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>🧪</span>
            시약관리대장
          </Link>

          {/* 바구니·반납하기 화면은 5차시에 연결한다 */}
          <div className={styles.actions}>
            <button type="button" className={styles.actionButton}>
              🧺 바구니
            </button>
            <button type="button" className={styles.actionButton}>
              ↩ 반납하기
            </button>
          </div>
        </div>

        <form action="/reagents" method="get" className={styles.searchBar}>
          <input
            key={keyword}
            type="text"
            name="q"
            defaultValue={keyword}
            className={styles.searchInput}
            placeholder="찾는 시약 이름을 입력하세요 (예: 에탄올, 염산)"
          />
          <button type="submit" className={styles.searchButton}>
            검색
          </button>
        </form>
      </div>
    </header>
  );
}

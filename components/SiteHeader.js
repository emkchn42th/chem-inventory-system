// 모든 화면 위쪽에 공통으로 들어가는 청록 헤더.
// 메인 화면과 목록 화면이 똑같은 헤더를 쓰도록 컴포넌트로 따로 떼어 냈다.
// (2차시에는 app/page.js 안에 있던 부분)
//
// 검색창은 <form> 으로 감쌌다. 엔터를 치거나 검색 버튼을 누르면
// 브라우저가 알아서 /reagents?q=입력한글자 주소로 이동한다.
// 추가 기능 단계에서 자동완성을 붙이며 HeaderSearch 로 옮겼다.
//
// keyword : 목록 화면에서 방금 검색한 단어를 검색창에 다시 채워 넣을 때 쓴다.

import Link from "next/link";
import styles from "./SiteHeader.module.css";
import HeaderActions from "./HeaderActions";
import HeaderSearch from "./HeaderSearch";

export default function SiteHeader({ keyword = "" }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.top}>
          {/* 로고를 누르면 메인 화면으로 돌아간다 */}
          <Link href="/" className={styles.logo}>
            {/* 빨간 마름모 안전표지 모양 (CSS로 그림) */}
            <span className={styles.logoMark} aria-hidden="true" />
            시약관리대장
          </Link>

          {/* 바구니·반납하기 버튼 (개수 표시가 있어서 별도 컴포넌트) */}
          <HeaderActions />
        </div>

        {/* 검색창: 자동완성과 "/" 단축키가 있어서 별도 컴포넌트 (추가 기능 단계) */}
        <HeaderSearch keyword={keyword} />
      </div>
    </header>
  );
}

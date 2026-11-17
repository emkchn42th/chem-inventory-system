// "로그인이 필요해요" 안내 상자 (로그인 기능 단계)
import Link from "next/link";
import styles from "./LoginRequired.module.css";

export default function LoginRequired({ next = "/", what = "이 기능" }) {
  return (
    <div className={styles.box}>
      <p className={styles.title}>🔒 로그인이 필요해요</p>
      <p className={styles.text}>{what}은(는) 로그인한 사람만 쓸 수 있어요. 누가 바꿨는지 장부에 남기기 위해서예요.</p>
      <div className={styles.row}>
        <Link href={`/login?next=${encodeURIComponent(next)}`} className={styles.primary}>
          로그인
        </Link>
        <Link href={`/login?mode=signup&next=${encodeURIComponent(next)}`} className={styles.secondary}>
          회원가입
        </Link>
      </div>
    </div>
  );
}

// 비밀번호 재설정 화면 (추가 기능)
// 재설정 메일의 링크를 누르면 이 주소로 돌아온다.
// 주소 뒤(#...)에 Supabase 가 붙여 준 임시 출입증이 들어 있다.

import styles from "../login/page.module.css";
import SiteHeader from "../../components/SiteHeader";
import ResetPasswordForm from "../../components/ResetPasswordForm";

export const metadata = { title: "비밀번호 재설정 · 시약관리대장" };

export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.container}>
        <div className={styles.card}>
          <ResetPasswordForm />
        </div>
      </main>
    </div>
  );
}

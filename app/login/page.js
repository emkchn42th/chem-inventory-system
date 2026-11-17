// 로그인 · 회원가입 화면 (로그인 기능 단계)
//
// 주소 예) /login               로그인
//          /login?mode=signup   회원가입
//          /login?next=/basket  로그인 후 바구니로 돌아감

import { redirect } from "next/navigation";
import styles from "./page.module.css";
import SiteHeader from "../../components/SiteHeader";
import AuthForm from "../../components/AuthForm";
import { getUser } from "../../lib/auth";
import { isSupabaseConfigured } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = { title: "로그인 · 시약관리대장" };

const read = (value) => (Array.isArray(value) ? value[0] : value ?? "");

export default function LoginPage({ searchParams }) {
  const next = read(searchParams.next) || "/";
  // 이미 로그인했으면 돌아갈 화면으로 보낸다
  if (getUser()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");

  const mode = read(searchParams.mode) === "signup" ? "signup" : "login";

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.container}>
        <div className={styles.card}>
          <AuthForm mode={mode} next={next} dbReady={isSupabaseConfigured()} />
        </div>
        <p className={styles.note}>
          로그인하면 내가 빌린 재고를 내가 반납할 수 있어요. 대여 장부에는 학번과 이름이 기록돼요.
        </p>
      </main>
    </div>
  );
}

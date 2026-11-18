"use client";

// 새 비밀번호 정하기 (추가 기능)
// 메일 링크의 주소 뒤쪽(#access_token=...&refresh_token=...&type=recovery)은
// 서버로 보내지지 않고 브라우저에만 있으므로, 여기서 읽어서 서버 함수에 넘긴다.

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./AuthForm.module.css";
import { resetPassword } from "../app/login/actions";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [tokens, setTokens] = useState(null); // null: 아직 읽는 중, false: 링크 문제
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    if (params.get("error_description") || !accessToken) {
      setTokens(false);
      return;
    }
    setTokens({ accessToken, refreshToken: params.get("refresh_token") ?? "" });
    // 주소창에서 출입증을 지운다 (화면 공유·기록에 남지 않게)
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await resetPassword({
        ...tokens,
        password: String(form.get("password") ?? ""),
        confirm: String(form.get("confirm") ?? ""),
      });
      setResult(response);
      if (response.ok) {
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      }
    });
  }

  if (tokens === null) return <p className={styles.lead}>링크를 확인하는 중...</p>;

  if (tokens === false) {
    return (
      <div>
        <p className={styles.alert}>재설정 링크가 만료됐거나 올바르지 않아요. 메일을 다시 받아 주세요.</p>
        <Link href="/login?mode=forgot" className={styles.submit}>
          재설정 메일 다시 받기
        </Link>
      </div>
    );
  }

  if (result?.ok) {
    return <p className={styles.success}>비밀번호를 바꿨어요. 잠시 뒤 메인 화면으로 이동해요.</p>;
  }

  const errors = result?.errors ?? {};
  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <p className={styles.lead}>
        <b>새 비밀번호 정하기</b>
        <br />
        8자 이상으로 정해 주세요. 바꾸면 바로 로그인돼요.
      </p>
      {result?.message && <p className={styles.alert}>{result.message}</p>}
      <label className={styles.field}>
        <span className={styles.label}>새 비밀번호</span>
        <input name="password" type="password" autoComplete="new-password" className={styles.input} aria-invalid={Boolean(errors.password)} />
        {errors.password && <span className={styles.error}>{errors.password}</span>}
      </label>
      <label className={styles.field}>
        <span className={styles.label}>새 비밀번호 확인</span>
        <input name="confirm" type="password" autoComplete="new-password" className={styles.input} aria-invalid={Boolean(errors.confirm)} />
        {errors.confirm && <span className={styles.error}>{errors.confirm}</span>}
      </label>
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "저장 중..." : "비밀번호 바꾸기"}
      </button>
    </form>
  );
}

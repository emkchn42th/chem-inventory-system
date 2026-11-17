"use client";

// 로그인 / 회원가입 입력 폼 (로그인 기능 단계)
// 위쪽 탭으로 두 화면을 오간다. 검사에 걸리면 항목 아래에 안내가 나오고 입력값은 남는다.

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import styles from "./AuthForm.module.css";
import { login, register } from "../app/login/actions";

function Submit({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "처리 중..." : label}
    </button>
  );
}

function Field({ label, name, type = "text", error, defaultValue, autoComplete, placeholder, hint }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={styles.input}
        aria-invalid={Boolean(error)}
      />
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

export default function AuthForm({ mode, next, dbReady }) {
  const isSignup = mode === "signup";
  const [state, action] = useFormState(isSignup ? register : login, null);
  const errors = state?.errors ?? {};
  const v = state?.values ?? {};
  const nextQuery = next && next !== "/" ? `&next=${encodeURIComponent(next)}` : "";

  return (
    <div>
      <div className={styles.tabs} role="tablist">
        <Link
          href={`/login?mode=login${nextQuery}`}
          className={`${styles.tab} ${!isSignup ? styles.tabActive : ""}`}
          role="tab"
          aria-selected={!isSignup}
        >
          로그인
        </Link>
        <Link
          href={`/login?mode=signup${nextQuery}`}
          className={`${styles.tab} ${isSignup ? styles.tabActive : ""}`}
          role="tab"
          aria-selected={isSignup}
        >
          회원가입
        </Link>
      </div>

      {!dbReady && <p className={styles.warn}>DB가 연결되지 않아 지금은 로그인할 수 없어요.</p>}
      {state?.message && <p className={state.done ? styles.success : styles.alert}>{state.message}</p>}

      {state?.done ? (
        <Link href={`/login?mode=login${nextQuery}`} className={styles.submit}>
          로그인하러 가기
        </Link>
      ) : (
        <form action={action} className={styles.form} noValidate key={mode}>
          <input type="hidden" name="next" value={next} />
          {isSignup && (
            <div className={styles.twoCol}>
              <Field label="학번" name="studentId" error={errors.studentId} defaultValue={v.studentId} placeholder="2107" autoComplete="off" />
              <Field label="이름" name="name" error={errors.name} defaultValue={v.name} placeholder="엄기찬" autoComplete="name" />
            </div>
          )}
          <Field label="이메일" name="email" type="email" error={errors.email} defaultValue={v.email} autoComplete="email" placeholder="example@school.kr" />
          <Field
            label="비밀번호"
            name="password"
            type="password"
            error={errors.password}
            autoComplete={isSignup ? "new-password" : "current-password"}
            hint={isSignup ? "8자 이상" : undefined}
          />
          {isSignup && (
            <Field label="비밀번호 확인" name="confirm" type="password" error={errors.confirm} autoComplete="new-password" />
          )}
          <Submit label={isSignup ? "회원가입" : "로그인"} />
        </form>
      )}
    </div>
  );
}

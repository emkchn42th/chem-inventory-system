"use server";

// 로그인 · 회원가입 · 로그아웃 서버 함수 (로그인 기능 단계)

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../../lib/supabase";
import { signInWithPassword, signUp, signOutRemote, authErrorMessage } from "../../lib/auth-api";
import { saveSession, clearSession, getAccessToken } from "../../lib/auth";

const NO_DB = "DB가 연결되어 있지 않아 로그인할 수 없어요. (.env.local 의 Supabase 설정을 확인하세요)";

// 로그인 후 돌아갈 주소. 우리 사이트 안의 주소만 허용한다. (다른 사이트로 보내는 속임수 방지)
function safeNext(value) {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(prevState, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const values = { email };

  if (!isSupabaseConfigured()) return { message: NO_DB, values };
  const errors = {};
  if (!EMAIL_RE.test(email)) errors.email = "이메일을 정확히 입력하세요.";
  if (!password) errors.password = "비밀번호를 입력하세요.";
  if (Object.keys(errors).length) return { errors, values };

  const result = await signInWithPassword(email, password);
  if (!result.ok || !result.data?.access_token) {
    return { message: authErrorMessage(result), values };
  }
  saveSession(result.data);
  redirect(next);
}

export async function register(prevState, formData) {
  const values = {
    studentId: String(formData.get("studentId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = safeNext(formData.get("next"));

  if (!isSupabaseConfigured()) return { message: NO_DB, values };

  const errors = {};
  if (!/^\d{4,5}$/.test(values.studentId)) errors.studentId = "학번은 숫자 4~5자리로 입력하세요. (예: 2617)";
  if (!/^[가-힣a-zA-Z ]{2,20}$/.test(values.name)) errors.name = "이름을 2~20자로 입력하세요.";
  if (!EMAIL_RE.test(values.email)) errors.email = "이메일을 정확히 입력하세요.";
  if (password.length < 8) errors.password = "비밀번호는 8자 이상이어야 해요.";
  else if (password !== confirm) errors.confirm = "비밀번호가 서로 달라요.";
  if (Object.keys(errors).length) return { errors, values };

  const result = await signUp(values.email, password, { student_id: values.studentId, name: values.name });
  if (!result.ok) return { message: authErrorMessage(result), values };

  // "이메일 확인"이 꺼져 있으면 바로 로그인 정보가 온다
  if (result.data?.access_token) {
    saveSession(result.data);
    redirect(next);
  }

  // 켜져 있으면 메일의 확인 링크를 눌러야 로그인할 수 있다
  return {
    done: true,
    message: `${values.email} 로 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.`,
    values,
  };
}

export async function logout() {
  const token = getAccessToken();
  if (token) await signOutRemote(token).catch(() => null);
  clearSession();
  redirect("/");
}

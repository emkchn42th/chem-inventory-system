// Supabase 로그인 서버(Auth)와 주고받는 함수 (로그인 기능 단계)
//
// 라이브러리 없이 Supabase Auth 의 주소로 직접 요청한다.
// middleware.js(모든 요청 앞에서 실행)에서도 쓰기 때문에 브라우저용·Node 전용 기능은 쓰지 않는다.

import { supabaseBaseUrl } from "./supabase";

export const ACCESS_COOKIE = "chem-access-token";
export const REFRESH_COOKIE = "chem-refresh-token";

// 로그인 출입증(JWT) 안의 정보를 꺼낸다.
// JWT 는 "머리.내용.서명" 세 부분이고, 가운데 내용이 base64 로 적혀 있다.
// 여기서는 화면 표시용으로만 읽는다. 진짜인지(서명)는 Supabase DB 가 요청을 받을 때 확인한다.
export function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)); // 한글 이름이 깨지지 않게 UTF-8 로 읽는다
  } catch {
    return null;
  }
}

// 출입증이 seconds 초 안에 만료되는지
export function isExpiring(token, seconds = 60) {
  const payload = token ? decodeJwt(token) : null;
  if (!payload?.exp) return true;
  return payload.exp * 1000 - Date.now() < seconds * 1000;
}

async function authFetch(path, body, token) {
  const key = process.env.SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseBaseUrl()}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${token || key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

// 이메일·비밀번호로 로그인 -> { access_token, refresh_token, expires_in, user }
export function signInWithPassword(email, password) {
  return authFetch("token?grant_type=password", { email, password });
}

// 회원가입. 학번·이름은 계정의 추가 정보(user_metadata)로 저장한다.
// Supabase 설정에서 "이메일 확인"이 꺼져 있으면 바로 로그인 정보(access_token)가 함께 온다.
export function signUp(email, password, metadata) {
  return authFetch("signup", { email, password, data: metadata });
}

// 오래된 출입증을 새것으로 바꾸기
export function refreshSession(refreshToken) {
  return authFetch("token?grant_type=refresh_token", { refresh_token: refreshToken });
}

export function signOutRemote(accessToken) {
  return authFetch("logout", {}, accessToken);
}

// Supabase 가 보내는 영어 오류를 한국어 안내로 바꾼다
export function authErrorMessage(result) {
  const text = `${result.data?.error_code ?? ""} ${result.data?.msg ?? ""} ${result.data?.message ?? ""} ${
    result.data?.error_description ?? ""
  } ${result.data?.error ?? ""}`.toLowerCase();

  if (text.includes("invalid login") || text.includes("invalid_credentials")) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (text.includes("not confirmed") || text.includes("email_not_confirmed")) return "이메일 인증을 먼저 완료해 주세요. 받은편지함을 확인하세요.";
  if (text.includes("already registered") || text.includes("user_already_exists") || text.includes("already been registered"))
    return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (text.includes("same_password") || text.includes("different from the old"))
    return "예전과 같은 비밀번호예요. 다른 비밀번호를 써 주세요.";
  if (text.includes("expired") || text.includes("bad_jwt") || text.includes("invalid jwt") || result.status === 401)
    return "재설정 링크가 만료됐어요. 메일을 다시 받아 주세요.";
  if (text.includes("weak") || text.includes("password should")) return "비밀번호가 너무 쉬워요. 8자 이상으로 다른 비밀번호를 써 주세요.";
  if (text.includes("invalid") && text.includes("email")) return "이메일 형식이 올바르지 않아요.";
  if (result.status === 429 || text.includes("rate limit")) return "요청이 너무 많아요. 잠시 뒤에 다시 시도해 주세요.";
  if (text.includes("signups not allowed") || text.includes("signup_disabled")) return "지금은 회원가입이 꺼져 있어요. (Supabase 설정 확인)";
  return "처리하지 못했어요. 잠시 뒤에 다시 시도해 주세요.";
}

// 비밀번호 재설정 메일 보내기 (메일 속 링크를 누르면 redirectTo 주소로 돌아온다)
export function sendPasswordReset(email, redirectTo) {
  const key = process.env.SUPABASE_ANON_KEY;
  return fetch(`${supabaseBaseUrl()}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
    cache: "no-store",
  }).then(async (response) => ({ ok: response.ok, status: response.status, data: await response.json().catch(() => ({})) }));
}

// 새 비밀번호로 바꾸기 (재설정 링크로 받은 출입증이 필요)
export function updatePassword(accessToken, password) {
  const key = process.env.SUPABASE_ANON_KEY;
  return fetch(`${supabaseBaseUrl()}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    cache: "no-store",
  }).then(async (response) => ({ ok: response.ok, status: response.status, data: await response.json().catch(() => ({})) }));
}

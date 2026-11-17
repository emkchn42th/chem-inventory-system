// 지금 로그인한 사람이 누구인지 알아내는 함수 (로그인 기능 단계)
// 서버(화면 그리기, 서버 함수)에서만 쓴다. 브라우저 쿠키에 담긴 출입증을 읽는다.

import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE, decodeJwt, isExpiring } from "./auth-api";

// 로그인한 사람 정보. 로그인하지 않았으면 null
//   { id, email, name, studentId, label: "2107 엄기찬" }
export function getUser() {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token || isExpiring(token, 0)) return null;
  const payload = decodeJwt(token);
  if (!payload?.sub) return null;
  const meta = payload.user_metadata ?? {};
  const name = String(meta.name ?? "").trim();
  const studentId = String(meta.student_id ?? "").trim();
  return {
    id: payload.sub,
    email: payload.email ?? "",
    name,
    studentId,
    label: [studentId, name].filter(Boolean).join(" ") || payload.email || "사용자",
  };
}

// DB 에 "이 사람이 보냈다"고 알려 줄 출입증. 로그인하지 않았으면 null
export function getAccessToken() {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token || isExpiring(token, 0)) return null;
  return token;
}

// 로그인 성공 후 출입증을 쿠키에 저장 (서버 함수 안에서만 부를 수 있다)
//   access  : 1시간 정도 쓰는 출입증
//   refresh : 출입증이 끝났을 때 새로 받는 데 쓰는 열쇠 (30일)
export function saveSession(session) {
  const store = cookies();
  const common = {
    httpOnly: true, // 자바스크립트로 훔쳐 갈 수 없게
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  store.set(ACCESS_COOKIE, session.access_token, { ...common, maxAge: session.expires_in ?? 3600 });
  store.set(REFRESH_COOKIE, session.refresh_token, { ...common, maxAge: 60 * 60 * 24 * 30 });
}

export function clearSession() {
  const store = cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

// 모든 화면 요청 앞에서 실행되는 코드 (로그인 기능 단계)
//
// 로그인 출입증(access token)은 1시간쯤 지나면 끝난다.
// 끝나 가면 refresh token 으로 새 출입증을 받아 쿠키를 바꿔 준다.
// 그래서 한 번 로그인하면 30일 동안은 다시 로그인하지 않아도 된다.

import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, isExpiring, refreshSession } from "./lib/auth-api";

export async function middleware(request) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return NextResponse.next();

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  // 로그인 안 했거나, 출입증이 아직 넉넉하면 그냥 통과
  if (!refresh || (access && !isExpiring(access, 60))) return NextResponse.next();

  const result = await refreshSession(refresh).catch(() => null);
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  if (!result?.ok || !result.data?.access_token) {
    // 지금 출입증이 아직 쓸 만하면 그대로 둔다.
    // (여러 요청이 동시에 갱신을 시도하면 하나만 성공할 수 있어서, 그때 로그아웃되지 않게)
    if (access && !isExpiring(access, 0)) return NextResponse.next();
    // 출입증도 끝났고 열쇠도 쓸 수 없으면 로그아웃 상태로 만든다
    request.cookies.delete(ACCESS_COOKIE);
    request.cookies.delete(REFRESH_COOKIE);
    const response = NextResponse.next({ request });
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const { access_token, refresh_token, expires_in } = result.data;
  // 이번 요청을 처리하는 서버 코드도 새 출입증을 보도록 요청 쿠키를 바꾼다
  request.cookies.set(ACCESS_COOKIE, access_token);
  request.cookies.set(REFRESH_COOKIE, refresh_token);
  const response = NextResponse.next({ request });
  // 브라우저에도 새 출입증을 저장
  response.cookies.set(ACCESS_COOKIE, access_token, { ...common, maxAge: expires_in ?? 3600 });
  response.cookies.set(REFRESH_COOKIE, refresh_token, { ...common, maxAge: 60 * 60 * 24 * 30 });
  return response;
}

export const config = {
  // 그림·스크립트 같은 파일 요청에는 실행하지 않는다
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

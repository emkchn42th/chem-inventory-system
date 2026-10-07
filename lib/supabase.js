// Supabase(DB)에서 표의 내용을 읽어 오는 아주 작은 도우미 (6차시)
//
// 라이브러리를 따로 설치하지 않고, Supabase 가 제공하는 주소(REST API)로
// 직접 요청을 보낸다. 서버에서만 실행되므로 키가 브라우저로 나가지 않는다.
//
// 필요한 설정 (.env.local 파일, 배포할 때는 Vercel 환경변수)
//   SUPABASE_URL       예) https://abcdxyz.supabase.co
//   SUPABASE_ANON_KEY  Supabase > Project Settings > API 의 anon public 키

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// 주소를 올바른 모양으로 다듬는다.
//   "https://abcd.supabase.co"  -> 그대로
//   "abcd.supabase.co"          -> 앞에 https:// 를 붙인다
//   "abcd" (프로젝트 ID만 적음)  -> https://abcd.supabase.co 로 만든다
function normalizeUrl(value) {
  let url = value.trim().replace(/\/+$/, "");
  if (!url.includes(".") && !url.includes("://")) url = `${url}.supabase.co`;
  if (!/^https?:\/\//.test(url)) url = `https://${url}`;
  return url;
}

// table : 표 이름, query : "order=id.asc" 같은 조건 (없어도 됨)
export async function selectRows(table, query = "") {
  const base = normalizeUrl(process.env.SUPABASE_URL);
  const url = `${base}/rest/v1/${table}?select=*${query ? `&${query}` : ""}`;

  const response = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
    cache: "no-store", // 항상 최신 내용을 가져온다
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase 읽기 실패 (${table}): ${response.status} ${detail}`);
  }
  return response.json();
}

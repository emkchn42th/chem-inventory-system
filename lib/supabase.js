// Supabase(DB)와 주고받는 아주 작은 도우미 (6차시 읽기, 7차시 추가, 8차시 수정)
//
// 라이브러리를 따로 설치하지 않고, Supabase 가 제공하는 주소(REST API)로
// 직접 요청을 보낸다. 서버에서만 실행되므로 키가 브라우저로 나가지 않는다.
//
// 필요한 설정 (.env.local 파일, 배포할 때는 Vercel 환경변수)
//   SUPABASE_URL       예) https://abcdxyz.supabase.co
//   SUPABASE_ANON_KEY  Supabase > Project Settings > API 의 anon(publishable) 키

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

// 요청마다 똑같이 붙는 인증 정보
function authHeaders() {
  const key = process.env.SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function tableUrl(table, query = "") {
  const base = normalizeUrl(process.env.SUPABASE_URL);
  return `${base}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

// table : 표 이름, query : "order=id.asc" 같은 조건 (없어도 됨)
export async function selectRows(table, query = "") {
  const response = await fetch(tableUrl(table, `select=*${query ? `&${query}` : ""}`), {
    headers: authHeaders(),
    cache: "no-store", // 항상 최신 내용을 가져온다
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase 읽기 실패 (${table}): ${response.status} ${detail}`);
  }
  return response.json();
}

// 표에 새 줄을 추가하고, 저장된 줄(번호 포함)을 돌려준다. (7차시)
// row 에 객체 하나를 주면 줄 하나, 배열을 주면 여러 줄이 한꺼번에 저장된다.
export async function insertRows(table, rows) {
  const response = await fetch(tableUrl(table), {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=representation", // 저장된 결과를 응답으로 돌려 달라는 뜻
    },
    body: JSON.stringify(rows),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase 저장 실패 (${table}): ${response.status} ${detail}`);
  }
  return response.json();
}

export async function insertRow(table, row) {
  const saved = await insertRows(table, row);
  return saved[0];
}

// 조건에 맞는 줄의 값을 바꾸고, "실제로 바뀐 줄"만 돌려준다. (8차시)
//   filter 예) "id=eq.3&status=eq.보관중"   (id 가 3 이고 지금 보관중인 줄만)
// 돌려받은 목록이 비어 있으면 조건에 맞는 줄이 없었다는 뜻이다.
// (두 사람이 동시에 같은 재고를 대여할 때, 먼저 바꾼 사람만 성공하게 만드는 데 쓴다)
export async function updateRows(table, filter, patch) {
  const response = await fetch(tableUrl(table, filter), {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase 수정 실패 (${table}): ${response.status} ${detail}`);
  }
  return response.json();
}

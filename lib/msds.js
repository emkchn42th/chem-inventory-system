// MSDS 원문 글자를 화면에 보여주기 좋은 형태로 바꾸는 함수들 (4차시)
//
// 1차시에 API로 받아 온 MSDS 내용은 이렇게 "글자 덩어리"로 저장되어 있다.
//
//   신호어: 위험
//   유해·위험문구: H225 : 고인화성 액체 및 증기|H319 : 눈에 심한 자극을 일으킴
//
//   - 줄바꿈(\n)으로 항목이 나뉘고
//   - "이름: 내용" 형태이며
//   - 내용 안에서 여러 개는 세로선(|)으로 이어져 있다.
//
// 이 파일은 그 글자 덩어리를 [{ label, items }] 배열로 잘라 준다.

// 괄호 안에 "기재", "명시"가 들어 있으면 지운다.
//
// MSDS 문구에는 "(암을 일으키는 노출 경로를 기재한다. …)" 처럼
// 문서 작성자에게 주는 안내가 그대로 남아 있는 경우가 있어서,
// 화면에는 필요 없는 부분을 걷어 낸다.
// 괄호 안에 괄호가 또 있는 경우도 있어서 정규식 대신 한 글자씩 짝을 맞춘다.
export function stripWriterNotes(text) {
  let result = "";
  let i = 0;

  while (i < text.length) {
    if (text[i] !== "(") {
      result += text[i];
      i += 1;
      continue;
    }

    // "(" 를 만나면 짝이 맞는 ")" 를 찾는다
    let depth = 0;
    let end = -1;
    for (let j = i; j < text.length; j += 1) {
      if (text[j] === "(") depth += 1;
      if (text[j] === ")") depth -= 1;
      if (depth === 0) {
        end = j;
        break;
      }
    }

    if (end === -1) {          // 짝이 없으면 그냥 둔다
      result += text[i];
      i += 1;
      continue;
    }

    const group = text.slice(i, end + 1);
    if (/기재|명시/.test(group)) {
      i = end + 1;             // 안내 문구이므로 통째로 건너뛴다
    } else {
      result += group;         // 일반 괄호는 그대로 살린다
      i = end + 1;
    }
  }

  return result.replace(/\s{2,}/g, " ").trim();
}

// MSDS 원문에는 "&lt;" 처럼 HTML 특수문자 표기가 섞여 있다.
// 그대로 화면에 찍으면 "&lt; 0.001" 로 보이므로 원래 기호로 되돌린다.
export function decodeEntities(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&"); // &amp; 는 다른 것을 다 바꾼 뒤 마지막에
}

// 글자 덩어리 → [{ label: "신호어", items: ["위험"] }, ...]
export function parseSection(text) {
  if (!text) return [];

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const colon = line.indexOf(":");
      // 첫 번째 ":" 앞이 이름, 뒤가 내용
      const label = colon === -1 ? "" : line.slice(0, colon).trim();
      const body = colon === -1 ? line : line.slice(colon + 1);

      const items = body
        .split("|")
        .map((item) => stripWriterNotes(decodeEntities(item.trim())))
        .filter((item) => item.length > 0)
        .filter((item) => !item.startsWith("※출처")); // 출처 표시는 화면에서 뺀다

      return { label, items };
    });
}

// parseSection 결과에서 이름으로 하나 꺼내기
export function findItems(sections, label) {
  const found = sections.find((section) => section.label === label);
  return found ? found.items : [];
}

// "H225 : 고인화성 액체 및 증기" -> { code: "H225", text: "고인화성 액체 및 증기" }
export function splitCode(item) {
  const index = item.indexOf(" : ");
  if (index === -1) return { code: "", text: item };
  return { code: item.slice(0, index).trim(), text: item.slice(index + 3).trim() };
}

// 그림문자(GHS) 번호별 뜻. 원문에는 "GHS02.gif" 처럼 파일 이름만 들어 있다.
const GHS_INFO = {
  GHS01: { name: "폭발성", emoji: "💥" },
  GHS02: { name: "인화성", emoji: "🔥" },
  GHS03: { name: "산화성", emoji: "⭕" },
  GHS04: { name: "고압가스", emoji: "🎈" },
  GHS05: { name: "부식성", emoji: "🧪" },
  GHS06: { name: "급성독성", emoji: "☠️" },
  GHS07: { name: "자극·유해", emoji: "❗" },
  GHS08: { name: "건강유해", emoji: "🫁" },
  GHS09: { name: "환경유해", emoji: "🐟" },
};

export function describePictogram(fileName) {
  const key = fileName.replace(/\.\w+$/, "").toUpperCase(); // "GHS02.gif" -> "GHS02"
  return { key, ...(GHS_INFO[key] ?? { name: key, emoji: "⚠️" }) };
}

// 시약 하나의 MSDS를 화면용으로 한 번에 정리한다.
export function buildMsdsView(reagent) {
  const hazard = parseSection(reagent.위험성);

  return {
    signal: findItems(hazard, "신호어")[0] ?? "",
    pictograms: findItems(hazard, "그림문자").map(describePictogram),
    classes: findItems(hazard, "유해성·위험성 분류"),
    hazardStatements: findItems(hazard, "유해·위험문구").map(splitCode),
    precautions: [
      { title: "예방", items: findItems(hazard, "예방").map(splitCode) },
      { title: "대응", items: findItems(hazard, "대응").map(splitCode) },
      { title: "저장", items: findItems(hazard, "저장").map(splitCode) },
      { title: "폐기", items: findItems(hazard, "폐기").map(splitCode) },
    ].filter((group) => group.items.length > 0),
    properties: parseSection(reagent.특성).map((row) => ({
      label: row.label,
      value: row.items.join(" "),
    })),
    handling: parseSection(reagent.취급저장방법),
    firstAid: parseSection(reagent.응급조치),
  };
}

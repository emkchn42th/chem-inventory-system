#!/usr/bin/env python3
"""
공공데이터포털 - 한국산업안전보건공단 물질안전보건자료(MSDS) 조회 서비스에서
시약 예시 데이터를 받아 data/reagents.csv, data/reagents.json 으로 저장한다.

사용법
  1) 공공데이터포털에서 활용신청 후 받은 '디코딩' 인증키를 .env 에 적는다.
       MSDS_SERVICE_KEY=여기에_디코딩된_인증키
  2) python scripts/fetch_msds.py

API 문서: https://www.data.go.kr/data/15157612/openapi.do
"""

import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

# 이 API의 공통 주소. 뒤에 /getChemList 같은 오퍼레이션 이름을 붙여서 호출한다.
BASE_URL = "https://apis.data.go.kr/B552468/msdschem"

# 가져올 시약 목록: (표시할 이름, 카테고리 목록, CAS 번호, 이름 검색어 후보)
#
# 카테고리는 태그처럼 여러 개를 달 수 있다. 시약 하나가 두 성질을 동시에
# 가질 수 있기 때문이다. 예를 들어 아세트산(빙초산)은 유기물이면서 산이므로
# ["유기", "산"] 처럼 두 개를 넣으면 된다.
#
# CAS 번호는 물질마다 하나씩 붙는 세계 공통 등록번호라서 이름보다 정확하다.
# 이름으로만 찾으면 "마그네슘" -> "산화마그네슘", "염산" -> "염산 오라민"처럼
# 전혀 다른 물질이 검색될 수 있으므로, CAS 번호를 먼저 시도하고
# 결과가 없을 때만 이름으로 다시 찾는다.
REAGENTS = [
    ("에탄올",       ["유기"], "64-17-5",   ["에탄올", "에틸알코올"]),
    ("아세톤",       ["유기"], "67-64-1",   ["아세톤"]),
    ("수산화나트륨", ["염기"], "1310-73-2", ["수산화나트륨"]),
    ("마그네슘",     ["금속"], "7439-95-4", ["마그네슘"]),
    ("염산",         ["산"],   "7647-01-0", ["염화수소", "염산"]),
]

# MSDS 16개 항목 중 우리 서비스에 필요한 것만 고른다.
# (엔드포인트 이름 -> 우리 데이터에서 쓸 컬럼 이름)
DETAIL_SECTIONS = {
    "getChemDetail02": "위험성",        # 2. 유해성·위험성
    "getChemDetail09": "특성",          # 9. 물리화학적 특성
    "getChemDetail07": "취급저장방법",  # 7. 취급 및 저장방법
    "getChemDetail04": "응급조치",      # 4. 응급조치요령
}

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"


def load_service_key():
    """환경변수 또는 .env 파일에서 인증키를 읽어온다."""
    key = os.environ.get("MSDS_SERVICE_KEY")
    if key:
        return key.strip()

    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("MSDS_SERVICE_KEY="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
                if value and not value.startswith("여기에"):
                    return value

    sys.exit(
        "[오류] 인증키를 찾을 수 없습니다.\n"
        "       .env 파일을 열어 MSDS_SERVICE_KEY= 뒤의 예시 문구를\n"
        "       공공데이터포털에서 받은 일반 인증키(Decoding) 값으로 바꿔주세요."
    )


def call_api(operation, params, service_key):
    """API를 호출하고 XML을 파싱해서 <item> 목록을 돌려준다."""
    # urlencode 가 인증키를 알아서 URL 인코딩해 주므로 '디코딩' 키를 그대로 넣는다.
    query = urllib.parse.urlencode({"serviceKey": service_key, **params})
    url = f"{BASE_URL}/{operation}?{query}"

    with urllib.request.urlopen(url, timeout=20) as res:
        raw = res.read().decode("utf-8")

    root = ET.fromstring(raw)

    # 인증키가 잘못됐을 때는 형식이 다른 오류 XML이 돌아온다.
    auth_msg = root.findtext(".//returnAuthMsg")
    if auth_msg:
        reason = root.findtext(".//returnReasonCode")
        raise RuntimeError(f"인증 오류: {auth_msg} (returnReasonCode={reason})")

    result_code = root.findtext(".//resultCode")
    if result_code is not None and result_code.strip() not in ("00", "0"):
        raise RuntimeError(
            f"resultCode={result_code.strip()} / resultMsg={root.findtext('.//resultMsg')}"
        )

    return root.findall(".//item")


def search(keyword, cond, service_key):
    """getChemList 를 호출해 첫 번째 검색 결과를 돌려준다. 없으면 None."""
    items = call_api(
        "getChemList",
        {
            "searchWrd": keyword,
            "searchCnd": cond,   # 0=국문명, 1=CAS No, 2=UN No, 3=KE No, 4=EN No
            "numOfRows": 5,
            "pageNo": 1,
        },
        service_key,
    )
    if not items:
        return None

    first = items[0]
    return {
        "chemId": (first.findtext("chemId") or "").strip(),
        "casNo": (first.findtext("casNo") or "").strip(),
        "chemNameKor": (first.findtext("chemNameKor") or "").strip(),
    }


def find_chem(cas_no, candidates, service_key):
    """CAS 번호로 먼저 찾고, 실패하면 이름으로 찾는다."""
    if cas_no:
        found = search(cas_no, 1, service_key)
        if found:
            return found
        print(f"    - CAS {cas_no} 검색 결과 없음 -> 이름으로 재시도")

    for word in candidates:
        found = search(word, 0, service_key)
        if found:
            print(f"    - 이름 '{word}' 으로 찾음 (CAS 검색 실패분이니 결과를 꼭 확인할 것)")
            return found
        print(f"    - '{word}' 검색 결과 없음 -> 다음 후보로 재시도")

    return None


def fetch_section(operation, chem_id, service_key):
    """MSDS 한 항목(예: 유해성·위험성)의 세부 내용을 한 덩어리 텍스트로 만든다."""
    items = call_api(operation, {"chemId": chem_id}, service_key)

    lines = []
    for item in items:
        title = (item.findtext("msdsItemNameKor") or "").strip()
        detail = (item.findtext("itemDetail") or "").strip()
        if not detail or detail in ("자료없음", "-", "해당없음"):
            continue
        lines.append(f"{title}: {detail}" if title else detail)

    return "\n".join(lines)


def main():
    service_key = load_service_key()
    DATA_DIR.mkdir(exist_ok=True)

    rows = []
    for display_name, categories, cas_no, candidates in REAGENTS:
        print(f"[검색] {display_name}")

        try:
            chem = find_chem(cas_no, candidates, service_key)
        except Exception as error:
            print(f"    !! 검색 실패: {error}")
            continue

        if not chem:
            print(f"    !! '{display_name}' 을(를) 찾지 못해 건너뜁니다.")
            continue

        print(f"    -> chemId={chem['chemId']} / {chem['chemNameKor']} (CAS {chem['casNo']})")

        row = {
            "시약명": display_name,
            "카테고리": categories,
            "정식명칭": chem["chemNameKor"],
            "CAS번호": chem["casNo"],
            "chemId": chem["chemId"],
        }

        for operation, column in DETAIL_SECTIONS.items():
            time.sleep(0.3)   # 서버에 부담을 주지 않도록 잠깐 쉬어 간다
            try:
                row[column] = fetch_section(operation, chem["chemId"], service_key)
                print(f"    -> {column} {len(row[column])}자 수집")
            except Exception as error:
                print(f"    !! {column} 수집 실패: {error}")
                row[column] = ""

        rows.append(row)

    if not rows:
        sys.exit("[오류] 수집된 데이터가 없습니다. 인증키와 검색어를 확인해 주세요.")

    json_path = DATA_DIR / "reagents.json"
    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    # CSV는 한 칸에 값을 하나만 넣는 형식이라, 카테고리가 여러 개일 때는
    # 세미콜론(;)으로 이어 붙인다. 예) ["유기", "산"] -> "유기;산"
    csv_rows = []
    for row in rows:
        csv_row = dict(row)
        csv_row["카테고리"] = ";".join(row["카테고리"])
        csv_rows.append(csv_row)

    csv_path = DATA_DIR / "reagents.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()))
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"\n완료: 시약 {len(rows)}종 저장")
    print(f"  {json_path}")
    print(f"  {csv_path}")


if __name__ == "__main__":
    main()

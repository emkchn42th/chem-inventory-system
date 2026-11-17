"""data/ 폴더의 예시 데이터를 Supabase 에 넣을 SQL(supabase/seed.sql)로 바꾼다.

사용법:  python scripts/make_seed.py
만들어지는 파일 (Supabase SQL Editor 에 붙여넣고 Run)
  supabase/seed.sql           처음 설치용: 시약 + 기본 재고 10개
  supabase/seed_reagents.sql  시약 종류만 추가·갱신 (지금 쓰는 DB에 시약을 늘릴 때)
  supabase/seed_dummy.sql     테스트용 더미 재고 (재고번호 101번부터)
(키가 필요 없고, 여러 번 실행해도 같은 결과가 된다)
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def q(value):
    """글자를 SQL 문자열로. 비어 있으면 null. 따옴표 문제를 피하려고 $q$ 로 감싼다."""
    if value is None or str(value).strip() == "":
        return "null"
    return f"$q${value}$q$"


DUMMY_START = 101  # 재고번호 101번부터는 테스트용 더미 재고


def reagents_sql(reagents):
    """시약 정보 넣기(이미 있으면 내용만 새로 고침)"""
    out = ["insert into reagents (name, categories, official_name, cas, chem_id, hazard, properties, handling, first_aid) values"]
    rows = []
    for r in reagents:
        cats = r.get("카테고리") or []
        if isinstance(cats, str):
            cats = [c for c in cats.split(";") if c]
        arr = "array[" + ",".join(q(c) for c in cats) + "]::text[]" if cats else "'{}'::text[]"
        rows.append(
            f"  ({q(r['시약명'])}, {arr}, {q(r.get('정식명칭'))}, {q(r.get('CAS번호'))}, "
            f"{q(r.get('chemId'))}, {q(r.get('위험성'))}, {q(r.get('특성'))}, "
            f"{q(r.get('취급저장방법'))}, {q(r.get('응급조치'))})"
        )
    out.append(",\n".join(rows))
    out.append("on conflict (name) do update set categories = excluded.categories,")
    out.append("  official_name = excluded.official_name, cas = excluded.cas, chem_id = excluded.chem_id,")
    out.append("  hazard = excluded.hazard, properties = excluded.properties,")
    out.append("  handling = excluded.handling, first_aid = excluded.first_aid;")
    return out


def note_sql(r):
    return q(r["비고"]) if r["비고"].strip() else "''"


def main():
    reagents = json.loads((ROOT / "data" / "reagents.json").read_text(encoding="utf-8"))
    with open(ROOT / "data" / "inventory.csv", encoding="utf-8", newline="") as f:
        inventory = list(csv.DictReader(f))
    basic = [r for r in inventory if int(r["재고번호"]) < DUMMY_START]
    dummy = [r for r in inventory if int(r["재고번호"]) >= DUMMY_START]

    # ---------------------------------------------------------------
    # 1) seed.sql : 처음 설치할 때 (6차시) — 시약 + 기본 재고 10개
    # ---------------------------------------------------------------
    out = ["-- 자동 생성 파일: python scripts/make_seed.py", ""]
    out += reagents_sql(reagents)
    out.append("")
    out.append("insert into inventory (id, reagent_name, purchased_on, opened_on, expires_on, amount, location, status, note) values")
    rows = []
    for r in basic:
        rows.append(
            f"  ({int(r['재고번호'])}, {q(r['시약명'])}, {q(r['구매일'])}::date, {q(r['개봉일'])}::date, "
            f"{q(r['유효기한'])}::date, {q(r['남은양'])}, {q(r['보관위치'])}, "
            f"{q(r['현재상태'] or '보관중')}, {note_sql(r)})"
        )
    out.append(",\n".join(rows))
    out.append("on conflict (id) do update set reagent_name = excluded.reagent_name,")
    out.append("  purchased_on = excluded.purchased_on, opened_on = excluded.opened_on,")
    out.append("  expires_on = excluded.expires_on, amount = excluded.amount,")
    out.append("  location = excluded.location, status = excluded.status, note = excluded.note;")
    out.append("")
    out.append("-- 다음에 새 재고를 추가할 때 번호가 겹치지 않도록 번호표를 맞춘다")
    out.append("select setval(pg_get_serial_sequence('inventory', 'id'), (select max(id) from inventory));")
    path = ROOT / "supabase" / "seed.sql"
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"{path.relative_to(ROOT)} 생성 완료 (시약 {len(reagents)}종, 재고 {len(basic)}개)")

    # ---------------------------------------------------------------
    # 2) seed_reagents.sql : 시약 종류만 추가·갱신 (이미 쓰고 있는 DB용)
    #    재고·대여 기록은 건드리지 않는다.
    # ---------------------------------------------------------------
    out = ["-- 자동 생성 파일: python scripts/make_seed.py",
           "-- 시약 정보만 넣는다. 이미 있는 시약은 MSDS 내용만 새로 고친다. 재고·대여 기록은 그대로.", ""]
    out += reagents_sql(reagents)
    path = ROOT / "supabase" / "seed_reagents.sql"
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"{path.relative_to(ROOT)} 생성 완료 (시약 {len(reagents)}종)")

    # ---------------------------------------------------------------
    # 3) seed_dummy.sql : 테스트용 더미 재고 (재고번호 101번부터)
    #    - DB에 없는 시약의 재고는 자동으로 건너뛴다
    #    - 이미 있는 번호는 건너뛴다 (내가 고친 내용을 덮어쓰지 않음)
    #    - 정량 칸을 쓰므로 policies_auth.sql 실행 뒤에 실행할 것
    # ---------------------------------------------------------------
    out = ["-- 자동 생성 파일: python scripts/make_seed.py",
           "-- 테스트용 더미 재고 (재고번호 101번부터). seed_reagents.sql 다음에 실행하세요.", "",
           "insert into inventory (id, reagent_name, purchased_on, opened_on, expires_on, amount, location, status, note,",
           "                       amount_mode, amount_value, capacity, unit)",
           "select v.id, v.reagent_name, v.purchased_on, v.opened_on, v.expires_on, v.amount, v.location, v.status, v.note,",
           "       v.amount_mode, v.amount_value, v.capacity, v.unit",
           "from (values"]
    rows = []
    for r in dummy:
        quant = r.get("잔량방식") == "정량"
        rows.append(
            f"  ({int(r['재고번호'])}, {q(r['시약명'])}, {q(r['구매일'])}::date, {q(r['개봉일'])}::date, "
            f"{q(r['유효기한'])}::date, {q(r['남은양'])}, {q(r['보관위치'])}, {q(r['현재상태'] or '보관중')}, {note_sql(r)}, "
            f"{q('정량' if quant else '정성')}, "
            f"{(r['잔량값'] if quant else 'null')}::numeric, {(r['전체용량'] if quant else 'null')}::numeric, "
            f"{q(r['단위']) if quant else 'null'}::text)"
        )
    out.append(",\n".join(rows))
    out.append(") as v(id, reagent_name, purchased_on, opened_on, expires_on, amount, location, status, note,")
    out.append("       amount_mode, amount_value, capacity, unit)")
    out.append("join reagents r on r.name = v.reagent_name")
    out.append("on conflict (id) do nothing;")
    out.append("")
    out.append("-- 다음에 새 재고를 추가할 때 번호가 겹치지 않도록 번호표를 맞춘다")
    out.append("select setval(pg_get_serial_sequence('inventory', 'id'), (select max(id) from inventory));")
    path = ROOT / "supabase" / "seed_dummy.sql"
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"{path.relative_to(ROOT)} 생성 완료 (더미 재고 {len(dummy)}개)")


if __name__ == "__main__":
    main()

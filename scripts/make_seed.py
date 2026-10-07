"""data/ 폴더의 예시 데이터를 Supabase 에 넣을 SQL(supabase/seed.sql)로 바꾼다.

사용법:  python scripts/make_seed.py
만들어진 supabase/seed.sql 을 Supabase SQL Editor 에 붙여넣고 Run 하면 된다.
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


def main():
    reagents = json.loads((ROOT / "data" / "reagents.json").read_text(encoding="utf-8"))
    with open(ROOT / "data" / "inventory.csv", encoding="utf-8", newline="") as f:
        inventory = list(csv.DictReader(f))

    out = ["-- 자동 생성 파일: python scripts/make_seed.py", ""]

    out.append("insert into reagents (name, categories, official_name, cas, chem_id, hazard, properties, handling, first_aid) values")
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
    out.append("")

    out.append("insert into inventory (id, reagent_name, purchased_on, opened_on, expires_on, amount, location, status, note) values")
    rows = []
    for r in inventory:
        note = q(r["비고"]) if r["비고"].strip() else "''"
        rows.append(
            f"  ({int(r['재고번호'])}, {q(r['시약명'])}, {q(r['구매일'])}::date, {q(r['개봉일'])}::date, "
            f"{q(r['유효기한'])}::date, {q(r['남은양'])}, {q(r['보관위치'])}, "
            f"{q(r['현재상태'] or '보관중')}, {note})"
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
    print(f"{path.relative_to(ROOT)} 생성 완료 (시약 {len(reagents)}종, 재고 {len(inventory)}개)")


if __name__ == "__main__":
    main()

-- 로그인 + 본인 대여만 반납 + 정량 잔량 (Supabase > SQL Editor 에서 Run)
-- policies_8.sql, policies_extra.sql 을 실행한 뒤에 실행하세요. 여러 번 실행해도 안전하다.
--
-- 바뀌는 점
--   1) 대여 기록(rentals)에 "누가 빌렸는지(user_id)"를 남긴다.
--   2) 대여·반납은 아래 두 함수로만 할 수 있다. 함수 안에서
--      "로그인했는지", "내가 빌린 것인지"를 DB가 직접 확인한다.
--      (웹사이트 코드를 우회해서 요청을 보내도 남의 재고는 반납할 수 없다)
--   3) 재고 추가·수정·삭제는 로그인한 사람만 할 수 있다. 읽기는 누구나 가능.
--   4) 남은 양을 숫자(정량)로도 기록할 수 있게 칸을 추가한다.

-- =====================================================================
-- 1. 표에 칸 추가
-- =====================================================================

-- 대여한 사람 (Supabase 로그인 계정 번호)
alter table rentals add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 남은 양 기록 방식
--   정성 : 상 / 중 / 하           (지금까지 방식)
--   정량 : 350 / 500 mL 처럼 숫자 (새 방식)
alter table inventory add column if not exists amount_mode text not null default '정성';
alter table inventory add column if not exists amount_value numeric;   -- 남은 양 (숫자)
alter table inventory add column if not exists capacity numeric;       -- 전체 용량 (숫자)
alter table inventory add column if not exists unit text;              -- 단위 (mL, L, g, kg)

alter table inventory drop constraint if exists inventory_amount_mode_check;
alter table inventory add constraint inventory_amount_mode_check check (
  amount_mode = '정성'
  or (
    amount_mode = '정량'
    and capacity > 0
    and amount_value >= 0
    and amount_value <= capacity
    and unit in ('mL', 'L', 'g', 'kg')
  )
);

-- =====================================================================
-- 2. 대여 함수 : rent_stocks(재고번호 목록, 대여자 이름)
--    보관중이고 유효기한이 지나지 않은 재고만 "사용중"으로 바꾸고 기록을 남긴다.
--    실제로 대여된 재고번호 목록을 돌려준다.
--    (한 함수 안에서 처리되므로 중간에 실패하면 전부 취소된다)
-- =====================================================================
create or replace function rent_stocks(p_ids integer[], p_borrower text default '')
returns integer[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_done integer[] := '{}';
  v_id   integer;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if char_length(coalesce(p_borrower, '')) > 40 then
    raise exception '대여자 이름이 너무 깁니다';
  end if;
  if coalesce(array_length(p_ids, 1), 0) > 20 then
    raise exception '한 번에 20개까지만 대여할 수 있습니다';
  end if;

  foreach v_id in array coalesce(p_ids, '{}') loop
    update inventory
       set status = '사용중'
     where id = v_id
       and status = '보관중'
       and (expires_on is null or expires_on >= (now() at time zone 'Asia/Seoul')::date);

    if found then
      insert into rentals (inventory_id, borrower, user_id)
      values (v_id, coalesce(p_borrower, ''), v_uid);
      v_done := v_done || v_id;
    end if;
  end loop;

  return v_done;
end;
$$;

-- =====================================================================
-- 3. 반납 함수 : return_stock(재고번호)
--    돌려주는 값
--      ok         : 반납 완료
--      login      : 로그인 필요
--      not_in_use : 사용중이 아님 (이미 반납됨)
--      not_yours  : 다른 사람이 빌린 재고
--    ※ 로그인 기능 전에 생긴 기록(대여자 계정 없음)은 로그인한 누구나 반납할 수 있다.
-- =====================================================================
create or replace function return_stock(p_id integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_rental_id integer;
  v_owner     uuid;
begin
  if v_uid is null then
    return 'login';
  end if;

  -- 아직 반납되지 않은 가장 최근 대여 기록 (동시에 두 번 처리되지 않게 잠근다)
  select id, user_id
    into v_rental_id, v_owner
    from rentals
   where inventory_id = p_id
     and returned_at is null
   order by id desc
   limit 1
   for update;

  if v_rental_id is not null and v_owner is not null and v_owner <> v_uid then
    return 'not_yours';
  end if;

  update inventory set status = '보관중' where id = p_id and status = '사용중';
  if not found then
    return 'not_in_use';
  end if;

  if v_rental_id is not null then
    update rentals set returned_at = now() where id = v_rental_id;
  end if;

  return 'ok';
end;
$$;

-- 함수는 로그인한 사람만 부를 수 있다
revoke all on function rent_stocks(integer[], text) from public, anon;
revoke all on function return_stock(integer) from public, anon;
grant execute on function rent_stocks(integer[], text) to authenticated;
grant execute on function return_stock(integer) to authenticated;

-- =====================================================================
-- 4. 권한 정리
-- =====================================================================

-- 대여 기록: 읽기만 공개. 쓰기는 위 함수만 할 수 있다.
drop policy if exists "rentals 추가" on rentals;
drop policy if exists "rentals 반납" on rentals;
revoke insert, update, delete on rentals from anon, authenticated;

-- 재고: 예전(로그인 없이 쓰던) 쓰기 규칙을 지우고 로그인한 사람용으로 다시 만든다
drop policy if exists "inventory 추가" on inventory;
drop policy if exists "inventory 수정" on inventory;
drop policy if exists "inventory 삭제" on inventory;
drop policy if exists "inventory 상태변경" on inventory;

revoke insert, update, delete on inventory from anon, authenticated;
grant insert on inventory to authenticated;
grant delete on inventory to authenticated;
-- 상태(status)는 직접 바꿀 수 없다. 대여·반납 함수로만 바뀐다.
grant update (purchased_on, opened_on, expires_on, amount, amount_mode, amount_value, capacity, unit, location, note)
  on inventory to authenticated;

create policy "inventory 추가" on inventory for insert to authenticated
  with check (
    status = '보관중'
    and amount in ('상', '중', '하')
    and char_length(coalesce(note, '')) <= 100
  );

create policy "inventory 수정" on inventory for update to authenticated
  using (true)
  with check (
    amount in ('상', '중', '하')
    and char_length(coalesce(note, '')) <= 100
  );

create policy "inventory 삭제" on inventory for delete to authenticated
  using (status = '보관중');

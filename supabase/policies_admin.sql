-- 관리자(선생님) 권한 + 폐기 처리 + 관리자 대신 반납 (Supabase > SQL Editor 에서 Run)
-- policies_auth.sql 을 실행한 뒤에 실행하세요. 여러 번 실행해도 안전하다.
--
-- 바뀌는 점
--   1) admins 표에 등록된 계정만 "관리자"가 된다. (선생님 계정을 직접 등록)
--   2) 재고 추가·수정·삭제·폐기는 관리자만 할 수 있다. 학생은 대여·반납만.
--   3) 관리자는 다른 사람이 빌린 재고도 대신 반납할 수 있다. (오래 안 돌려준 경우)
--   4) 만료·파손된 재고를 지우지 않고 "폐기" 상태로 기록을 남긴다.
--
-- ※ 실행 직후에는 관리자가 한 명도 없어서 아무도 재고를 추가할 수 없다.
--   맨 아래 "관리자 등록" 문장으로 선생님 계정을 등록하세요.

-- =====================================================================
-- 1. 관리자 표
-- =====================================================================
create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text not null default '',          -- 예) 화학 선생님
  created_at timestamptz not null default now()
);

alter table admins enable row level security;
drop policy if exists "admins 읽기" on admins;
create policy "admins 읽기" on admins for select using (true);   -- 누가 관리자인지는 화면 표시에 쓴다
revoke insert, update, delete on admins from anon, authenticated; -- 등록·삭제는 SQL Editor 에서만

-- 지금 로그인한 사람이 관리자인지
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
grant execute on function is_admin() to anon, authenticated;

-- =====================================================================
-- 2. 재고 쓰기 규칙: 관리자만
-- =====================================================================
drop policy if exists "inventory 추가" on inventory;
drop policy if exists "inventory 수정" on inventory;
drop policy if exists "inventory 삭제" on inventory;

create policy "inventory 추가" on inventory for insert to authenticated
  with check (
    is_admin()
    and status = '보관중'
    and amount in ('상', '중', '하')
    and char_length(coalesce(note, '')) <= 100
  );

create policy "inventory 수정" on inventory for update to authenticated
  using (is_admin())
  with check (
    is_admin()
    and amount in ('상', '중', '하')
    and char_length(coalesce(note, '')) <= 100
  );

create policy "inventory 삭제" on inventory for delete to authenticated
  using (is_admin() and status = '보관중');

-- =====================================================================
-- 3. 폐기 기록
-- =====================================================================
alter table inventory drop constraint if exists inventory_status_check;
alter table inventory add constraint inventory_status_check
  check (status in ('보관중', '사용중', '폐기'));

alter table inventory add column if not exists disposed_on     date;  -- 폐기한 날
alter table inventory add column if not exists disposal_method text;  -- 처리 방법
alter table inventory add column if not exists disposal_note   text;  -- 메모
alter table inventory add column if not exists disposed_by     text;  -- 처리한 사람 (학번 이름)

-- 폐기 처리 : dispose_stock(재고번호, 처리 방법, 메모, 처리한 사람)
--   ok            : 폐기 완료
--   forbidden     : 관리자가 아님
--   not_available : 보관중이 아님 (사용중이거나 이미 폐기됨)
create or replace function dispose_stock(p_id integer, p_method text, p_note text default '', p_by text default '')
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    return 'forbidden';
  end if;
  if coalesce(trim(p_method), '') = '' or char_length(p_method) > 40 or char_length(coalesce(p_note, '')) > 200 then
    raise exception '처리 방법과 메모를 확인하세요';
  end if;

  update inventory
     set status          = '폐기',
         disposed_on     = (now() at time zone 'Asia/Seoul')::date,
         disposal_method = trim(p_method),
         disposal_note   = coalesce(p_note, ''),
         disposed_by     = left(coalesce(p_by, ''), 40)
   where id = p_id
     and status = '보관중';

  if not found then
    return 'not_available';
  end if;
  return 'ok';
end;
$$;

revoke all on function dispose_stock(integer, text, text, text) from public, anon;
grant execute on function dispose_stock(integer, text, text, text) to authenticated;

-- =====================================================================
-- 4. 반납 함수 고치기: 관리자는 남의 재고도 대신 반납 가능
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

  select id, user_id
    into v_rental_id, v_owner
    from rentals
   where inventory_id = p_id
     and returned_at is null
   order by id desc
   limit 1
   for update;

  if v_rental_id is not null and v_owner is not null and v_owner <> v_uid and not is_admin() then
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

revoke all on function return_stock(integer) from public, anon;
grant execute on function return_stock(integer) to authenticated;

-- =====================================================================
-- 5. 관리자 등록 (선생님 계정을 사이트에서 먼저 회원가입한 뒤 실행)
--    아래 이메일을 실제 선생님 이메일로 바꾸고, 앞의 -- 를 지운 뒤 이 줄만 실행하세요.
-- =====================================================================
-- insert into admins (user_id, note) select id, '선생님' from auth.users where email = '선생님이메일@school.kr' on conflict do nothing;

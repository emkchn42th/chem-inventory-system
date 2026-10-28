-- 추가 기능: 재고 수정·삭제 권한 (Supabase > SQL Editor 에서 Run)
-- 8차시 SQL(policies_8.sql)을 먼저 실행한 뒤에 실행하세요. 여러 번 실행해도 안전하다.

-- 1) 수정: 8차시에는 status(상태)만 바꿀 수 있었다.
--    이제 날짜·남은 양·위치·비고도 고칠 수 있게 한다. (시약 종류와 번호는 못 바꿈)
revoke update on inventory from anon;
grant update (purchased_on, opened_on, expires_on, amount, location, note, status) on inventory to anon;

drop policy if exists "inventory 상태변경" on inventory;
drop policy if exists "inventory 수정" on inventory;
create policy "inventory 수정" on inventory for update
  using (true)
  with check (
    status in ('보관중', '사용중')
    and amount in ('상', '중', '하')
    and char_length(coalesce(note, '')) <= 100
  );

-- 2) 삭제: 보관중인 재고만 지울 수 있다. (사용중이면 먼저 반납해야 함)
--    지우면 그 재고의 대여 기록(rentals)도 함께 지워진다. (8차시에 on delete cascade 로 만들어 둠)
drop policy if exists "inventory 삭제" on inventory;
create policy "inventory 삭제" on inventory for delete
  using (status = '보관중');

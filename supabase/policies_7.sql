-- 7차시: 재고 추가(쓰기) 권한 (Supabase > SQL Editor 에서 Run)
-- 6차시에는 읽기만 허용했다. 이번에는 inventory 표에 "새 줄 추가"만 허용한다.
-- 수정·삭제는 허용하지 않는다. (8차시에 대여/반납용 수정 권한을 따로 추가)
-- 여러 번 실행해도 안전하다.

drop policy if exists "inventory 추가" on inventory;
create policy "inventory 추가" on inventory
  for insert
  with check (
    status = '보관중'                                   -- 새 재고는 항상 보관중으로만 시작
    and amount in ('상', '중', '하')
    and char_length(coalesce(note, '')) <= 100
  );

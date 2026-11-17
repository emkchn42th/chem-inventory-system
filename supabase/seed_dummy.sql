-- 자동 생성 파일: python scripts/make_seed.py
-- 테스트용 더미 재고 (재고번호 101번부터). seed_reagents.sql 다음에 실행하세요.

insert into inventory (id, reagent_name, purchased_on, opened_on, expires_on, amount, location, status, note,
                       amount_mode, amount_value, capacity, unit)
select v.id, v.reagent_name, v.purchased_on, v.opened_on, v.expires_on, v.amount, v.location, v.status, v.note,
       v.amount_mode, v.amount_value, v.capacity, v.unit
from (values
  (101, $q$황산$q$, $q$2025-03-02$q$::date, $q$2025-03-10$q$::date, $q$2027-03-02$q$::date, $q$중$q$, $q$D-2-1$q$, $q$보관중$q$, $q$진한 황산 98%$q$, $q$정량$q$, 320::numeric, 500::numeric, $q$mL$q$::text),
  (102, $q$황산$q$, $q$2024-01-15$q$::date, $q$2024-02-01$q$::date, $q$2026-01-15$q$::date, $q$하$q$, $q$D-2-2$q$, $q$보관중$q$, $q$유효기한 지남$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (103, $q$질산$q$, $q$2025-06-11$q$::date, $q$2025-06-20$q$::date, $q$2026-12-05$q$::date, $q$상$q$, $q$D-3-1$q$, $q$보관중$q$, $q$갈색병 보관$q$, $q$정량$q$, 420::numeric, 500::numeric, $q$mL$q$::text),
  (104, $q$인산$q$, $q$2025-09-01$q$::date, null::date, $q$2028-09-01$q$::date, $q$상$q$, $q$D-3-2$q$, $q$보관중$q$, $q$미개봉$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (105, $q$붕산$q$, $q$2025-02-10$q$::date, $q$2025-02-14$q$::date, $q$2028-02-10$q$::date, $q$중$q$, $q$D-4-1$q$, $q$보관중$q$, '', $q$정량$q$, 180::numeric, 500::numeric, $q$g$q$::text),
  (106, $q$아세트산$q$, $q$2025-04-03$q$::date, $q$2025-04-07$q$::date, $q$2027-04-03$q$::date, $q$상$q$, $q$A-3-1$q$, $q$보관중$q$, $q$빙초산$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (107, $q$아세트산$q$, $q$2024-10-20$q$::date, $q$2024-11-01$q$::date, $q$2026-12-20$q$::date, $q$하$q$, $q$A-3-2$q$, $q$보관중$q$, $q$유효기한 임박$q$, $q$정량$q$, 60::numeric, 500::numeric, $q$mL$q$::text),
  (108, $q$시트르산$q$, $q$2025-05-12$q$::date, $q$2025-05-15$q$::date, $q$2028-05-12$q$::date, $q$상$q$, $q$A-4-1$q$, $q$보관중$q$, '', $q$정성$q$, null::numeric, null::numeric, null::text),
  (109, $q$옥살산$q$, $q$2023-08-30$q$::date, $q$2023-09-05$q$::date, $q$2025-08-30$q$::date, $q$중$q$, $q$A-4-2$q$, $q$보관중$q$, $q$유효기한 지남$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (110, $q$벤조산$q$, $q$2025-07-01$q$::date, $q$2025-07-03$q$::date, $q$2029-07-01$q$::date, $q$상$q$, $q$A-4-3$q$, $q$보관중$q$, '', $q$정량$q$, 450::numeric, 500::numeric, $q$g$q$::text),
  (111, $q$수산화칼륨$q$, $q$2025-03-18$q$::date, $q$2025-03-20$q$::date, $q$2028-03-18$q$::date, $q$중$q$, $q$B-2-1$q$, $q$보관중$q$, $q$펠릿$q$, $q$정량$q$, 260::numeric, 500::numeric, $q$g$q$::text),
  (112, $q$수산화칼슘$q$, $q$2025-01-08$q$::date, $q$2025-01-10$q$::date, $q$2028-01-08$q$::date, $q$상$q$, $q$B-2-2$q$, $q$보관중$q$, $q$석회수 만들기용$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (113, $q$수산화바륨$q$, $q$2025-08-22$q$::date, null::date, $q$2028-08-22$q$::date, $q$상$q$, $q$B-2-3$q$, $q$보관중$q$, $q$미개봉 · 독성 주의$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (114, $q$암모니아수$q$, $q$2025-04-25$q$::date, $q$2025-05-02$q$::date, $q$2027-01-20$q$::date, $q$중$q$, $q$B-3-1$q$, $q$보관중$q$, $q$냄새 강함 · 환기$q$, $q$정량$q$, 210::numeric, 500::numeric, $q$mL$q$::text),
  (115, $q$암모니아수$q$, $q$2024-03-10$q$::date, $q$2024-03-15$q$::date, $q$2026-03-10$q$::date, $q$하$q$, $q$B-3-2$q$, $q$보관중$q$, $q$유효기한 지남$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (116, $q$탄산나트륨$q$, $q$2025-02-01$q$::date, $q$2025-02-03$q$::date, $q$2029-02-01$q$::date, $q$상$q$, $q$B-4-1$q$, $q$보관중$q$, '', $q$정성$q$, null::numeric, null::numeric, null::text),
  (117, $q$탄산수소나트륨$q$, $q$2025-06-30$q$::date, $q$2025-07-02$q$::date, $q$2029-06-30$q$::date, $q$중$q$, $q$B-4-2$q$, $q$사용중$q$, '', $q$정량$q$, 1.2::numeric, 2::numeric, $q$kg$q$::text),
  (118, $q$메탄올$q$, $q$2025-01-20$q$::date, $q$2025-01-25$q$::date, $q$2027-01-20$q$::date, $q$중$q$, $q$A-5-1$q$, $q$보관중$q$, $q$인화성 · 독성$q$, $q$정량$q$, 240::numeric, 500::numeric, $q$mL$q$::text),
  (119, $q$2-프로판올$q$, $q$2025-09-14$q$::date, $q$2025-09-20$q$::date, $q$2028-09-14$q$::date, $q$상$q$, $q$A-5-2$q$, $q$보관중$q$, '', $q$정성$q$, null::numeric, null::numeric, null::text),
  (120, $q$에틸 아세테이트$q$, $q$2025-03-03$q$::date, $q$2025-03-05$q$::date, $q$2027-02-10$q$::date, $q$중$q$, $q$A-5-3$q$, $q$보관중$q$, '', $q$정량$q$, 2.1::numeric, 4::numeric, $q$L$q$::text),
  (121, $q$노말헥세인$q$, $q$2025-05-19$q$::date, $q$2025-05-22$q$::date, $q$2027-05-19$q$::date, $q$하$q$, $q$A-6-1$q$, $q$보관중$q$, $q$잔량 적음$q$, $q$정량$q$, 45::numeric, 500::numeric, $q$mL$q$::text),
  (122, $q$사이클로헥세인$q$, $q$2025-10-02$q$::date, null::date, $q$2028-10-02$q$::date, $q$상$q$, $q$A-6-2$q$, $q$보관중$q$, $q$미개봉$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (123, $q$톨루엔$q$, $q$2024-12-11$q$::date, $q$2024-12-20$q$::date, $q$2026-12-11$q$::date, $q$중$q$, $q$A-6-3$q$, $q$보관중$q$, $q$유효기한 임박$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (124, $q$다이에틸 에테르$q$, $q$2025-07-07$q$::date, $q$2025-07-09$q$::date, $q$2026-12-28$q$::date, $q$하$q$, $q$A-7-1$q$, $q$보관중$q$, $q$과산화물 생성 주의$q$, $q$정량$q$, 80::numeric, 500::numeric, $q$mL$q$::text),
  (125, $q$클로로폼$q$, $q$2025-02-26$q$::date, $q$2025-03-01$q$::date, $q$2027-02-26$q$::date, $q$중$q$, $q$A-7-2$q$, $q$보관중$q$, $q$차광 보관$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (126, $q$글리세롤$q$, $q$2025-04-14$q$::date, $q$2025-04-16$q$::date, $q$2030-04-14$q$::date, $q$상$q$, $q$A-7-3$q$, $q$보관중$q$, '', $q$정량$q$, 430::numeric, 500::numeric, $q$mL$q$::text),
  (127, $q$요소$q$, $q$2025-08-05$q$::date, $q$2025-08-07$q$::date, $q$2029-08-05$q$::date, $q$상$q$, $q$A-8-1$q$, $q$보관중$q$, '', $q$정성$q$, null::numeric, null::numeric, null::text),
  (128, $q$포도당$q$, $q$2025-03-27$q$::date, $q$2025-04-01$q$::date, $q$2028-03-27$q$::date, $q$중$q$, $q$A-8-2$q$, $q$보관중$q$, $q$당 검출 실험$q$, $q$정량$q$, 260::numeric, 500::numeric, $q$g$q$::text),
  (129, $q$페놀프탈레인$q$, $q$2025-06-03$q$::date, $q$2025-06-05$q$::date, $q$2028-06-03$q$::date, $q$상$q$, $q$A-8-3$q$, $q$보관중$q$, $q$지시약 용액$q$, $q$정량$q$, 95::numeric, 100::numeric, $q$mL$q$::text),
  (130, $q$메틸 오렌지$q$, $q$2024-05-16$q$::date, $q$2024-05-20$q$::date, $q$2026-05-16$q$::date, $q$중$q$, $q$A-9-2$q$, $q$보관중$q$, $q$유효기한 지남$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (131, $q$브로모티몰 블루$q$, $q$2025-09-09$q$::date, $q$2025-09-10$q$::date, $q$2027-09-09$q$::date, $q$상$q$, $q$A-9-3$q$, $q$사용중$q$, $q$BTB 용액$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (132, $q$아연$q$, $q$2025-02-17$q$::date, $q$2025-02-20$q$::date, $q$2030-02-17$q$::date, $q$상$q$, $q$C-2-1$q$, $q$보관중$q$, $q$알갱이$q$, $q$정량$q$, 380::numeric, 500::numeric, $q$g$q$::text),
  (133, $q$구리$q$, $q$2025-03-11$q$::date, $q$2025-03-12$q$::date, $q$2030-03-11$q$::date, $q$중$q$, $q$C-2-2$q$, $q$보관중$q$, $q$구리판$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (134, $q$철$q$, $q$2025-05-05$q$::date, $q$2025-05-06$q$::date, $q$2030-05-05$q$::date, $q$상$q$, $q$C-2-3$q$, $q$보관중$q$, $q$철가루$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (135, $q$알루미늄$q$, $q$2025-06-18$q$::date, $q$2025-06-19$q$::date, $q$2030-06-18$q$::date, $q$하$q$, $q$C-3-1$q$, $q$보관중$q$, $q$알루미늄 포일 조각$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (136, $q$주석$q$, $q$2025-01-29$q$::date, null::date, $q$2030-01-29$q$::date, $q$상$q$, $q$C-3-2$q$, $q$보관중$q$, $q$미개봉$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (137, $q$칼슘$q$, $q$2025-04-09$q$::date, $q$2025-04-10$q$::date, $q$2027-04-09$q$::date, $q$하$q$, $q$C-3-3$q$, $q$보관중$q$, $q$물과 반응 주의$q$, $q$정량$q$, 12::numeric, 50::numeric, $q$g$q$::text),
  (138, $q$나트륨$q$, $q$2025-07-21$q$::date, $q$2025-07-22$q$::date, $q$2027-07-21$q$::date, $q$중$q$, $q$C-4-1$q$, $q$보관중$q$, $q$석유 속 보관 · 물 금지$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (139, $q$염화나트륨$q$, $q$2025-01-03$q$::date, $q$2025-01-05$q$::date, $q$2030-01-03$q$::date, $q$상$q$, $q$E-1-1$q$, $q$보관중$q$, '', $q$정량$q$, 0.82::numeric, 1::numeric, $q$kg$q$::text),
  (140, $q$염화칼슘$q$, $q$2025-02-21$q$::date, $q$2025-02-22$q$::date, $q$2029-02-21$q$::date, $q$중$q$, $q$E-1-2$q$, $q$보관중$q$, $q$흡습성$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (141, $q$질산은$q$, $q$2025-03-30$q$::date, $q$2025-04-02$q$::date, $q$2027-03-30$q$::date, $q$하$q$, $q$E-2-1$q$, $q$보관중$q$, $q$차광 · 피부 착색$q$, $q$정량$q$, 8::numeric, 25::numeric, $q$g$q$::text),
  (142, $q$질산칼륨$q$, $q$2025-05-28$q$::date, $q$2025-05-30$q$::date, $q$2029-05-28$q$::date, $q$상$q$, $q$E-2-2$q$, $q$보관중$q$, '', $q$정성$q$, null::numeric, null::numeric, null::text),
  (143, $q$황산구리(II)$q$, $q$2025-06-07$q$::date, $q$2025-06-09$q$::date, $q$2029-06-07$q$::date, $q$중$q$, $q$E-2-3$q$, $q$보관중$q$, $q$오수화물$q$, $q$정량$q$, 300::numeric, 500::numeric, $q$g$q$::text),
  (144, $q$황산마그네슘$q$, $q$2025-08-12$q$::date, null::date, $q$2030-08-12$q$::date, $q$상$q$, $q$E-3-1$q$, $q$보관중$q$, $q$미개봉$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (145, $q$염화철(III)$q$, $q$2024-02-02$q$::date, $q$2024-02-05$q$::date, $q$2026-02-02$q$::date, $q$중$q$, $q$E-3-2$q$, $q$보관중$q$, $q$유효기한 지남$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (146, $q$아이오딘화칼륨$q$, $q$2025-04-22$q$::date, $q$2025-04-25$q$::date, $q$2028-04-22$q$::date, $q$상$q$, $q$E-3-3$q$, $q$보관중$q$, '', $q$정성$q$, null::numeric, null::numeric, null::text),
  (147, $q$과망가니즈산칼륨$q$, $q$2025-07-15$q$::date, $q$2025-07-16$q$::date, $q$2028-07-15$q$::date, $q$중$q$, $q$E-4-1$q$, $q$보관중$q$, $q$산화제$q$, $q$정성$q$, null::numeric, null::numeric, null::text),
  (148, $q$과산화수소$q$, $q$2025-09-25$q$::date, $q$2025-10-01$q$::date, $q$2026-12-15$q$::date, $q$중$q$, $q$E-5-1$q$, $q$보관중$q$, $q$3% 용액 · 유효기한 임박$q$, $q$정량$q$, 250::numeric, 500::numeric, $q$mL$q$::text),
  (149, $q$아이오딘$q$, $q$2025-03-14$q$::date, $q$2025-03-16$q$::date, $q$2029-03-14$q$::date, $q$상$q$, $q$E-5-2$q$, $q$보관중$q$, '', $q$정성$q$, null::numeric, null::numeric, null::text)
) as v(id, reagent_name, purchased_on, opened_on, expires_on, amount, location, status, note,
       amount_mode, amount_value, capacity, unit)
join reagents r on r.name = v.reagent_name
on conflict (id) do nothing;

-- 다음에 새 재고를 추가할 때 번호가 겹치지 않도록 번호표를 맞춘다
select setval(pg_get_serial_sequence('inventory', 'id'), (select max(id) from inventory));

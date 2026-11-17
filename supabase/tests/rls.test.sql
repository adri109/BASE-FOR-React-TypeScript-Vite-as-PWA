-- Ejecutar con: pnpm db:test  (supabase test db). Requiere pgTAP (incluido en la imagen local).
begin;
select plan(24);

-- Fixtures (se ejecutan como superusuario y se revierten al final)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin-a@test.dev'),
  ('00000000-0000-0000-0000-0000000000a2', 'teacher-a@test.dev'),
  ('00000000-0000-0000-0000-0000000000a3', 'student-a1@test.dev'),
  ('00000000-0000-0000-0000-0000000000a4', 'student-a2@test.dev'),
  ('00000000-0000-0000-0000-0000000000b1', 'admin-b@test.dev'),
  ('00000000-0000-0000-0000-0000000000b2', 'student-b@test.dev'),
  ('00000000-0000-0000-0000-0000000000c1', 'newcomer@test.dev');

insert into public.academies (id, name, slug) values
  ('10000000-0000-0000-0000-00000000000a', 'Academy A', 'academy-a'),
  ('10000000-0000-0000-0000-00000000000b', 'Academy B', 'academy-b');

insert into public.memberships (academy_id, user_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a2', 'teacher'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a3', 'student'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', 'student'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', 'admin'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b2', 'student');

insert into public.classes (id, academy_id, teacher_id, name, join_code) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-0000000000a2', 'B2 mañana', 'CODEA001');

insert into public.class_members (class_id, user_id, academy_id) values
  ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a3',
   '10000000-0000-0000-0000-00000000000a');

insert into public.learner_events (id, user_id, academy_id, type, node_id, occurred_at) values
  ('30000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a3',
   '10000000-0000-0000-0000-00000000000a', 'review_done', 'b2-conditionals', now()),
  ('30000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000a4',
   '10000000-0000-0000-0000-00000000000a', 'review_done', 'b2-conditionals', now()),
  ('30000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2',
   '10000000-0000-0000-0000-00000000000b', 'review_done', 'b2-conditionals', now());

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$;

create function pg_temp.rows_affected(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Alumno A1
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3');
select is((select count(*)::int from public.profiles), 1, 'alumno: solo ve su propio perfil');
select is((select count(*)::int from public.academies), 1, 'alumno: solo ve su academia');
select is((select count(*)::int from public.memberships), 1, 'alumno: solo ve su propia membresía');
select is((select count(*)::int from public.learner_events), 1, 'alumno: solo ve sus eventos');
select throws_ok(
  $$ insert into public.learner_events (id, academy_id, type, node_id, occurred_at)
     values (gen_random_uuid(), '10000000-0000-0000-0000-00000000000b', 'review_done', 'x', now()) $$,
  '42501', null, 'alumno: no puede registrar eventos en otra academia');
select lives_ok(
  $$ insert into public.learner_events (id, academy_id, type, node_id, occurred_at)
     values (gen_random_uuid(), '10000000-0000-0000-0000-00000000000a', 'review_done', 'x', now()) $$,
  'alumno: registra eventos propios');
select throws_ok(
  $$ insert into public.memberships (academy_id, user_id, role)
     values ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a3', 'admin') $$,
  '42501', null, 'alumno: no puede crear membresías (escalada de rol)');
select is(pg_temp.rows_affected($$ update public.memberships set role = 'admin' $$),
  0, 'alumno: no puede modificar su rol');

-- Profesor A2 (solo ve alumnos de sus clases)
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a3'),
  1, 'profesor: ve el perfil de un alumno de su clase');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a4'),
  0, 'profesor: no ve alumnos fuera de sus clases');
select is((select count(*)::int from public.learner_events where user_id = '00000000-0000-0000-0000-0000000000a3'),
  2, 'profesor: ve eventos de alumnos de su clase');
select is((select count(*)::int from public.learner_events where user_id <> '00000000-0000-0000-0000-0000000000a3'),
  0, 'profesor: no ve eventos de otros alumnos ni de otras academias');

-- Admin A1
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is((select count(*)::int from public.memberships), 4, 'admin: ve las 4 membresías de su academia');
select is((select count(*)::int from public.learner_events), 3, 'admin: ve los eventos de su academia, no los de B');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'),
  0, 'admin: no ve perfiles de otra academia');
select lives_ok(
  $$ update public.academies set name = 'Academy A2' where id = '10000000-0000-0000-0000-00000000000a' $$,
  'admin: puede renombrar su academia');
select throws_ok(
  $$ insert into public.academies (name, slug) values ('Nueva', 'nueva') $$,
  '42501', null, 'admin: no puede crear academias desde el cliente');

-- Admin B1 (otra academia)
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select is((select count(*)::int from public.classes), 0, 'admin B: no ve clases de A');
select throws_ok(
  $$ insert into public.memberships (academy_id, user_id, role)
     values ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000b1', 'admin') $$,
  '42501', null, 'admin B: no puede añadirse a la academia A');
select is(
  pg_temp.rows_affected($$ update public.academies set name = 'hack' where id = '10000000-0000-0000-0000-00000000000a' $$),
  0, 'admin B: no puede modificar la academia A');

-- Alta por código de clase
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select is((select count(*)::int from public.academies), 0, 'nuevo usuario: sin acceso antes de unirse');
select is(public.join_class('codea001'), '20000000-0000-0000-0000-00000000000a'::uuid,
  'join_class: acepta el código sin distinguir mayúsculas');
select is((select count(*)::int from public.academies), 1, 'nuevo usuario: ve su academia tras unirse');

-- Anónimo
reset role;
set local role anon;
select throws_ok($$ select * from public.academies $$, '42501', null, 'anon: sin acceso a tablas');

select * from finish();
rollback;

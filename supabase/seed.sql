-- Datos de desarrollo. Se ejecuta en `supabase db reset`. No contiene usuarios:
-- crea cuentas desde Studio (http://127.0.0.1:54323) o con magic link (Inbucket en :54324).
insert into public.academies (id, name, slug)
values ('00000000-0000-0000-0000-00000000a001', 'Academia Demo', 'academia-demo')
on conflict do nothing;

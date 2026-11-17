-- RLS: aislamiento entre academias. Las funciones auxiliares son SECURITY DEFINER para evitar
-- recursión entre políticas y viven en el esquema `private`, que la API REST no expone.

create schema private;
grant usage on schema private to authenticated;

create function private.is_member(p_academy uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.academy_id = p_academy and m.user_id = auth.uid()
  );
$$;

create function private.is_staff(p_academy uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.academy_id = p_academy and m.user_id = auth.uid() and m.role in ('teacher', 'admin')
  );
$$;

create function private.is_admin(p_academy uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.academy_id = p_academy and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

create function private.teaches_class(p_class uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.classes c where c.id = p_class and c.teacher_id = auth.uid()
  );
$$;

create function private.is_class_member(p_class uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.class_members cm where cm.class_id = p_class and cm.user_id = auth.uid()
  );
$$;

-- El admin ve a todos los miembros de su academia; el profesor, solo a los alumnos de sus clases.
create function private.staff_can_see_learner(p_academy uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    (private.is_admin(p_academy) and exists (
      select 1 from public.memberships m where m.academy_id = p_academy and m.user_id = p_user
    ))
    or exists (
      select 1
      from public.classes c
      join public.class_members cm on cm.class_id = c.id
      where c.academy_id = p_academy and c.teacher_id = auth.uid() and cm.user_id = p_user
    );
$$;

create function private.can_view_profile(p_user uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_user = auth.uid() or exists (
    select 1 from public.memberships m
    where m.user_id = p_user and private.staff_can_see_learner(m.academy_id, p_user)
  );
$$;

revoke all on function
  private.is_member(uuid), private.is_staff(uuid), private.is_admin(uuid),
  private.teaches_class(uuid), private.is_class_member(uuid),
  private.staff_can_see_learner(uuid, uuid), private.can_view_profile(uuid)
from public;
grant execute on function
  private.is_member(uuid), private.is_staff(uuid), private.is_admin(uuid),
  private.teaches_class(uuid), private.is_class_member(uuid),
  private.staff_can_see_learner(uuid, uuid), private.can_view_profile(uuid)
to authenticated;

alter table public.profiles enable row level security;
alter table public.academies enable row level security;
alter table public.memberships enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.learner_events enable row level security;

-- Privilegios mínimos: anon no accede a nada; authenticated solo a lo que las políticas permiten.
revoke all on public.profiles, public.academies, public.memberships, public.classes,
  public.class_members, public.learner_events from anon, authenticated;
grant select on public.profiles, public.academies, public.memberships, public.classes,
  public.class_members, public.learner_events to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant update (name) on public.academies to authenticated;
grant insert, update, delete on public.memberships, public.classes, public.class_members
  to authenticated;
grant insert on public.learner_events to authenticated;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (private.can_view_profile(id));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- academies: el alta es manual (service role); no hay política de insert/delete.
create policy academies_select on public.academies for select to authenticated
  using (private.is_member(id));
create policy academies_update on public.academies for update to authenticated
  using (private.is_admin(id)) with check (private.is_admin(id));

-- memberships
create policy memberships_select on public.memberships for select to authenticated
  using (
    user_id = auth.uid()
    or private.is_admin(academy_id)
    or private.staff_can_see_learner(academy_id, user_id)
  );
create policy memberships_insert on public.memberships for insert to authenticated
  with check (private.is_admin(academy_id));
create policy memberships_update on public.memberships for update to authenticated
  using (private.is_admin(academy_id)) with check (private.is_admin(academy_id));
create policy memberships_delete on public.memberships for delete to authenticated
  using (private.is_admin(academy_id));

-- classes
create policy classes_select on public.classes for select to authenticated
  using (
    private.is_admin(academy_id)
    or teacher_id = auth.uid()
    or private.is_class_member(id)
  );
create policy classes_insert on public.classes for insert to authenticated
  with check (
    private.is_admin(academy_id)
    or (teacher_id = auth.uid() and private.is_staff(academy_id))
  );
create policy classes_update on public.classes for update to authenticated
  using (private.is_admin(academy_id) or teacher_id = auth.uid())
  with check (
    private.is_admin(academy_id)
    or (teacher_id = auth.uid() and private.is_staff(academy_id))
  );
create policy classes_delete on public.classes for delete to authenticated
  using (private.is_admin(academy_id) or teacher_id = auth.uid());

-- class_members
create policy class_members_select on public.class_members for select to authenticated
  using (user_id = auth.uid() or private.is_admin(academy_id) or private.teaches_class(class_id));
create policy class_members_insert on public.class_members for insert to authenticated
  with check (private.is_admin(academy_id) or private.teaches_class(class_id));
create policy class_members_delete on public.class_members for delete to authenticated
  using (user_id = auth.uid() or private.is_admin(academy_id) or private.teaches_class(class_id));

-- learner_events: append-only (sin política de update/delete)
create policy learner_events_select on public.learner_events for select to authenticated
  using (
    user_id = auth.uid()
    or (academy_id is not null and private.staff_can_see_learner(academy_id, user_id))
  );
create policy learner_events_insert on public.learner_events for insert to authenticated
  with check (
    user_id = auth.uid()
    and (academy_id is null or private.is_member(academy_id))
  );

-- Alta de alumno en una clase mediante código. Crea la membresía 'student' si no existe.
create function public.join_class(p_code text) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class public.classes;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_class from public.classes where join_code = upper(trim(p_code));
  if not found then
    raise exception 'invalid join code' using errcode = 'P0002';
  end if;

  insert into public.memberships (academy_id, user_id, role)
  values (v_class.academy_id, auth.uid(), 'student')
  on conflict (academy_id, user_id) do nothing;

  insert into public.class_members (class_id, user_id, academy_id)
  values (v_class.id, auth.uid(), v_class.academy_id)
  on conflict do nothing;

  return v_class.id;
end;
$$;

revoke all on function public.join_class(text) from public, anon;
grant execute on function public.join_class(text) to authenticated;

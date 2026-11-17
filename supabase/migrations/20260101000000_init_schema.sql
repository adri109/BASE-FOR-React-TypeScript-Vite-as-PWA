-- Esquema base multi-tenant: academias, membresías, clases y registro de eventos de aprendizaje.
-- Convenciones: todas las tablas de datos de alumnos llevan academy_id (salvo perfiles y
-- eventos de alumnos B2C, donde academy_id es NULL). RLS se define en la migración siguiente.

create type public.academy_role as enum ('student', 'teacher', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.academy_role not null default 'student',
  created_at timestamptz not null default now(),
  unique (academy_id, user_id)
);
create index memberships_user_id_idx on public.memberships (user_id);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  teacher_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  join_code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now(),
  unique (id, academy_id)
);
create index classes_academy_id_idx on public.classes (academy_id);
create index classes_teacher_id_idx on public.classes (teacher_id);

create table public.class_members (
  class_id uuid not null,
  user_id uuid not null,
  academy_id uuid not null,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id),
  foreign key (class_id, academy_id) references public.classes (id, academy_id) on delete cascade,
  foreign key (academy_id, user_id) references public.memberships (academy_id, user_id) on delete cascade
);
create index class_members_user_id_idx on public.class_members (user_id);
create index class_members_academy_id_idx on public.class_members (academy_id);

-- Registro inmutable de eventos del cliente. El id lo genera el cliente (UUID) para que
-- el reenvío tras una desconexión sea idempotente (INSERT ... ON CONFLICT DO NOTHING).
create table public.learner_events (
  id uuid primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  academy_id uuid references public.academies (id) on delete set null,
  type text not null check (type in ('exercise_answered', 'review_done', 'node_mastered')),
  node_id text not null check (char_length(node_id) between 1 and 120),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index learner_events_user_time_idx on public.learner_events (user_id, occurred_at desc);
create index learner_events_academy_id_idx on public.learner_events (academy_id);

create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'user'), 80)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

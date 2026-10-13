-- 0001_schema.sql — schema, RLS and derived views for app-mayara.
-- Run once in the Supabase SQL Editor (as the project owner).
-- "Local today" = (now() at time zone 'America/Sao_Paulo')::date.

begin;

-- ===========================================================================
-- Membership & helpers
-- ===========================================================================

create table public.members (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('user', 'admin')),
  display_name text not null,
  created_at   timestamptz not null default now()
);

create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.members m where m.user_id = auth.uid());
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m where m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

revoke execute on function public.is_member() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_member() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ===========================================================================
-- Plan tables (content managed by admin)
-- ===========================================================================

create table public.plan_cycles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  starts_on   date not null,
  ends_on     date not null,
  kcal_target int not null check (kcal_target > 0),
  protein_g   int not null check (protein_g >= 0),
  carbs_g     int not null check (carbs_g >= 0),
  fat_g       int not null check (fat_g >= 0),
  is_active   boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now(),
  check (ends_on > starts_on)
);
-- At most one active cycle.
create unique index plan_cycles_one_active on public.plan_cycles (is_active) where is_active;

create table public.cycle_weeks (
  id              uuid primary key default gen_random_uuid(),
  cycle_id        uuid not null references public.plan_cycles (id) on delete cascade,
  week_no         smallint not null check (week_no between 1 and 8),
  starts_on       date not null,
  ends_on         date not null,
  cardio_minutes  int not null check (cardio_minutes >= 0),
  cardio_sessions smallint not null check (cardio_sessions >= 0),
  rpe_min         smallint not null check (rpe_min between 1 and 10),
  rpe_max         smallint not null check (rpe_max between 1 and 10),
  water_ml_target int not null check (water_ml_target between 500 and 5000),
  created_at      timestamptz not null default now(),
  check (rpe_max >= rpe_min),
  check (ends_on >= starts_on),
  unique (cycle_id, week_no)
);

create table public.meals (
  id         uuid primary key default gen_random_uuid(),
  cycle_id   uuid not null references public.plan_cycles (id) on delete cascade,
  sort       smallint not null,
  name       text not null,
  time_hint  time,
  note       text,
  created_at timestamptz not null default now(),
  unique (cycle_id, sort)
);

create table public.meal_options (
  id           uuid primary key default gen_random_uuid(),
  meal_id      uuid not null references public.meals (id) on delete cascade,
  sort         smallint not null,
  label        text not null,
  kcal         int check (kcal >= 0),
  protein_g    numeric(5, 1) check (protein_g >= 0),
  carbs_g      numeric(5, 1) check (carbs_g >= 0),
  fat_g        numeric(5, 1) check (fat_g >= 0),
  max_per_week smallint check (max_per_week between 1 and 7),
  note         text,
  created_at   timestamptz not null default now(),
  unique (meal_id, sort)
);

create table public.meal_option_items (
  id         uuid primary key default gen_random_uuid(),
  option_id  uuid not null references public.meal_options (id) on delete cascade,
  sort       smallint not null,
  food       text not null,
  quantity   text,
  created_at timestamptz not null default now()
);
create index meal_option_items_option_id_idx on public.meal_option_items (option_id, sort);

create table public.swap_groups (
  id           uuid primary key default gen_random_uuid(),
  cycle_id     uuid not null references public.plan_cycles (id) on delete cascade,
  sort         smallint not null,
  name         text not null,
  base_portion text not null,
  created_at   timestamptz not null default now()
);
create index swap_groups_cycle_id_idx on public.swap_groups (cycle_id, sort);

create table public.swap_items (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.swap_groups (id) on delete cascade,
  sort       smallint not null,
  food       text not null,
  portion    text not null,
  created_at timestamptz not null default now()
);
create index swap_items_group_id_idx on public.swap_items (group_id, sort);

create table public.rules (
  id         uuid primary key default gen_random_uuid(),
  cycle_id   uuid not null references public.plan_cycles (id) on delete cascade,
  category   text not null check (category in ('dieta', 'treino')),
  sort       smallint not null,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index rules_cycle_id_idx on public.rules (cycle_id, category, sort);

create table public.exercises (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name_pt         text not null,
  instructions_pt text[],
  caution_pt      text,
  source_ref      text,
  image_paths     text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create table public.workouts (
  id         uuid primary key default gen_random_uuid(),
  cycle_id   uuid not null references public.plan_cycles (id) on delete cascade,
  code       text not null check (code ~ '^[A-Z]$'),
  sort       smallint not null,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (cycle_id, code)
);

create table public.workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort        smallint not null,
  sets        smallint not null check (sets between 1 and 10),
  reps_min    smallint not null check (reps_min >= 1),
  reps_max    smallint not null,
  reps_unit   text not null check (reps_unit in ('reps', 's', 'passos')),
  per_side    boolean not null default false,
  rest_s      smallint not null check (rest_s between 0 and 300),
  note        text,
  created_at  timestamptz not null default now(),
  check (reps_max >= reps_min),
  unique (workout_id, sort)
);
create index workout_exercises_exercise_id_idx on public.workout_exercises (exercise_id);

-- ===========================================================================
-- Log tables (owned by the user)
-- ===========================================================================

create table public.meal_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date   date not null default (now() at time zone 'America/Sao_Paulo')::date,
  meal_id    uuid not null references public.meals (id) on delete restrict,
  option_id  uuid references public.meal_options (id) on delete restrict,
  followed   boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, log_date, meal_id)
);
create index meal_logs_meal_id_idx on public.meal_logs (meal_id);
create index meal_logs_option_id_idx on public.meal_logs (option_id);
-- (user_id, log_date) is covered by the unique constraint above.

create table public.water_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date   date not null default (now() at time zone 'America/Sao_Paulo')::date,
  ml         int not null check (ml between 0 and 6000),
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_id   uuid not null references public.workouts (id) on delete restrict,
  performed_on date not null default (now() at time zone 'America/Sao_Paulo')::date,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  notes        text,
  created_at   timestamptz not null default now(),
  check (finished_at is null or finished_at >= started_at)
);
create index workout_sessions_user_date_idx on public.workout_sessions (user_id, performed_on);
create index workout_sessions_workout_id_idx on public.workout_sessions (workout_id);
create index workout_sessions_user_finished_idx
  on public.workout_sessions (user_id, finished_at desc) where finished_at is not null;

create table public.set_logs (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.workout_sessions (id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete restrict,
  set_no              smallint not null check (set_no between 1 and 10),
  load_kg             numeric(5, 2) not null check (load_kg between 0 and 500),
  reps                smallint not null check (reps between 0 and 100),
  created_at          timestamptz not null default now(),
  unique (session_id, workout_exercise_id, set_no)
);
create index set_logs_workout_exercise_id_idx on public.set_logs (workout_exercise_id);

create table public.cardio_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  performed_on date not null default (now() at time zone 'America/Sao_Paulo')::date,
  minutes      smallint not null check (minutes between 1 and 180),
  rpe          smallint not null check (rpe between 1 and 10),
  modality     text not null default 'escada',
  created_at   timestamptz not null default now()
);
create index cardio_logs_user_date_idx on public.cardio_logs (user_id, performed_on);

create table public.body_measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null default (now() at time zone 'America/Sao_Paulo')::date,
  weight_kg   numeric(4, 1) check (weight_kg between 30 and 150),
  waist_cm    numeric(4, 1) check (waist_cm between 40 and 150),
  created_at  timestamptz not null default now(),
  check (weight_kg is not null or waist_cm is not null),
  unique (user_id, measured_on)
);

-- ===========================================================================
-- Privileges + RLS
-- ===========================================================================
-- Supabase's default privileges grant everything to anon/authenticated on new
-- objects; reset them and grant only what each role needs. RLS then decides rows.

do $$
declare
  t text;
  plan_tables text[] := array[
    'plan_cycles', 'cycle_weeks', 'meals', 'meal_options', 'meal_option_items',
    'swap_groups', 'swap_items', 'rules', 'exercises', 'workouts', 'workout_exercises'
  ];
  log_tables text[] := array[
    'meal_logs', 'water_logs', 'workout_sessions', 'cardio_logs', 'body_measurements'
  ];
begin
  -- Plan tables: members read; admin writes. Write grants exist so the admin
  -- policies can take effect; RLS blocks writes for non-admins.
  foreach t in array plan_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_member())',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || '_delete', t);
  end loop;

  -- Log tables: owner reads/writes own rows; admin may read.
  foreach t in array log_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((user_id = (select auth.uid()) and public.is_member()) or public.is_admin())',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()) and public.is_member())',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid()) and public.is_member()) with check (user_id = (select auth.uid()) and public.is_member())',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()) and public.is_member())',
      t || '_delete', t);
  end loop;
end
$$;

-- members: read own row (admin reads all). No write policies: managed in the SQL Editor only.
alter table public.members enable row level security;
revoke all on public.members from anon, authenticated;
grant select on public.members to authenticated;
create policy members_select on public.members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- set_logs: ownership via the parent session.
alter table public.set_logs enable row level security;
revoke all on public.set_logs from anon, authenticated;
grant select, insert, update, delete on public.set_logs to authenticated;
create policy set_logs_select on public.set_logs
  for select to authenticated
  using (
    (public.is_member() and exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    ))
    or public.is_admin()
  );
create policy set_logs_insert on public.set_logs
  for insert to authenticated
  with check (
    public.is_member() and exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );
create policy set_logs_update on public.set_logs
  for update to authenticated
  using (
    public.is_member() and exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    public.is_member() and exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );
create policy set_logs_delete on public.set_logs
  for delete to authenticated
  using (
    public.is_member() and exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

-- ===========================================================================
-- Derived views (security_invoker: the caller's RLS applies)
-- ===========================================================================

create view public.v_active_cycle
with (security_invoker = true) as
select c.*
from public.plan_cycles c
where c.is_active;

-- Zero rows when local today is outside every week of the active cycle.
create view public.v_current_week
with (security_invoker = true) as
select w.*
from public.cycle_weeks w
join public.plan_cycles c on c.id = w.cycle_id and c.is_active
where (now() at time zone 'America/Sao_Paulo')::date between w.starts_on and w.ends_on;

-- Next workout for the caller: the one after (by sort, wrapping D→A) the
-- workout of the most recent finished session within the active cycle;
-- with no finished session, the lowest sort.
create view public.v_next_workout
with (security_invoker = true) as
with active_workouts as (
  select w.*
  from public.workouts w
  join public.plan_cycles c on c.id = w.cycle_id and c.is_active
),
last_done as (
  select aw.sort
  from public.workout_sessions s
  join active_workouts aw on aw.id = s.workout_id
  where s.user_id = auth.uid() and s.finished_at is not null
  order by s.finished_at desc
  limit 1
)
select aw.*
from active_workouts aw
order by
  case when aw.sort > (select sort from last_done) then 0 else 1 end,
  aw.sort
limit 1;

create view public.v_weekly_weight
with (security_invoker = true) as
select
  m.user_id,
  date_trunc('week', m.measured_on)::date as week_start,
  round(avg(m.weight_kg), 2) as avg_weight_kg,
  round(avg(m.waist_cm), 2)  as avg_waist_cm,
  count(*)                   as entries
from public.body_measurements m
group by m.user_id, date_trunc('week', m.measured_on);

revoke all on public.v_active_cycle, public.v_current_week,
  public.v_next_workout, public.v_weekly_weight from anon, authenticated;
grant select on public.v_active_cycle, public.v_current_week,
  public.v_next_workout, public.v_weekly_weight to authenticated;

commit;

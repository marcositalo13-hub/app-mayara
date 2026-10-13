-- 0003_workout_logging.sql — support for logging workouts.
-- Run after seed/0002_exercise_media.sql, in the Supabase SQL Editor (once).

begin;

-- At most one open (unfinished) session per user.
create unique index one_open_session_per_user
  on public.workout_sessions (user_id)
  where finished_at is null;

-- Load step used by the "next load" suggestion. 0 = bodyweight/time (load optional).
alter table public.exercises
  add column increment_kg numeric(3, 1) not null default 0
  check (increment_kg between 0 and 10);

do $$
declare
  r record;
  n int;
begin
  for r in
    select * from (values
      ('hip-thrust', 2.0),
      ('stiff-halteres', 1.0),
      ('agachamento-bulgaro', 1.0),
      ('mesa-flexora', 2.5),
      ('abducao-maquina', 2.5),
      ('puxada-frontal', 2.5),
      ('remada-baixa', 2.5),
      ('supino-halteres', 1.0),
      ('desenvolvimento-halteres', 1.0),
      ('elevacao-lateral', 1.0),
      ('rosca-direta', 1.0),
      ('triceps-polia', 2.5),
      ('leg-press-45', 5.0),
      ('agachamento-goblet', 2.0),
      ('passada', 1.0),
      ('cadeira-extensora', 2.5),
      ('gluteo-cabo', 2.5),
      ('panturrilha-em-pe', 2.5),
      ('agachamento-sumo', 2.0),
      ('step-up', 1.0),
      ('remada-unilateral', 1.0)
    ) as v(slug, inc)
  loop
    update public.exercises set increment_kg = r.inc where slug = r.slug;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'Exercício % não encontrado.', r.slug;
    end if;
  end loop;
end
$$;

commit;

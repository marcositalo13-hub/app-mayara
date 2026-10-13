-- 0003_verify.sql — read-only checks after migrations/0003_workout_logging.sql.

-- Expected: 21
select count(*) as exercises_with_increment
from public.exercises
where increment_kg > 0;

-- Expected: one row, one_open_session_per_user
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and indexname = 'one_open_session_per_user';

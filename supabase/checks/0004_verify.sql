-- 0004_verify.sql — read-only check after migrations/0004_exercise_purpose.sql.
-- Expected: 27
select count(*) filter (where purpose_pt is not null) as exercises_with_purpose
from public.exercises;

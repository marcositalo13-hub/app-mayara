-- 0001_verify.sql — read-only checks after schema + seed. Run each query in the SQL Editor.

-- (a) Row counts per table
select 'members' as table_name, count(*) as rows from public.members
union all select 'plan_cycles',       count(*) from public.plan_cycles
union all select 'cycle_weeks',       count(*) from public.cycle_weeks
union all select 'meals',             count(*) from public.meals
union all select 'meal_options',      count(*) from public.meal_options
union all select 'meal_option_items', count(*) from public.meal_option_items
union all select 'swap_groups',       count(*) from public.swap_groups
union all select 'swap_items',        count(*) from public.swap_items
union all select 'rules',             count(*) from public.rules
union all select 'exercises',         count(*) from public.exercises
union all select 'workouts',          count(*) from public.workouts
union all select 'workout_exercises', count(*) from public.workout_exercises
union all select 'meal_logs',         count(*) from public.meal_logs
union all select 'water_logs',        count(*) from public.water_logs
union all select 'workout_sessions',  count(*) from public.workout_sessions
union all select 'set_logs',          count(*) from public.set_logs
union all select 'cardio_logs',       count(*) from public.cardio_logs
union all select 'body_measurements', count(*) from public.body_measurements;

-- (b) Every public table with its RLS flag (and how many policies it has)
select t.tablename,
       t.rowsecurity,
       (select count(*) from pg_policies p
        where p.schemaname = 'public' and p.tablename = t.tablename) as policies
from pg_tables t
where t.schemaname = 'public'
order by t.tablename;

-- (c) Daily kcal when picking option 1 of each of the 5 meals of "Ciclo 1"
select sum(o.kcal) as kcal_option_1
from public.meal_options o
join public.meals m on m.id = o.meal_id
join public.plan_cycles c on c.id = m.cycle_id
where c.name = 'Ciclo 1' and o.sort = 1;

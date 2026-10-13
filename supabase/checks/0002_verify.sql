-- 0002_verify.sql — read-only check after seed/0002_exercise_media.sql.
select slug,
       name_pt,
       cardinality(image_paths)     as images,
       cardinality(instructions_pt) as steps,
       caution_pt is not null       as has_caution
from public.exercises
order by slug;

-- 0005_verify.sql — read-only checks after migrations/0005_avatars.sql.

-- Expected: one row, public = false, file_size_limit = 1048576
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'avatars';

-- Expected: 4 (select, insert, update, delete)
select count(*) as avatar_policies
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (qual like '%avatars%' or with_check like '%avatars%');

-- Expected: one row (avatar_path, text, YES)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'members' and column_name = 'avatar_path';

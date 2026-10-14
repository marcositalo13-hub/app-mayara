-- 0005_avatars.sql — private profile avatar (Storage bucket + members.avatar_path).
-- Run after migrations/0004_exercise_purpose.sql, in the Supabase SQL Editor (once).
-- Objects live at avatars/<user_id>/<timestamp>.webp|jpg; the bucket is private (signed URLs only).

begin;

-- ---------------------------------------------------------------------------
-- members.avatar_path: the only column a member may update, and only on their own row.
-- ---------------------------------------------------------------------------
alter table public.members add column avatar_path text null;

-- The stored path must live in the member's own folder.
alter table public.members
  add constraint members_avatar_path_own_folder
  check (avatar_path is null or avatar_path like user_id::text || '/%');

grant update (avatar_path) on public.members to authenticated;

create policy members_update_own_avatar on public.members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage bucket: private, 1 MB, webp/jpeg only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- Read: own folder (or admin). Write: own folder, members only.
create policy avatars_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_member()
  );

create policy avatars_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_member()
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_member()
  );

create policy avatars_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_member()
  );

commit;

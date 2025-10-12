-- Create public avatars bucket (id = 'avatars') if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Add avatar_url column to profiles to store image path
alter table public.profiles
  add column if not exists avatar_url text;

-- Create policies conditionally
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read avatars'
  ) then
    create policy "Public read avatars"
      on storage.objects
      for select
      to public
      using (bucket_id = 'avatars');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can upload avatars'
  ) then
    create policy "Users can upload avatars"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can update avatars'
  ) then
    create policy "Users can update avatars"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete avatars'
  ) then
    create policy "Users can delete avatars"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
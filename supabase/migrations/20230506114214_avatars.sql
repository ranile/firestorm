create policy "Enable owner access for avatars"
on "storage"."objects"
as permissive
for all
to authenticated
using (((bucket_id = 'avatars'::text) AND (owner = auth.uid())))
with check (((bucket_id = 'avatars'::text) AND (owner = auth.uid())));


create policy "Enable public read access for avatars bucket"
on "storage"."objects"
as permissive
for select
to authenticated
using ((bucket_id = 'avatars'::text));


create policy "Give access to a file to user 1oj01fe_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = name)));


create policy "Give access to a file to user 1oj01fe_1"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = name)));


create policy "Give access to a file to user 1oj01fe_2"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = name)));


create policy "Give access to a file to user 1oj01fe_3"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = name)));




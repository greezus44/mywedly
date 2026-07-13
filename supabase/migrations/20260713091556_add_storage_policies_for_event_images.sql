/*
# Storage policies for event-images bucket

Allow authenticated users to upload/update/delete, and anyone to read (public bucket).
*/

DROP POLICY IF EXISTS "allow_public_read_event_images" ON storage.objects;
CREATE POLICY "allow_public_read_event_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "allow_auth_upload_event_images" ON storage.objects;
CREATE POLICY "allow_auth_upload_event_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'event-images');

DROP POLICY IF EXISTS "allow_auth_update_event_images" ON storage.objects;
CREATE POLICY "allow_auth_update_event_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'event-images') WITH CHECK (bucket_id = 'event-images');

DROP POLICY IF EXISTS "allow_auth_delete_event_images" ON storage.objects;
CREATE POLICY "allow_auth_delete_event_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'event-images');

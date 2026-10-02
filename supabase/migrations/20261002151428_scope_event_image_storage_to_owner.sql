-- F9/F16: uploads are confined to the uploader's own folder, and the bucket
-- only accepts reasonably sized image files.
DROP POLICY IF EXISTS allow_auth_upload_event_images ON storage.objects;
DROP POLICY IF EXISTS allow_auth_update_event_images ON storage.objects;
DROP POLICY IF EXISTS allow_auth_delete_event_images ON storage.objects;

CREATE POLICY allow_auth_upload_event_images ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY allow_auth_update_event_images ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY allow_auth_delete_event_images ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
WHERE id = 'event-images';

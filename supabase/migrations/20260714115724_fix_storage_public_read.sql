/*
# Fix Storage: Add public read policy for event-images bucket

1. Storage Policies
   - Add SELECT policy on storage.objects for the `event-images` bucket allowing public (anon) read access.
   - This allows published guest websites to display uploaded images (logos, cover images, gallery images, etc.) without requiring authentication.
   - Existing authenticated upload/update/delete policies remain unchanged.

2. Notes
   - The `event-images` bucket already exists and is public.
   - Authenticated hosts can upload, update, and delete files.
   - Public (anon) users can read files from the `event-images` bucket.
*/

-- Public read access for event-images bucket
DROP POLICY IF EXISTS "allow_public_read_event_images" ON storage.objects;
CREATE POLICY "allow_public_read_event_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'event-images');

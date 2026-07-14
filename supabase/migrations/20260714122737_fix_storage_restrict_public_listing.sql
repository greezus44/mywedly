/*
# Fix Storage: Restrict public listing on event-images bucket

## Problem
The `event-images` bucket has a SELECT policy (`allow_public_read_event_images`)
scoped to `anon, authenticated`, which allows any unauthenticated client to list
all files in the bucket via the Supabase Storage API. Public buckets do not need
a SELECT policy for individual object URL access — the public bucket setting
already serves objects at their public URL without a policy.

## Fix
1. Drop the broad `allow_public_read_event_images` SELECT policy.
2. Replace it with a SELECT policy scoped to `authenticated` only, so authenticated
   hosts can still list/query their own files via the Storage API, but anonymous
   users cannot enumerate the bucket contents.
3. Individual object access via public URLs continues to work because the bucket
   is marked `public = true` — that path does not depend on a SELECT policy.

## Security Impact
- Anonymous users can no longer list all files in the `event-images` bucket.
- Anonymous users can still load individual images by their public URL (e.g.
  `https://<project>.supabase.co/storage/v1/object/public/event-images/...`),
  which is the only access pattern the published guest website needs.
- Authenticated hosts retain full read access for managing their uploads.
*/

-- Remove the broad public SELECT policy that allowed listing
DROP POLICY IF EXISTS "allow_public_read_event_images" ON storage.objects;

-- Replace with authenticated-only SELECT so hosts can still query/list their files
DROP POLICY IF EXISTS "allow_auth_read_event_images" ON storage.objects;
CREATE POLICY "allow_auth_read_event_images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-images');

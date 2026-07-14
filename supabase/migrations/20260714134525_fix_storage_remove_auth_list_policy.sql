/*
# Fix Storage: Remove broad SELECT policy on event-images bucket

## Problem
The `event-images` bucket has a SELECT policy (`allow_auth_read_event_images`)
scoped to `authenticated`, which allows any authenticated client to list all
files in the bucket via the Supabase Storage API. Public buckets do not need
a SELECT policy for individual object URL access — the public bucket setting
already serves objects at their public URL without a policy.

## Fix
Drop the `allow_auth_read_event_images` SELECT policy. Individual object access
via public URLs continues to work because the bucket is marked `public = true`.
*/

DROP POLICY IF EXISTS "allow_auth_read_event_images" ON storage.objects;

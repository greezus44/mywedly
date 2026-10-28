-- F13: the wedding-assets object policies passed the membership arguments in the
-- wrong order (is_wedding_member(auth.uid(), <wedding id>)), so the check never
-- evaluated what it claimed to. Correct the order and give the UPDATE policy an
-- explicit WITH CHECK so an object cannot be renamed into another wedding's folder.
DROP POLICY IF EXISTS "wedding assets member write" ON storage.objects;
DROP POLICY IF EXISTS "wedding assets member update" ON storage.objects;
DROP POLICY IF EXISTS "wedding assets member delete" ON storage.objects;

CREATE POLICY "wedding assets member write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'wedding-assets'
    AND private.is_wedding_member((split_part(name, '/', 1))::uuid, auth.uid())
  );

CREATE POLICY "wedding assets member update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'wedding-assets'
    AND private.is_wedding_member((split_part(name, '/', 1))::uuid, auth.uid())
  )
  WITH CHECK (
    bucket_id = 'wedding-assets'
    AND private.is_wedding_member((split_part(name, '/', 1))::uuid, auth.uid())
  );

CREATE POLICY "wedding assets member delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'wedding-assets'
    AND private.is_wedding_member((split_part(name, '/', 1))::uuid, auth.uid())
  );
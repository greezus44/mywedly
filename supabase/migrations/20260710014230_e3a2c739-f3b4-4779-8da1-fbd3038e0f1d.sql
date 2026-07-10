GRANT USAGE ON SCHEMA private TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.is_wedding_member(uuid, uuid) TO authenticated, anon;
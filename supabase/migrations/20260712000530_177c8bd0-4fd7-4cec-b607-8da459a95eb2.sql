
ALTER TABLE public.weddings
  ALTER COLUMN theme DROP DEFAULT,
  ALTER COLUMN theme TYPE jsonb USING (
    CASE
      WHEN theme IS NULL OR trim(theme) = '' THEN '{}'::jsonb
      WHEN left(trim(theme), 1) IN ('{','[') THEN theme::jsonb
      ELSE jsonb_build_object('name', theme)
    END
  ),
  ALTER COLUMN theme SET DEFAULT '{}'::jsonb;

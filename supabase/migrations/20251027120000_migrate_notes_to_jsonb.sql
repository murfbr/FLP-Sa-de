-- Add temporary column for JSONB notes
ALTER TABLE public.appointments ADD COLUMN notes_json JSONB DEFAULT '[]'::jsonb;

-- Migrate existing string notes to JSONB format
-- We join with professionals to get the name, or default to 'Sistema' if not found
UPDATE public.appointments a
SET notes_json = (
  CASE
    WHEN a.notes IS NULL OR a.notes = '' THEN '[]'::jsonb
    ELSE jsonb_build_array(
      jsonb_build_object(
        'date', a.created_at,
        'professional_name', COALESCE(p.name, 'Sistema'),
        'content', a.notes
      )
    )
  END
)
FROM public.professionals p
WHERE a.professional_id = p.id;

-- Handle any rows that might have been missed by the join (e.g. if professional was deleted)
UPDATE public.appointments
SET notes_json = jsonb_build_array(
    jsonb_build_object(
        'date', created_at,
        'professional_name', 'Sistema',
        'content', notes
    )
)
WHERE (notes IS NOT NULL AND notes <> '') AND (notes_json IS NULL OR notes_json = '[]'::jsonb);

-- Drop the old text column and rename the new one
ALTER TABLE public.appointments DROP COLUMN notes;
ALTER TABLE public.appointments RENAME COLUMN notes_json TO notes;


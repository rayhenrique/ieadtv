-- Blogger import support for noticias (idempotency + source traceability)
-- Run this in Supabase SQL editor before running the import script.

ALTER TABLE public.noticias
    ADD COLUMN IF NOT EXISTS fonte_externa TEXT NULL;

ALTER TABLE public.noticias
    ADD COLUMN IF NOT EXISTS fonte_externa_id TEXT NULL;

ALTER TABLE public.noticias
    ADD COLUMN IF NOT EXISTS fonte_externa_url TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_noticias_external_source_unique
    ON public.noticias (fonte_externa, fonte_externa_id)
    WHERE fonte_externa IS NOT NULL
      AND fonte_externa_id IS NOT NULL;

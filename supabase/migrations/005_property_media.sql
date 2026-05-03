-- ============================================================
-- 005_property_media.sql — Galeria, Tour 360 e Vídeo por imóvel
-- ============================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS gallery_urls  text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tour360_urls  text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url     text;

-- ── Storage bucket 'properties' ──────────────────────────────
-- Crie o bucket manualmente no Dashboard ANTES de executar as policies:
--   Storage → New bucket → Nome: properties → Public: sim
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "properties_media_public_read" ON storage.objects;
CREATE POLICY "properties_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'properties');

DROP POLICY IF EXISTS "properties_media_upload" ON storage.objects;
CREATE POLICY "properties_media_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'properties' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'corretor')
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "properties_media_update" ON storage.objects;
CREATE POLICY "properties_media_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'properties' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "properties_media_delete" ON storage.objects;
CREATE POLICY "properties_media_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'properties' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
      )
    )
  );

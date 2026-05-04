-- ============================================================
-- 006_immersive_media.sql
-- Arquitetura de mídia imersiva para imóveis de alto padrão
-- ============================================================

-- ── property_media ───────────────────────────────────────────
-- Substitui gallery_urls[], tour360_urls[], video_url no futuro.
-- type: 'photo' | 'video' | 'tour_360' | 'floor_plan_image'
-- metadata (JSONB) para tour_360:
--   { "room_name": "Sala de Estar",
--     "hotspots": [{"yaw":0,"pitch":-25,"target_media_id":"uuid","label":"Cozinha"}] }

CREATE TABLE IF NOT EXISTS public.property_media (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id    UUID        NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  type           TEXT        NOT NULL CHECK (type IN ('photo','video','tour_360','floor_plan_image')),
  url            TEXT        NOT NULL,
  thumbnail_url  TEXT,
  order_index    INTEGER     NOT NULL DEFAULT 0,
  is_cover       BOOLEAN     NOT NULL DEFAULT false,
  metadata       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS property_media_property_id_idx ON public.property_media(property_id);
CREATE INDEX IF NOT EXISTS property_media_type_idx        ON public.property_media(property_id, type);

-- ── property_floor_plans ─────────────────────────────────────
-- type 'image' : image_url aponta para arquivo no storage
-- type 'vector': plan_data guarda JSON com rooms desenhados
--   { "rooms": [{"id":"...","x":50,"y":50,"w":200,"h":150,"name":"Sala","area":"120m²"}],
--     "viewBox": "0 0 800 600" }

CREATE TABLE IF NOT EXISTS public.property_floor_plans (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID        NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('image','vector')),
  image_url   TEXT,
  plan_data   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS floor_plans_property_id_idx ON public.property_floor_plans(property_id);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.property_media       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_floor_plans ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "media_read_public"       ON public.property_media
  FOR SELECT USING (true);

CREATE POLICY "floor_plan_read_public"  ON public.property_floor_plans
  FOR SELECT USING (true);

-- Escrita: admin ou corretor ativo
CREATE POLICY "media_write_staff"       ON public.property_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND status = 'active' AND role IN ('admin','corretor')
    )
  );

CREATE POLICY "floor_plan_write_staff"  ON public.property_floor_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND status = 'active' AND role IN ('admin','corretor')
    )
  );

-- ── Helper: cover única por imóvel ──────────────────────────
-- Garante que só uma foto por imóvel seja is_cover=true
CREATE OR REPLACE FUNCTION public.enforce_single_cover()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_cover = true AND NEW.type = 'photo' THEN
    UPDATE public.property_media
    SET is_cover = false
    WHERE property_id = NEW.property_id
      AND type = 'photo'
      AND id <> NEW.id
      AND is_cover = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_cover ON public.property_media;
CREATE TRIGGER trg_single_cover
  AFTER INSERT OR UPDATE OF is_cover ON public.property_media
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_cover();

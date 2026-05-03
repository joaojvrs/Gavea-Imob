-- ============================================================
-- 005_reel_views.sql — Função para incrementar views de reels
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_reel_views(p_reel_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.reels SET views = views + 1 WHERE id = p_reel_id;
$$;

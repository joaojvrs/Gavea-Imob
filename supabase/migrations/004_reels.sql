-- ============================================================
-- 004_reels.sql — Gávea Reels: tabelas, RLS, view
-- ============================================================

-- ── Tabela principal de reels ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reels (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text,
  description   text,
  video_url     text NOT NULL,
  thumbnail_url text,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  views         integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode visualizar
CREATE POLICY "Reels visíveis para todos"
  ON public.reels FOR SELECT
  USING (true);

-- Apenas admin/corretor ativo pode inserir
CREATE POLICY "Reels: inserir apenas profissional ativo"
  ON public.reels FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'corretor')
        AND status = 'active'
    )
  );

-- Criador pode excluir seus próprios; admin também pode excluir qualquer um
CREATE POLICY "Reels: excluir próprio ou admin"
  ON public.reels FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Tabela de likes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reel_likes (
  reel_id    uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reel_id, user_id)
);

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver likes
CREATE POLICY "Likes: leitura para autenticados"
  ON public.reel_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Só pode curtir sendo o próprio usuário
CREATE POLICY "Likes: inserir como próprio usuário"
  ON public.reel_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Só pode descurtir sendo o próprio usuário
CREATE POLICY "Likes: excluir como próprio usuário"
  ON public.reel_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ── Tabela de comentários ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reel_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id     uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL,
  author_name text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

-- Comentários visíveis para todos
CREATE POLICY "Comentários visíveis para todos"
  ON public.reel_comments FOR SELECT
  USING (true);

-- Só pode comentar sendo o próprio usuário
CREATE POLICY "Comentários: inserir como próprio usuário"
  ON public.reel_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Pode excluir o próprio comentário ou ser admin
CREATE POLICY "Comentários: excluir próprio ou admin"
  ON public.reel_comments FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Policy de SELECT público nos profiles ────────────────────
-- Necessário para a view reels_with_stats fazer JOIN com profiles
DROP POLICY IF EXISTS "Leitura do próprio perfil" ON public.profiles;

CREATE POLICY "Perfis públicos para reels"
  ON public.profiles FOR SELECT
  USING (true);

-- ── View com estatísticas ────────────────────────────────────
CREATE OR REPLACE VIEW public.reels_with_stats AS
SELECT
  r.*,
  p.full_name  AS creator_name,
  p.role       AS creator_role,
  COALESCE(
    (SELECT COUNT(*)::integer FROM public.reel_likes rl    WHERE rl.reel_id = r.id), 0
  ) AS likes_count,
  COALESCE(
    (SELECT COUNT(*)::integer FROM public.reel_comments rc WHERE rc.reel_id = r.id), 0
  ) AS comments_count
FROM public.reels r
LEFT JOIN public.profiles p ON p.id = r.created_by;

-- ============================================================
-- ATENÇÃO: bucket de storage
-- O bucket 'reels' precisa ser criado manualmente no Dashboard:
--   Supabase Dashboard → Settings → Storage → New bucket
--   Nome: reels
--   Marcar como público (Public bucket)
-- ============================================================

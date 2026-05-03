-- ============================================================
-- 003_status_and_properties.sql
-- 1. Adiciona campo status em profiles
-- 2. Atualiza trigger handle_new_user para setar status
-- 3. Adiciona funções seguras para admin gerenciar usuários
-- 4. Cria tabela properties com RLS
-- Execute no SQL Editor do Supabase Dashboard.
-- ============================================================

-- ── 1. Adicionar status a profiles ──────────────────────────

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending', 'active', 'revoked'));

-- ── 2. Atualizar trigger: corretor e admin nascem pending ────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role   text;
  v_status text;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data ->> 'role', 'usuario');

  -- usuario entra ativo; corretor e admin precisam de aprovação
  IF v_role = 'usuario' THEN
    v_status := 'active';
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    v_role,
    v_status
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- ── 3. Funções admin (security definer = bypass RLS) ─────────

-- Listar todos os perfis (somente admin ativo pode chamar)
CREATE OR REPLACE FUNCTION public.admin_get_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.profiles a
    WHERE a.id = auth.uid()
      AND a.role  = 'admin'
      AND a.status = 'active'
  );
$$;

-- Aprovar ou revogar um usuário (somente admin ativo)
CREATE OR REPLACE FUNCTION public.admin_set_profile_status(
  p_target_id uuid,
  p_status     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('pending', 'active', 'revoked') THEN
    RAISE EXCEPTION 'Status inválido: %', p_status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  UPDATE public.profiles
  SET status = p_status
  WHERE id = p_target_id;
END;
$$;

-- ── 4. Tabela de imóveis ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.properties (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  type          text        NOT NULL DEFAULT 'Apartamento',
  location      text        NOT NULL,
  neighborhood  text,
  city          text,
  state         text,
  area          numeric,
  bedrooms      integer,
  bathrooms     integer,
  parking       integer,
  suites        integer,
  price         text,
  description   text,
  features      text[]      DEFAULT '{}',
  infrastructure text[]     DEFAULT '{}',
  lazer         text[]      DEFAULT '{}',
  image_url     text,
  match_score   numeric     DEFAULT 0,
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'draft', 'sold')),
  created_by    uuid        REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Qualquer um lê imóveis ativos
CREATE POLICY "Leitura pública de imóveis ativos"
  ON public.properties FOR SELECT
  USING (status = 'active');

-- Admin lê tudo (inclusive draft e sold)
CREATE POLICY "Admin lê todos os imóveis"
  ON public.properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admin e corretor ativos podem inserir
CREATE POLICY "Admin e corretor inserem imóveis"
  ON public.properties FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'corretor')
        AND status = 'active'
    )
  );

-- Admin pode atualizar qualquer imóvel; corretor só os seus
CREATE POLICY "Atualização de imóveis"
  ON public.properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
    OR (
      created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'corretor' AND status = 'active'
      )
    )
  );

-- Trigger updated_at em properties
DROP TRIGGER IF EXISTS set_properties_updated_at ON public.properties;
CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

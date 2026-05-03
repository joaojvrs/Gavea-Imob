-- ============================================================
-- SETUP COMPLETO — Execute no Supabase SQL Editor
-- (uma única vez, cobre tudo: tabelas, RLS, funções, admin)
-- ============================================================

-- ── 1. Tabela profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  role       text        NOT NULL DEFAULT 'usuario'
                         CHECK (role IN ('admin', 'corretor', 'usuario')),
  status     text        NOT NULL DEFAULT 'active'
                         CHECK (status IN ('pending', 'active', 'revoked')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── 2. Helper is_admin() — evita recursão infinita nas policies ──
-- (SECURITY DEFINER roda como owner, sem RLS → sem loop)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

-- ── 3. Políticas RLS corrigidas ──────────────────────────────
DROP POLICY IF EXISTS "Leitura do próprio perfil"  ON public.profiles;
DROP POLICY IF EXISTS "Atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admin lê todos os perfis"   ON public.profiles;

-- Qualquer usuário lê o próprio perfil
CREATE POLICY "Leitura do próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin lê todos (usa helper SECURITY DEFINER → sem recursão)
CREATE POLICY "Admin lê todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Usuário atualiza o próprio perfil
CREATE POLICY "Atualização do próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 4. Trigger: cria perfil ao registrar ────────────────────
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── 5. Backfill: insere perfis para usuários já cadastrados ──
INSERT INTO public.profiles (id, full_name, role, status)
SELECT
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  CASE
    WHEN (u.raw_user_meta_data ->> 'role') IN ('admin', 'corretor', 'usuario')
    THEN (u.raw_user_meta_data ->> 'role')
    ELSE 'usuario'
  END,
  CASE
    WHEN COALESCE(u.raw_user_meta_data ->> 'role', 'usuario') = 'usuario'
    THEN 'active'
    ELSE 'pending'
  END
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ── 6. Funções admin (SECURITY DEFINER = bypass RLS) ─────────
CREATE OR REPLACE FUNCTION public.admin_get_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.* FROM public.profiles p
  WHERE public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.admin_set_profile_status(
  p_target_id uuid,
  p_status    text
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

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  UPDATE public.profiles SET status = p_status WHERE id = p_target_id;
END;
$$;

-- ── 7. Tabela properties ─────────────────────────────────────
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

DROP POLICY IF EXISTS "Leitura pública de imóveis ativos"   ON public.properties;
DROP POLICY IF EXISTS "Admin lê todos os imóveis"           ON public.properties;
DROP POLICY IF EXISTS "Admin e corretor inserem imóveis"    ON public.properties;
DROP POLICY IF EXISTS "Atualização de imóveis"              ON public.properties;

CREATE POLICY "Leitura pública de imóveis ativos"
  ON public.properties FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admin lê todos os imóveis"
  ON public.properties FOR SELECT
  USING (public.is_admin());

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

CREATE POLICY "Atualização de imóveis"
  ON public.properties FOR UPDATE
  USING (
    public.is_admin()
    OR (
      created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'corretor' AND status = 'active'
      )
    )
  );

DROP TRIGGER IF EXISTS set_properties_updated_at ON public.properties;
CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── 8. TORNAR-SE ADMIN ────────────────────────────────────────
-- Seu user ID detectado nos logs de erro:
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE id = '38337942-4246-48e8-a327-2e591448b016';

-- ── Verificar resultado ───────────────────────────────────────
SELECT p.full_name, p.role, p.status, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at;

-- ============================================================
-- 002_set_admin.sql
-- Como se tornar administrador da plataforma Gávea.
--
-- OPÇÃO A: pelo email (substitua pelo seu email)
-- ============================================================

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'SEU_EMAIL_AQUI'
);

-- ============================================================
-- OPÇÃO B: pelo ID do usuário
-- (encontre em Supabase Dashboard → Authentication → Users)
-- ============================================================

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = 'SEU_USER_ID_AQUI';

-- ============================================================
-- VERIFICAR resultado:
-- ============================================================

-- SELECT p.full_name, p.role, u.email
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id;

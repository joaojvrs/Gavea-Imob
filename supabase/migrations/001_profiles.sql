-- ============================================================
-- 001_profiles.sql
-- Tabela de perfis vinculada ao auth.users do Supabase.
-- Roles: 'admin' | 'corretor' | 'usuario'
-- Execute no SQL Editor do Supabase Dashboard.
-- ============================================================

-- 1. Tabela de perfis
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text        not null default 'usuario'
                          check (role in ('admin', 'corretor', 'usuario')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Habilitar Row Level Security
alter table public.profiles enable row level security;

-- 3. Políticas de acesso

-- Usuário lê apenas o próprio perfil
create policy "Leitura do próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- Usuário atualiza apenas o próprio perfil
create policy "Atualização do próprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin lê todos os perfis
create policy "Admin lê todos os perfis"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Função + Trigger: cria perfil automaticamente ao registrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'usuario')
  );
  return new;
end;
$$;

-- Remove trigger anterior se existir (idempotente)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- 5. Função para atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();

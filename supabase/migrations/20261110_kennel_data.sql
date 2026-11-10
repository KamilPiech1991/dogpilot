-- Dogpilot: dane hodowli zapisane na koncie użytkownika (profil, psy, mioty, wpisy – cały stan panelu).
-- Jeden wiersz na konto; użytkownik widzi i zmienia wyłącznie swój wiersz (RLS).
-- Uruchom w Supabase → SQL Editor (raz). Bezpieczne do ponownego uruchomienia.

create table if not exists public.kennel_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

comment on table public.kennel_data is 'Stan panelu Dogpilot dla konta (psy, mioty, zdrowie, finanse, ustawienia) – synchronizacja między urządzeniami.';

alter table public.kennel_data enable row level security;

drop policy if exists "kennel_data: own select" on public.kennel_data;
create policy "kennel_data: own select" on public.kennel_data for select using (auth.uid() = user_id);
drop policy if exists "kennel_data: own insert" on public.kennel_data;
create policy "kennel_data: own insert" on public.kennel_data for insert with check (auth.uid() = user_id);
drop policy if exists "kennel_data: own update" on public.kennel_data;
create policy "kennel_data: own update" on public.kennel_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "kennel_data: own delete" on public.kennel_data;
create policy "kennel_data: own delete" on public.kennel_data for delete using (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists kennel_data_touch on public.kennel_data;
create trigger kennel_data_touch before update on public.kennel_data for each row execute function public.touch_updated_at();

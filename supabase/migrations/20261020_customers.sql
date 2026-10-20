-- Dogpilot: baza klientów. Każde konto z auth.users dostaje wiersz w public.customers (trigger),
-- a użytkownik może czytać i uzupełniać wyłącznie własny wiersz (RLS).
-- Uruchom w Supabase → SQL Editor (raz). Bezpieczne do ponownego uruchomienia.

create table if not exists public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  provider text,                       -- 'email' | 'google' | 'apple'
  mode text check (mode in ('breeder', 'owner')),
  kennel_name text,
  language text default 'pl',
  terms_version text,                  -- wersja regulaminu zaakceptowana przy rejestracji
  privacy_version text,                -- wersja polityki prywatności
  terms_accepted_at timestamptz,       -- kiedy klient zaakceptował regulamin i politykę
  marketing_consent boolean not null default false,
  welcome_email_at timestamptz,        -- kiedy wysłano e-mail z podziękowaniem / linkiem do hasła
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customers is 'Klienci Dogpilot – jeden wiersz na konto; zasilany triggerem z auth.users.';

alter table public.customers enable row level security;

drop policy if exists "customers: own row select" on public.customers;
create policy "customers: own row select" on public.customers for select using (auth.uid() = id);
drop policy if exists "customers: own row update" on public.customers;
create policy "customers: own row update" on public.customers for update using (auth.uid() = id) with check (auth.uid() = id);
-- wstawianie robi tylko trigger (security definer); klient nie może dodać cudzego wiersza

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();

-- nowy użytkownik (e-mail, Google, Apple) → wiersz klienta; dane zgody przychodzą w metadanych rejestracji
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.customers (id, email, full_name, provider, mode, language, terms_version, privacy_version, terms_accepted_at, marketing_consent)
  values (
    new.id,
    new.email,
    coalesce(nullif(m->>'full_name', ''), nullif(m->>'name', '')),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    case when m->>'mode' in ('breeder', 'owner') then m->>'mode' else null end,
    coalesce(nullif(m->>'language', ''), 'pl'),
    nullif(m->>'terms_version', ''),
    nullif(m->>'privacy_version', ''),
    nullif(m->>'terms_accepted_at', '')::timestamptz,
    coalesce((m->>'marketing_consent')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- zmiana e-maila w auth → w bazie klientów
create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.customers set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end $$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users for each row execute function public.handle_user_email_change();

-- konta założone przed uruchomieniem tej migracji
insert into public.customers (id, email, full_name, provider, created_at)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), coalesce(u.raw_app_meta_data->>'provider', 'email'), u.created_at
from auth.users u
on conflict (id) do nothing;

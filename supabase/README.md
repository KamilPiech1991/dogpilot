# Supabase – konta, baza klientów, e-maile

## 1. Baza klientów (jednorazowo)
Supabase → **SQL Editor** → wklej i uruchom `migrations/20261020_customers.sql`.
Tworzy tabelę `public.customers` (jeden wiersz na konto), trigger kopiujący każdą nową rejestrację
(e-mail, Google, Apple) z `auth.users`, kolumny zgody na regulamin i politykę (`terms_version`,
`privacy_version`, `terms_accepted_at`) oraz polityki RLS (klient widzi i edytuje tylko swój wiersz).
Podgląd: **Table Editor → customers**.

## 2. E-maile (Authentication → Email Templates)
- **Confirm signup** – wklej `email-templates/confirm-signup.html`, temat:
  `Dziękujemy za rejestrację w Dogpilot – potwierdź adres e-mail`.
- **Reset password** – wklej `email-templates/set-password.html`, temat:
  `Dogpilot – dziękujemy za rejestrację, ustaw swoje hasło`.
  Ten sam szablon panel wysyła automatycznie po pierwszej rejestracji przez Google (link „Ustaw hasło”)
  i przy zwykłym resecie hasła.
- Nadawca: domyślny mailer Supabase ma limit ok. 2 wiadomości na godzinę – przed premierą ustaw
  własne SMTP (Project Settings → Authentication → SMTP), np. Resend lub Postmark, z adresem w domenie dogpilot.pl.

## 3. Adresy (Authentication → URL Configuration)
- Site URL: `https://dogpilot.pl/app/` (na podglądzie: `https://kamilpiech1991.github.io/dogpilot/app/`)
- Redirect URLs: `https://dogpilot.pl/**`, `https://kamilpiech1991.github.io/dogpilot/**`
  (link z e-maila wraca do panelu pod `/app/#/ustaw-haslo`).

## 4. Co robi aplikacja
- Rejestracja (strona i panel) wymaga zaznaczenia zgody na regulamin i politykę prywatności; data i wersja
  zgody trafiają do metadanych konta i do `customers`.
- Po zalogowaniu panel uzupełnia w `customers` tryb (hodowca / właściciel), imię, nazwę hodowli i język.
- Konto z Google bez hasła dostaje raz e-mail z linkiem do ustawienia hasła (`welcome_email_at`);
  hasło można też ustawić w panelu: Ustawienia → Konto → „Ustaw / zmień hasło”.

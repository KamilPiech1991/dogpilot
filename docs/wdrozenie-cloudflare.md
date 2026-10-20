# Wdrożenie dogpilot.pl na Cloudflare Pages

Kod zostaje na GitHubie (repozytorium `KamilPiech1991/dogpilot`). Cloudflare buduje stronę i panel
z gałęzi `main` i serwuje je pod `dogpilot.pl`. Podgląd na github.io działa dalej niezależnie.

## 1. Domena w Cloudflare (ok. 15 min + propagacja DNS do 24 h)
1. Załóż konto na https://dash.cloudflare.com → **Add a domain** → `dogpilot.pl` → plan **Free**.
2. Cloudflare pokaże dwa serwery nazw (np. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
   U rejestratora domeny (tam, gdzie kupiłeś dogpilot.pl) zmień serwery DNS (NS) na te dwa.
3. Poczekaj na e-mail „dogpilot.pl is now active on Cloudflare”.
4. W **SSL/TLS** ustaw tryb **Full (strict)** i włącz **Always Use HTTPS**.

## 2. Projekt Pages (ok. 10 min)
1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → autoryzuj GitHub → wybierz `dogpilot`.
2. Ustawienia builda:
   - Production branch: `main`
   - Build command: `bash scripts/build-site.sh`
   - Build output directory: `web/dist`
   - Root directory: *(puste)*
3. **Environment variables** (Production i Preview):
   ```
   NODE_VERSION              = 22
   PUBLIC_SUPABASE_URL       = https://vsgnecdazvzbszibkdab.supabase.co
   PUBLIC_SUPABASE_ANON_KEY  = <klucz anon public z Supabase → Project Settings → API>
   ```
4. **Save and Deploy** – pierwszy build trwa 2–3 min. Strona pojawi się pod `dogpilot-xxx.pages.dev`.
5. **Custom domains → Set up a custom domain** → `dogpilot.pl` (Cloudflare sam doda rekord DNS),
   potem to samo dla `www.dogpilot.pl`. Plik `_redirects` przekierowuje `www` na domenę główną.

## 3. Supabase i Google pod nową domenę (5 min)
- Supabase → **Authentication → URL Configuration**:
  - Site URL: `https://dogpilot.pl/app/`
  - Redirect URLs: `https://dogpilot.pl/**` (zostaw też `https://kamilpiech1991.github.io/dogpilot/**` na podgląd)
- Google Cloud → **APIs & Services → OAuth consent screen → Authorized domains**: dodaj `dogpilot.pl`
  (adres przekierowania w Google pozostaje ten z Supabase: `https://vsgnecdazvzbszibkdab.supabase.co/auth/v1/callback`).
- Supabase → Authentication → Email Templates: linki w e-mailach korzystają z Site URL, więc po tej zmianie
  prowadzą na dogpilot.pl.

## 4. Sprawdzenie
- `https://dogpilot.pl` – strona, `https://dogpilot.pl/app/` – panel (bez sesji przekieruje na logowanie),
  `https://www.dogpilot.pl` – przekierowanie na domenę główną.
- Logowanie Google ze strony → powrót do `https://dogpilot.pl/app/`.
- Każdy push do `main` buduje nową wersję; pull requesty dostają własne adresy podglądu `*.pages.dev`.

## Co robi skrypt `scripts/build-site.sh`
Buduje `web` (Astro) i `app` (Vite) do `web/dist`, panel ląduje pod `/app/`. Zmienna `BASE_PATH`
(pusta dla domeny, `/dogpilot` na github.io) dopisuje prefiks tylko tam, gdzie trzeba. Klucze Supabase
podajesz raz jako `PUBLIC_SUPABASE_*`; panel dostaje je jako `VITE_*`.
`web/public/_redirects` i `_headers` to konfiguracja Cloudflare (przekierowania, cache, nagłówki bezpieczeństwa);
na podglądzie GitHub są usuwane.

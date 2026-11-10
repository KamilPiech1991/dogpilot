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
   potem to samo dla `www.dogpilot.pl`.
6. **Przekierowanie www → dogpilot.pl**: Cloudflare → domena `dogpilot.pl` → **Rules → Redirect Rules → Create rule**
   → szablon **„Redirect from WWW to Root”** → Deploy. (Plik `_redirects` w Pages obsługuje tylko ścieżki, nie domeny.)

## 3. Supabase i Google pod nową domenę (5 min)
- Supabase → **Authentication → URL Configuration**:
  - Site URL: `https://dogpilot.pl/app/`
  - Redirect URLs: `https://dogpilot.pl/**` (zostaw też `https://kamilpiech1991.github.io/dogpilot/**` na podgląd)
- Google Cloud → **APIs & Services → OAuth consent screen → Authorized domains**: dodaj `dogpilot.pl`
  (adres przekierowania w Google pozostaje ten z Supabase: `https://vsgnecdazvzbszibkdab.supabase.co/auth/v1/callback`).
- Supabase → Authentication → Email Templates: linki w e-mailach korzystają z Site URL, więc po tej zmianie
  prowadzą na dogpilot.pl.

## 4. Zdjęcia w Cloudflare R2 (ok. 10 min)
Zdjęcia psów, szczeniąt i logo hodowli trafiają do R2, a w danych hodowli zostaje tylko krótki adres.
Wysyła je funkcja `functions/api/media/[[path]].ts` (Cloudflare Pages Functions). Panel sam przenosi też
zdjęcia dodane wcześniej. Dopóki R2 nie jest podpięte, wszystko działa jak dotąd (zdjęcia zostają w danych).

1. Cloudflare → **R2 Object Storage** → włącz R2. Cloudflare poprosi o kartę, ale do 10 GB miejsca
   i milionów odczytów miesięcznie nic nie pobiera.
2. **Create bucket** → nazwa `dogpilot-media` → Location: **Automatic** albo podpowiedź **Eastern Europe (EEUR)**.
   *Nie* wybieraj „Specify jurisdiction”.
3. **Workers & Pages** → projekt `dogpilot` → **Settings → Bindings → Add → R2 bucket**:
   Variable name `MEDIA`, bucket `dogpilot-media` → **Save** (dla Production; Preview opcjonalnie).
4. **Deployments** → przy ostatnim wdrożeniu **⋯ → Retry deployment**. Powiązanie działa od następnego wdrożenia.
5. *(opcjonalnie, później)* bucket → **Settings → Custom Domains → Connect domain** → `media.dogpilot.pl`,
   potem w projekcie Pages zmienna `MEDIA_PUBLIC_URL = https://media.dogpilot.pl` i ponowne wdrożenie.
   Nowe zdjęcia będą wtedy serwowane wprost z R2 (bez funkcji). Starsze adresy `/api/media/...` działają dalej.

Funkcja sprawdza sesję w Supabase (korzysta z `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY` z punktu 2),
przyjmuje JPG, PNG i WebP do 3 MB i zapisuje je pod `u/<id użytkownika>/<losowa nazwa>`. Usuwać może tylko właściciel.
Darmowy plan Pages Functions to 100 000 wywołań dziennie.

## 5. Sprawdzenie
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

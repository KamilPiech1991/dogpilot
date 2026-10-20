# Dogpilot – strona WWW (Astro)

- `npm install && npm run dev` – podgląd lokalny (http://localhost:4321)
- `npm run build` – statyczny build do `dist/`
- Treści i ustawienia (e-mail, adres, linki do sklepów, endpoint formularzy, analityka): `src/i18n/content.ts` → `SITE`
- Poradnik: pliki Markdown w `src/content/poradnik/`
- Podgląd na GitHub Pages: workflow `.github/workflows/pages.yml` (prefiks `/dogpilot` dodaje `scripts/prefix-base.mjs`); produkcja na własnej domenie działa z katalogu głównego bez prefiksu.

## Logowanie (Supabase Auth: Google, e-mail)
1. Utwórz projekt Supabase (region Frankfurt) i w **Authentication → Providers** włącz Google (Client ID/Secret z Google Cloud Console → OAuth client, typ Web, authorized redirect URI: `https://<projekt>.supabase.co/auth/v1/callback`).
2. W **Authentication → URL configuration** dodaj adresy strony i panelu (np. `https://dogpilot.pl`, `https://dogpilot.pl/app/`, podgląd `https://kamilpiech1991.github.io/dogpilot/app/`).
3. Skopiuj `Project URL` i `anon key` do `web/.env` i `app/.env` (wzór: `.env.example`), a dla GitHub Pages do **Settings → Secrets and variables → Actions** jako `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY`.
Bez tych wartości strona i panel działają w trybie demo (dane lokalne w przeglądarce).

## Panel aplikacji webowej
Prototyp z `app/` jest budowany w tym samym workflow i publikowany pod `/app/` (na podglądzie `/dogpilot/app/`). Docelowo: `app.dogpilot.pl` z `app/dist` bez prefiksu.

## Domena dogpilot.pl

Docelowy hosting: **Cloudflare Pages** – pełna instrukcja w `docs/wdrozenie-cloudflare.md`.
Wariant zapasowy z GitHub Pages poniżej.

### GitHub Pages (wariant zapasowy)

1. **DNS u rejestratora** – rekordy dla domeny głównej (A) i dla `www` (CNAME):
   ```
   dogpilot.pl      A      185.199.108.153
   dogpilot.pl      A      185.199.109.153
   dogpilot.pl      A      185.199.110.153
   dogpilot.pl      A      185.199.111.153
   www.dogpilot.pl  CNAME  kamilpiech1991.github.io
   ```
2. **GitHub → Settings → Pages → Custom domain**: `dogpilot.pl`, zapisz, poczekaj na „DNS check successful”, zaznacz **Enforce HTTPS** (certyfikat pojawia się do ~godziny). `www.dogpilot.pl` przekieruje na domenę główną.
3. Workflow sam wykrywa domenę (`actions/configure-pages` → `base_path`): z domeną buduje stronę w katalogu głównym, bez niej pod `/dogpilot/`. Po ustawieniu domeny uruchom build ręcznie (Actions → Run workflow) albo wypchnij dowolną zmianę.
4. W Supabase (Authentication → URL configuration) dodaj `https://dogpilot.pl/**`, a jako Site URL `https://dogpilot.pl/app/`.

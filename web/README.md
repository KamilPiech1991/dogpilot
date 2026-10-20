# Dogpilot – strona WWW (Astro)

- `npm install && npm run dev` – podgląd lokalny (http://localhost:4321)
- `npm run build` – statyczny build do `dist/`
- Treści i ustawienia (e-mail, adres, linki do sklepów, endpoint formularzy, analityka): `src/i18n/content.ts` → `SITE`
- Poradnik: pliki Markdown w `src/content/poradnik/`
- Podgląd na GitHub Pages: workflow `.github/workflows/pages.yml` (prefiks `/dogpilot` dodaje `scripts/prefix-base.mjs`); produkcja na własnej domenie działa z katalogu głównego bez prefiksu.

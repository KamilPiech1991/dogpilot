# Dogpilot – podsumowanie dotychczasowych prac i przyjętych rozwiązań

Stan na 20.10.2026. Ten dokument zbiera w jednym miejscu wszystko, co powstało od 16 do 20 października: analizę konkurenta, decyzje produktowe, prototyp aplikacji, makiety klikalne, dokumentację i plan wdrożenia. Szczegóły każdego etapu są w `docs/analiza-paw-manager-i-plan.md` (sekcje 0–23) i `docs/plan-wdrozenia-dogpilot.md`.

---

## 1. Gdzie co jest

| Element | Miejsce |
|---|---|
| Analiza konkurenta i plan produktu (23 sekcje) | `docs/analiza-paw-manager-i-plan.md` |
| Plan wdrożenia (technologia, hosting, koszty, fazy) | `docs/plan-wdrozenia-dogpilot.md` + `.docx` |
| Prototyp aplikacji webowej | `app/` (React 19 + TypeScript + Vite, ~5 600 linii w `src/`) |
| Makiety klikalne (64 ekrany: PL jasny, PL ciemny, EN jasny, EN ciemny) | kanwa https://claude.ai/artifact/YWbyrjyCnubfdMsPbZTNwc |
| Grafika marki (nagłówki, znak słowny, ikona, favicon) | `app/public/brand/` |
| Gałąź i PR | `claude/trusting-darwin-l0axyq` → PR #5 w `KamilPiech1991/qamitech` (draft) |
| Strona Qamitech (bez zmian) | `site/` + workflow deployu FTP |

Uruchomienie prototypu: `cd app && npm install && npm run dev` (podgląd produkcyjny: `npm run build && npx vite preview`). Dane trzymane są lokalnie w przeglądarce (`localStorage`, klucz `dogpilot.state.v1`); przycisk „Załaduj dane demonstracyjne” na ekranie powitalnym wczytuje przykładową hodowlę.

---

## 2. Przebieg prac (chronologicznie)

| Data | Etap | Efekt |
|---|---|---|
| 16.10 | Kontekst Qamitech | `context.md` z analizą qamitech.pl, import strony z FTP, workflow deployu |
| 19.10 | **Analiza Paw Manager** | profil firmy, cennik FREE/PRO, inwentarz funkcji ekran po ekranie z polami, odtworzony model danych, mocne/słabe strony, luki, strategia „być przed nimi”, ryzyka prawne, architektura, plan faz, backlog MoSCoW |
| 19.10 | **Pierwszy prototyp** (robocza nazwa Kennelo) | parytet funkcji z konkurentem na własnym nazewnictwie + funkcje z luk konkurenta |
| 19.10 | **Wygląd – wariant A** | pastelowa zieleń, kolor główny `#32BF46`, czcionka Nunito, ikony Lucide, „ciepłe karty” |
| 19.10 | **Nazwa Dogpilot** | wybór spośród propozycji (lista z weryfikacją kolizji w sekcji 18); nota o istniejących dogpilot.app / dogpilot.fr |
| 19.10 | Własne nazewnictwo | tabela „konkurent → Dogpilot” (sekcja 19), żeby nie kopiować słownika Paw Managera |
| 19.10 | Start jako strumień kart, grafika marki, zdjęcia, logo hodowli | nagłówek marki, gradientowe banery, zdjęcia psów i szczeniąt, logo hodowli na dokumentach |
| 19.10 | Metryka miotu, rejestr miotów, logowanie/rejestracja, akcje „+” | nowy miot, rezerwacja wystawy (wystawy.net) |
| 19.10 | **Makiety na kanwie**: Mioty, Rozród, Finanse, Raporty | kanwa v34, sekcja 20 |
| 19.10 | **Kalendarz wystaw ZKwP 2026** | 173 wystawy z terminarza zkwp.pl, plan startów, przypomnienia; wystawy.net tylko jako link (wymaga logowania, regulamin zakazuje pobierania automatem) |
| 19.10 | **Porównanie z nowymi ekranami konkurenta** (10 zrzutów) | kreator psa, powiadomienia, ustawienia w zakładkach, Facebook/Instagram, galeria psa (6 zdjęć), nowy dolny pasek, intro z łapkami, wybór języka na powitaniu – sekcja 22 |
| 20.10 | **Tryb ciemny i wersja angielska** | motyw Jasny/Ciemny/Systemowy, warstwa automatycznego tłumaczenia, 3 nowe rzędy makiet – sekcja 23 |
| 20.10 | **Plan wdrożenia** | technologia, hosting, koszty, GitHub vs Replit, fazy 0–5 |

---

## 3. Kluczowe decyzje i ich uzasadnienie

| Decyzja | Rozwiązanie | Dlaczego |
|---|---|---|
| Nazwa | **Dogpilot** | krótka, międzynarodowa, „pilot” = prowadzenie hodowli; do weryfikacji znaku towarowego przed sklepami |
| Grupa docelowa | hodowcy ZKwP/FCI (tryb „Prowadzę hodowlę”) + właściciele psów (tryb „Mam psiaka”) | ten sam kod, dwa zakresy funkcji; konkurent obsługuje tylko hodowców |
| Model cenowy | FREE (limity psów, wystaw, miesięcy wykresu) / PRO 89 zł/rok lub 12,99 zł/mies. | parytet cenowy z konkurentem, bez karty na start |
| Technologia | React + TypeScript + Vite; dane lokalne w prototypie, docelowo Supabase | jedna baza kodu na web, Android i iOS (PWA + Capacitor) |
| Wygląd | wariant A „Ciepła karta”: `#32BF46` (hover `#28A33A`, tekst na jasnym `#1F8A30`), Nunito, duże zaokrąglenia, gradientowe banery z ikoną w tle | wybrany spośród wariantów na kanwie; wyraźnie inny od konkurenta |
| Nawigacja (telefon) | Start · Mioty · „+” · Raporty · Ustawienia; w trybie „Mam psiaka” Psy zamiast Miotów | plus na środku; Psy, Finanse, Wystawy, Powiadomienia, Dokumenty w skrótach Ustawień i na Starcie |
| Start | kompaktowy nagłówek + chipy z liczbami + dymek asystenta + szybkie akcje + pionowy strumień kart | inny układ niż u konkurenta, najważniejsze rzeczy dnia na górze |
| Dodawanie psa | kreator 5 kroków (płeć → dane → rodzice → identyfikacja → podsumowanie) z kolorem płci na całym kreatorze | „w stylu konkurenta, ale bardziej interaktywnie”; walidacja chipa (15 cyfr), rasa z wyszukiwarką 90 ras |
| Zdjęcia | zmniejszane do 640 px, JPEG, do 6 zdjęć w galerii psa | limit pamięci przeglądarki (~5 MB) w prototypie; w produkcji Storage/CDN |
| Karta przekazania | kod QR z prefiksem `DGP1:` (stare `KNL1:` nadal czytane), bez ceny i prywatnych notatek | przeniesienie szczenięcia do aplikacji nabywcy jednym skanem |
| Kalendarz wystaw | dane ZKwP zapisane w aplikacji (`shows2026.ts`), odświeżanie na żywo dojdzie z backendem | wystawy.net nie udostępnia danych; ZKwP publikuje terminarz publicznie |
| Powiadomienia | jedno źródło terminów (zdrowie, cieczki, ciąża, wystawy, przypomnienia), wyprzedzenie per rodzaj, widżet na Starcie, powiadomienia systemowe, podsumowanie dzienne | konkurent ma tylko proste przypomnienia |
| Facebook / Instagram | połączenie kont (symulowane okno Meta), kreator posta z podglądem, „Ogłoś miot” | w produkcji Meta Graph API po stronie serwera |
| Tryb ciemny | Jasny / Ciemny / Systemowy, paleta: tło `#0F1A15`, karty `#16241D`, obramowania `#27392F`, tekst `#EAF4EE`, akcent `#4FD463` | oszczędza wzrok przy nocnym porodzie; „Systemowy” podąża za telefonem |
| Język angielski | warstwa automatycznego tłumaczenia (słownik ok. 1 300 fraz + reguły dla liczb i dat + dzielenie fraz), daty i kwoty en-GB | pełny angielski interfejs bez przepisywania ekranów; w produkcji słownik stanie się plikami językowymi |
| Intro | logo z rozmycia + sześć łapek jako pasek ładowania, raz na sesję | prośba z przeglądu konkurenta; `?nosplash` pomija w testach |
| Backend i hosting (plan) | Supabase (Frankfurt) + Cloudflare Pages + GitHub Actions; PWA → Capacitor | darmowe na czas budowy, ~25 USD/mies. na premierę; Vercel Hobby odpada (zakaz użytku komercyjnego) |
| Narzędzia pracy | GitHub jako źródło prawdy; Replit co najwyżej jako edytor | CI, przegląd kodu, deploy z gałęzi `main`, buildy mobilne |

---

## 4. Co zawiera prototyp (`app/`)

**Wejście:** intro → ekran powitalny (wybór języka PL/EN, tryb pracy, dane demo) → logowanie lub bezpłatna rejestracja (e-mail, hasło, Google – symulowane) → dane hodowli.

**Ekrany (trasy):** `/` Start · `/psy`, `/psy/nowy` (kreator), `/psy/:id` (Dane z galerią, Zdrowie, Rozród, Rodowód, Osiągnięcia, Wagi, Oś czasu) · `/mioty`, `/mioty/:id` (Metryka, Szczenięta, Ważenie, Plan odchowu 19 etapów, Dziennik porodu, Rentowność, Dokumenty, Pakiet na nowy dom) · `/szczenieta/:id` (karta przekazania z QR) · `/ciaza/:id` (monitor ciąży tydzień po tygodniu) · `/finanse` (koszty, przychody, rentowność miotów, kategorie, wykres 6 miesięcy) · `/raporty`, `/raporty/:kind` (13 raportów do PDF) · `/wystawy` (kalendarz ZKwP 2026) · `/powiadomienia`, `/przypomnienia` · `/dokumenty/:kind` (umowa sprzedaży, protokół przekazania, karta miotu, karta zdrowia) · `/ustawienia` (Profil, Powiadomienia, Aplikacja, Facebook i Instagram, Dane i konto) · `/skanuj` (odbiór psa) · `/szukaj` · `/portal/:id` (publiczna strona szczenięcia dla nabywcy).

**Parytet z konkurentem:** psy i dane, zdrowie z przypomnieniami, rozród (plany kryć, progesteron, USG, RTG), krycia reproduktora, mioty → szczenięta, wagi i ważenie miotu, rozwój z wykresem, plan odchowu, pakiet na nowy dom, karta przekazania + odbiór skanem, nabywcy i cena, wystawy/championaty, finanse, raporty PDF, przypomnienia, plan FREE/PRO, kopia JSON, kopia w chmurze (symulowana), usunięcie konta.

**Wyróżniki:** kalendarz cieczek z prognozą następnej cieczki i okna płodnego · rodowód 3 pokolenia + COI · przychody i rentowność miotu · dokumenty PDF · dziennik porodu · zespół hodowli z rolami · strona dla nabywcy · wyszukiwarka · kalendarz wystaw ZKwP z planem startów · centrum powiadomień · Facebook/Instagram · galeria · tryb ciemny · język angielski.

**Moduły kodu:** `app/types.ts` (model danych), `store.tsx` (stan, motyw, język), `heat.ts` / `pregnancy.ts` / `pedigree.ts` / `litters.ts` (logika hodowlana), `notifications.ts`, `shows2026.ts`, `breeds.ts`, `pawid.ts` (kod QR), `photo.ts`, `cloud.ts`, `i18n.ts` + `i18n-en.ts` + `i18n-rules.ts` (tłumaczenie), `format.ts` (daty, waluty, wiek).

---

## 5. Makiety na kanwie

64 ekrany w czterech rzędach (po 16): **PL jasny** (y = 0/1000), **PL ciemny** (2000/3000), **EN jasny** (4000/5000), **EN ciemny** (6000/7000). Ekrany: Powitanie, Logowanie, Start, Profil psa, Rozród, Monitor ciąży, Mioty, Profil miotu, Karta przekazania, Bilans hodowli, Raporty, Kalendarz wystaw, Intro, Kreator psa, Powiadomienia, Ustawienia. Linki między ekranami zostają w obrębie wariantu; przełącznik „Tryb ciemny” w Ustawieniach i segment „Polski / English” (także na powitaniu) przechodzą między wariantami. Warianty ciemne i angielskie są generowane z polskich makiet tą samą mapą kolorów i słownikiem co w aplikacji.

---

## 6. Jak sprawdzano jakość

- `npm run build` (tsc + vite) bez błędów; `npm run lint` – tylko ostrzeżenia stylistyczne.
- Smoke testy Playwright: wszystkie ekrany i zakładki na 1280 px i 390 px, dane demo i pusty stan, jasny i ciemny, polski i angielski – brak błędów w konsoli; przejścia: rejestracja, logowanie, Google, wgrywanie zdjęć i logo, akcje arkusza „+”, kreator psa, galeria, Facebook/Instagram, kopia w chmurze, usunięcie konta.
- Pomiar pokrycia tłumaczenia: ok. 2 000 unikalnych napisów interfejsu – po angielsku zostają tylko nazwy własne i treści użytkownika.
- Makiety: walidatory składni (`sc-if`/`sc-for`, zmienne), renderowanie kontrolne każdego wariantu.

---

## 7. Otwarte sprawy i co dalej

1. **Nazwa** – weryfikacja znaku „Dogpilot” (UPRP/EUIPO); kolizje: dogpilot.app, dogpilot.fr.
2. **Konta** – Supabase (projekt w Frankfurcie), Cloudflare, Google Play, Apple Developer, domena.
3. **Faza 1 planu** – schemat bazy i migracje z `types.ts`, Auth, warstwa synchronizacji offline, import danych z localStorage.
4. **Produkcja zamiast symulacji** – logowanie, Meta Graph API, kopia w chmurze, PDF na serwerze, push.
5. **Angielski** – zamiana warstwy tłumaczenia na pliki językowe (ten sam słownik), przegląd tekstów przez native speakera przed startem za granicą.
6. **Pytania z sekcji 17 analizy** (m.in. cennik końcowy, zakres FREE, kolejność rynków) – do potwierdzenia przed premierą.

Pełny harmonogram (12–14 tygodni do premiery, beta po ~8) jest w `docs/plan-wdrozenia-dogpilot.md`.

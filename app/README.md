# Dogpilot – prototyp aplikacji webowej dla hodowców i właścicieli psów

Prototyp odpowiadający zakresem aplikacji Paw Manager (analiza: `../docs/analiza-paw-manager-i-plan.md`).
Jedna baza kodu (React + TypeScript + Vite) przygotowana pod PWA i opakowanie w Android/iOS (Capacitor).

## Uruchomienie
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc + vite build → dist/
npm run preview   # podgląd builda
```
Na ekranie startowym wybierz moduł (Właściciel / Hodowca) lub kliknij **„Załaduj dane demonstracyjne”**.

## Zakres
Ekran powitalny → wybór trybu („Mam psiaka” / „Prowadzę hodowlę”) → **logowanie lub bezpłatna rejestracja** (e-mail i hasło z podglądem, walidacja, przycisk Google) → dane hodowli. W prototypie logowanie jest symulowane: e-mail i sposób logowania zapisują się w profilu, backend (Supabase Auth z logowaniem Google) wejdzie w fazie 2.

Psy i ich dane · zdrowie z przypomnieniami · rozród (plany kryć, progesteron, USG, RTG) i **monitor ciąży** · krycia reproduktora · mioty, szczenięta, wagi, rozwój miotu, plan odchowu, notatnik · **karta przekazania** (karta + kod QR + odbiór psa przez skan lub wklejenie) · pakiet na nowy dom · wystawy, championaty, osiągnięcia · finanse (bilans, kategorie, rejestr, analiza kosztów, wykres) · raporty do PDF (druk) · przypomnienia · plan FREE/PRO z limitami · backup JSON · dwa tryby pracy („Mam psa” / „Prowadzę hodowlę”).

## Funkcje, których konkurent nie ma (nasze wyróżniki)
- **Kalendarz cieczek** z prognozą następnej cieczki i okna płodnego (profil suki → Rozród; terminy także na Start).
- **Rodowód 3 pokolenia + współczynnik inbredu (COI)** liczony z własnej bazy psów (profil psa → Rodowód).
- **Przychody i rentowność miotu** – zaliczki, sprzedaż, krycia; wynik miotu i prognoza (Finanse → Przychody, miot → Finanse).
- **Dokumenty do PDF** wypełniane danymi: umowa sprzedaży, protokół przekazania, karta miotu, karta zdrowia (Dokumenty).
- **Dziennik porodu** – start, kolejne szczenięta, notatki, wizyta weterynarza; statystyki czasu porodu (miot → Poród).
- **Zespół hodowli** – zaproszenia z rolami właściciel / edytor / podgląd (Ustawienia).
- **Strona dla nabywcy** szczenięcia (link publiczny `#/portal/:id`): wagi, profilaktyka, karma, charakter, odliczanie do odbioru.
- **Wyszukiwarka globalna** (psy, szczenięta, mioty, wystawy, zdrowie, wydatki, przypomnienia) i **tryb ciemny**.
- Przycisk „+” z arkuszem szybkich akcji (waga, zdrowie, wydatek, przypomnienie, nowy pies) na desktopie i mobile.
- **Metryka miotu** – zakładka z danymi miotu (litera, rasa, nr zgłoszenia, data przeglądu, liczby szczeniąt, wagi, rodzice, poród, postęp odchowu) i **rejestr wszystkich miotów** (tabela z filtrami rok / matka / szukaj, podsumowanie, eksport CSV, druk).
- **Logo hodowli** – wgrywane w Ustawieniach; widoczne na Starcie, w pasku bocznym, na dokumentach, raportach, karcie przekazania i stronie dla nabywcy.
- **Zdjęcia psów i szczeniąt** – wybór pliku w formularzu, zmniejszanie w przeglądarce do 640 px, zapis w danych; widoczne w listach, profilach, na Starcie, na karcie przekazania i stronie dla nabywcy.

## Wygląd
Grafika marki leży w `public/brand/`: nagłówek (`header-1600.webp`, `header-800.webp`, kadr mobilny `header-mobile.webp`), znak słowny wycięty z nagłówka (`wordmark.png` ciemnozielony, `wordmark-white.png` na ciemne tło), ikona aplikacji (`icon-512.png`, `favicon-64.png`). Komponent `Wordmark` w `components/ui.tsx` dobiera wersję do trybu jasnego/ciemnego.
Start to strumień dużych kolorowych kart (ciąża, terminy, miot, finanse…) z dymkiem asystenta i rzędem szybkich akcji. Każdy ekran ma gradientowy baner nagłówka z dużą ikoną w tle (`ArtHeader` w `components/ui.tsx`), a tło aplikacji ma delikatne gradientowe plamy.
Wariant A z makiet („Ciepła karta”) w zieleni: `--primary #32BF46` (hover `#28A33A`, tekst `#1F8A30`), tła `#E4F8E8` / `#C9F0D1`, akcent `#F2B84B`.
Ikony Lucide, animacje wejścia (fadeUp/pop), kafle z efektem hover, tryb ciemny przełączany w pasku bocznym i w Ustawieniach.

## Struktura
- `src/app/types.ts` – model danych i słowniki (kategorie, klasy wystaw, checklista…)
- `src/app/store.tsx` – store (React context + reducer) z zapisem do `localStorage`, limity planu
- `src/app/pregnancy.ts` – logika kalendarza ciąży i treści tygodni
- `src/app/pawid.ts` – kodowanie/dekodowanie karty przekazania (prefiks `DGP1:`, odczytuje też starszy `KNL1:`)
- `src/app/litters.ts` – statystyki miotu i eksport rejestru do CSV
- `src/app/photo.ts` – wczytywanie i zmniejszanie zdjęć do data URL
- `src/app/heat.ts` – statystyki cieczek i prognoza następnej cieczki / okna płodnego
- `src/app/pedigree.ts` – budowa rodowodu i współczynnik inbredu (wzór Wrighta)
- `src/app/seed.ts` – dane demonstracyjne
- `src/components/` – UI kit, układ (sidebar + dolna nawigacja), formularz psa
- `src/pages/` – ekrany modułów

Dane trzymane są lokalnie w przeglądarce. Synchronizacja, konta, push i płatności – zgodnie z planem w `docs/`.

## Nazewnictwo
Nazwy funkcji i teksty są własne i celowo różnią się od Paw Managera (np. „karta przekazania” zamiast „Paw ID”, „pakiet na nowy dom” zamiast „cyfrowej wyprawki”, „monitor ciąży” zamiast „kalendarza ciąży”). Pełna tabela: sekcja 19 dokumentu `../docs/analiza-paw-manager-i-plan.md`.


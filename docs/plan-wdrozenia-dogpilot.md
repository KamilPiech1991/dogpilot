# Dogpilot – plan wdrożenia: technologia, hosting, kolejne kroki

Stan na 20.10.2026. Dokument odpowiada na pytania: w czym kodować, gdzie postawić aplikację, co jest darmowe, GitHub czy Replit, i co robimy krok po kroku od prototypu do sklepów.

---

## 1. W czym kodować – rekomendacja: zostajemy przy React + TypeScript

**Prototyp już jest produkcyjnym fundamentem.** `app/` to React 19 + TypeScript + Vite – kilkanaście tysięcy linii: model danych (`types.ts`), logika (cieczki, ciąża, COI, rentowność, dokumenty PDF), wszystkie ekrany, tryb ciemny, i18n. Przepisanie tego na inny stos (Flutter, React Native, Kotlin/Swift) oznacza 2–3 miesiące pracy, zanim pojawi się cokolwiek nowego. Zamiast tego podmieniamy pod spodem warstwę danych (localStorage → baza w chmurze) i pakujemy aplikację na telefony.

**Czy będzie chodzić płynnie?** Tak, pod warunkiem kilku zasad – aplikacja hodowlana to listy, formularze i wykresy, nie gra 3D. Ten typ aplikacji w WebView (Capacitor) działa równie płynnie jak natywny; różnicę widać dopiero przy ciężkich animacjach, kamerze w czasie rzeczywistym czy mapach. Zasady wydajności, które wprowadzamy od razu:

| Zasada | Jak |
|---|---|
| Mały start | podział kodu na trasy (`React.lazy`), lekkie ikony (Lucide – już są), bez ciężkich bibliotek UI |
| Długie listy | wirtualizacja (TanStack Virtual) dla rejestru miotów, kalendarza wystaw, historii wag |
| Zdjęcia | zmniejszanie do 640/1280 px przed wysłaniem (już robimy), WebP, miniatury z CDN |
| Dane | lokalna kopia (IndexedDB) + synchronizacja w tle → ekran otwiera się natychmiast, także offline |
| Animacje | tylko `transform`/`opacity`, `prefers-reduced-motion` (jest) |
| Pomiary | Lighthouse w CI, budżet: start < 2 s na średnim Androidzie, JS < 300 kB gzip |

**Telefony – PWA najpierw, potem Capacitor.**
1. **PWA** (manifest + service worker, `vite-plugin-pwa`): instalacja z przeglądarki na Androidzie i iOS, praca offline, powiadomienia web push (Android; iOS od 16.4 po dodaniu do ekranu głównego). Zero kosztów sklepów, aktualizacje natychmiast.
2. **Capacitor** (ta sama baza kodu w natywnej powłoce): obecność w Google Play i App Store, natywne powiadomienia push, aparat, udostępnianie, logowanie Google/Apple. Google Play: 25 USD jednorazowo; App Store: 99 USD/rok + Mac (lub budowanie w chmurze, np. Codemagic/GitHub Actions z macOS).
3. **React Native / Expo** – dopiero gdyby po premierze okazało się, że potrzebujemy czegoś, czego WebView nie udźwignie (nie spodziewamy się tego). Wtedy przenosimy ekran po ekranie, logika i model danych zostają.

---

## 2. Backend – rekomendacja: Supabase (Postgres + Auth + Storage), region EU

Potrzebujemy: konta użytkowników (e-mail, Google, Apple), bazy danych z uprawnieniami per hodowla (zespół z rolami), przechowywania zdjęć i PDF, powiadomień, zadań cyklicznych (odświeżanie kalendarza ZKwP, przypomnienia). Supabase daje to wszystko bez pisania własnego serwera:

- **Postgres** z Row Level Security – reguła „widzisz tylko swoją hodowlę” jest w bazie, nie w kodzie aplikacji.
- **Auth** – e-mail/hasło, Google, Apple, magic link; do 50 000 aktywnych użytkowników miesięcznie w planie darmowym.
- **Storage** – zdjęcia psów, logo, PDF-y (z CDN).
- **Realtime** – zmiany od wspólnika hodowli widoczne od razu.
- **Edge Functions + cron** – pobieranie terminarza ZKwP, wysyłka powiadomień, generowanie PDF po stronie serwera.
- Region **Frankfurt** (dane w UE, RODO), gotowa umowa powierzenia danych (DPA).

**Plan darmowy Supabase (stan na 10.2026):** 500 MB bazy, 1 GB plików, 5 GB transferu/mies., 50 000 MAU, 2 aktywne projekty, **projekt usypiany po 7 dniach bez ruchu** (budzi się ręcznie z panelu). To wystarcza na cały okres budowy i zamkniętą betę. Na premierę przechodzimy na **Pro – 25 USD/mies.** (8 GB bazy, 100 GB plików, 250 GB transferu, kopie zapasowe, brak usypiania).

**Darmowe / tanie alternatywy, gdybyśmy chcieli uniknąć abonamentu:**

| Opcja | Koszt | Kiedy ma sens |
|---|---|---|
| Supabase self-hosted na VPS **Hetzner** (CX22: 2 vCPU, 4 GB RAM, ~4,5–6 €/mies.) z panelem **Coolify** | ~5–6 €/mies. | gdy chcemy pełnej kontroli i najniższego kosztu; wymaga doglądania aktualizacji i kopii |
| **PocketBase** na tym samym VPS (jeden plik, SQLite, auth + pliki + realtime) | ~5 €/mies. | najprostszy backend dla < 10 000 użytkowników; mniej funkcji niż Postgres |
| **Neon** (Postgres serverless, darmowy plan) + własne auth | 0 zł na start | gdy chcemy tylko bazy; auth i pliki trzeba dołożyć osobno |
| **Firebase** (plan Spark) | 0 zł na start | dojrzałe push i auth, ale baza NoSQL – gorzej pasuje do rodowodów, raportów i zestawień |

Rekomendacja: **Supabase w chmurze** – najmniej pracy operacyjnej, a migracja na self-hosting jest możliwa później (to ten sam Postgres).

---

## 3. Hosting aplikacji webowej – rekomendacja: Cloudflare Pages (0 zł)

Front-end po zbudowaniu to pliki statyczne (HTML/JS/CSS) – nie potrzebuje serwera aplikacyjnego. Każdy CDN „udźwignie bazę odbiorców”; obciążenie trafia do Supabase, nie do hostingu plików.

| Hosting | Darmowy plan | Uwagi |
|---|---|---|
| **Cloudflare Pages** ✅ | nielimitowany transfer statyczny, 500 buildów/mies., własna domena, SSL, deploy z GitHuba | najlepsza darmowa oferta; funkcje serwerowe (Workers) 100 000 żądań/dzień gratis |
| Netlify | 100 GB transferu/mies., 300 min buildów | dobra alternatywa |
| Vercel (Hobby) | ✗ | regulamin zabrania użytku komercyjnego – odpada dla produktu płatnego |
| GitHub Pages | 100 GB/mies. | tylko publiczne repo lub plan płatny; brak nagłówków/przekierowań |
| Obecny hosting Qamitech (FTP) | 0 zł dodatkowo | aplikację można wrzucić jako statyczne pliki pod `app.qamitech.pl` (potrzebny `.htaccess` z przekierowaniem na `index.html`); zadziała, ale bez CDN i automatycznych deployów |

Konfiguracja docelowa: `dogpilot.app` lub `app.dogpilot.pl` → Cloudflare Pages (front), `api` = Supabase, zdjęcia = Supabase Storage lub **Cloudflare R2** (10 GB i transfer wychodzący za darmo – przy dużej liczbie zdjęć taniej niż Storage).

**Szacunek pojemności:** 1 000 hodowli × 10 psów × 6 zdjęć × ~150 kB ≈ 9 GB zdjęć; baza (psy, mioty, wagi, wpisy) ≈ 50–100 MB. Czyli: baza mieści się nawet w darmowym planie, zdjęcia decydują o kosztach → R2 albo Supabase Pro.

**Koszty w czasie:**

| Etap | Miesięcznie | Jednorazowo |
|---|---|---|
| Budowa + beta (0–3 mies.) | 0 zł (Supabase Free, Cloudflare Free) | domena ~50–100 zł/rok |
| Premiera (do ~2 000 użytkowników) | ~25 USD Supabase Pro + 0 zł hosting | Google Play 25 USD, Apple 99 USD/rok |
| Wzrost (5–20 tys. użytkowników) | ~60–120 USD (większa instancja, R2, e-maile transakcyjne Resend ~20 USD) | – |

---

## 4. GitHub czy Replit?

**GitHub – tak, obowiązkowo.** Repozytorium jest źródłem prawdy: historia zmian, PR-y, przegląd kodu (tak jak teraz robimy), automatyczne buildy i testy (GitHub Actions – 2 000 min/mies. gratis dla repo prywatnych), automatyczny deploy na Cloudflare Pages po każdym `merge` do `main`, Dependabot (aktualizacje bezpieczeństwa). Claude Code, Cursor, VS Code – wszystkie pracują na GitHubie. Rekomendacja: osobne repozytorium `dogpilot` (dziś aplikacja mieszka w `qamitech/app`).

**Replit – wygodny edytor, nie miejsce na produkt.** Plusy: środowisko w przeglądarce bez instalacji, szybki podgląd, agent AI. Minusy: hosting „always-on” jest płatny (Core/Teams), aplikacja i baza są związane z platformą (trudniejsza przeprowadzka), brak budowania aplikacji natywnych iOS/Android, słabsze CI i przegląd kodu. Jeśli chcesz kodować z telefonu czy innego komputera – Replit może być **edytorem podpiętym do repozytorium GitHub** (import z GitHuba, push z powrotem), ale deploy robimy z GitHuba na Cloudflare, a dane trzymamy w Supabase.

Rekomendowany zestaw: **GitHub (kod, CI) + Claude Code / VS Code (edycja) + Cloudflare Pages (front) + Supabase (backend) + Capacitor (sklepy)**.

---

## 5. Architektura docelowa

```
telefon / przeglądarka
  └─ Dogpilot (React + TS, PWA; w sklepach jako Capacitor)
       ├─ lokalna baza IndexedDB (działa offline, start natychmiast)
       ├─ TanStack Query + kolejka synchronizacji ──► Supabase (Postgres + RLS)
       ├─ Supabase Auth (e-mail, Google, Apple)
       ├─ Supabase Storage / Cloudflare R2 (zdjęcia, PDF)
       └─ push: web push (PWA) / FCM + APNs (Capacitor)
Supabase Edge Functions (cron): terminarz ZKwP, przypomnienia, PDF, e-maile (Resend)
Cloudflare Pages: hosting front-endu, własna domena, SSL, CDN
GitHub Actions: lint, typecheck, testy, build, deploy, buildy Capacitor
```

Model danych bierzemy wprost z `app/src/app/types.ts` (Dog, Heat, Breeding, Pregnancy, Litter, Puppy, Weight, HealthRecord, Show, Championship, Expense, Income, Reminder, Member, Profile) → tabele Postgres z kolumną `kennel_id` i politykami RLS.

---

## 6. Plan działania – fazy

### Faza 0 – decyzje i konta (1 tydzień)
- [ ] Sprawdzenie znaku towarowego „Dogpilot” (UPRP/EUIPO) – kolizje: dogpilot.app (szkoły tresury), dogpilot.fr; decyzja o nazwie i domenie.
- [ ] Konta: GitHub (repo `dogpilot`), Supabase (projekt EU), Cloudflare, Google Play Console, Apple Developer, Resend (e-maile), Sentry (błędy), Plausible/Umami (statystyki bez ciasteczek).
- [ ] Repozytorium: wydzielenie `app/` do `dogpilot`, CI (lint + tsc + build + smoke test Playwright), ochrona gałęzi `main`.
- [ ] Dokumenty RODO: polityka prywatności, regulamin, umowa powierzenia (DPA Supabase), rejestr czynności.

### Faza 1 – fundament backendu (2–3 tygodnie)
- [ ] Schemat bazy z `types.ts`, migracje (`supabase/migrations`), polityki RLS per hodowla i rola (właściciel, współwłaściciel, podgląd).
- [ ] Auth: e-mail + Google (+ Apple przy wejściu do App Store); ekran powitalny i logowanie z prototypu podpinamy do prawdziwego logowania.
- [ ] Warstwa danych w aplikacji: `store.tsx` → repozytoria (TanStack Query) z lokalną kopią w IndexedDB i kolejką zmian offline; **import danych z localStorage** dla obecnych użytkowników prototypu.
- [ ] Storage zdjęć i logo (upload z kompresją – już jest – + miniatury).

### Faza 2 – moduły na prawdziwych danych (3–4 tygodnie)
Kolejność według wartości dla hodowcy: Psy i zdrowie → Mioty i szczenięta (wagi, odchów, karta przekazania z QR) → Rozród i ciąża → Finanse → Wystawy (Edge Function pobierająca terminarz ZKwP raz dziennie) → Raporty i dokumenty PDF (generowane na serwerze, zapis w Storage) → Powiadomienia (tabela terminów + cron + push) → Zespół hodowli → Strona dla nabywcy (publiczny odczyt przez token).

### Faza 3 – PWA i sklepy (2 tygodnie)
- [ ] `vite-plugin-pwa`: manifest, ikony (są w `public/brand`), service worker, ekran „zainstaluj”.
- [ ] Capacitor: projekty Android/iOS, wtyczki (aparat, udostępnianie, push, splash – mamy intro), podpisy, buildy w GitHub Actions.
- [ ] Wpisy w sklepach: zrzuty ekranu (mamy makiety PL/EN, jasne/ciemne), opisy, polityka prywatności, formularz danych (Data safety / App Privacy).

### Faza 4 – beta zamknięta (3–4 tygodnie)
- [ ] 10–20 hodowli (różne rasy, w tym jedna z zespołem) – Google Play „testy wewnętrzne”, TestFlight, link web.
- [ ] Sentry + Plausible od pierwszego dnia; cotygodniowe rozmowy z testerami; lista błędów i życzeń w GitHub Issues.
- [ ] Test wydajności na tanim Androidzie (np. 4 GB RAM) i słabym łączu.

### Faza 5 – premiera (1–2 tygodnie)
- [ ] Supabase Pro, kopie zapasowe (PITR), alerty.
- [ ] Płatności PRO: w sklepach – RevenueCat (Google Play Billing / App Store); w web – Stripe lub Przelewy24; cena z analizy (89 zł/rok lub 12,99 zł/mies.).
- [ ] Strona produktu (qamitech.pl/dogpilot), onboarding e-mail, FAQ, kanał zgłoszeń.
- [ ] Angielska wersja: obecna warstwa tłumaczenia zamieniana stopniowo na pliki językowe (ten sam słownik), start w UK/IE/DE po polskiej premierze.

**Razem: ok. 12–14 tygodni do premiery przy jednej osobie kodującej z Claude Code, z czego beta zaczyna się po ~8 tygodniach.**

---

## 7. Co robimy w pierwszym tygodniu (konkretnie)
1. Zakładasz konta: GitHub (jeśli repo ma być osobne), Supabase (projekt `dogpilot`, region Frankfurt), Cloudflare (dodanie domeny).
2. Ja: wydzielam `app/` do nowego repozytorium, dodaję CI, przygotowuję schemat bazy i migracje z `types.ts`, podpinam Auth i pierwszy moduł (Psy) do Supabase, zostawiając tryb „dane lokalne” jako działający fallback.
3. Pierwszy deploy na Cloudflare Pages z GitHuba – od tego momentu każda zmiana w `main` jest dostępna pod adresem testowym w ~1 minutę.

## 8. Ryzyka i jak je ograniczamy
| Ryzyko | Ograniczenie |
|---|---|
| Usypianie darmowego Supabase w czasie budowy | cron „ping” raz dziennie (GitHub Actions) albo od razu Pro (25 USD) |
| Zdjęcia rozsadzają koszty | limity w planie FREE (już są), kompresja, R2 |
| Odrzucenie w App Store (cienka powłoka web) | natywne elementy: push, aparat, udostępnianie, logowanie Apple, brak „linków do zakupów poza sklepem” |
| Terminarz ZKwP zmieni format strony | parser z testami + alert w Sentry; ręczny import CSV jako koło zapasowe |
| Nazwa „Dogpilot” | weryfikacja znaku przed wydaniem w sklepach; lista nazw zapasowych w analizie (sekcja 18) |

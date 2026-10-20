import { addDays, daysBetween } from './format';

export interface PregnancyWeek { week: number; title: string; days: string; development: string; female: string; tips: string }

export const PREGNANCY_WEEKS: PregnancyWeek[] = [
  { week: 1, title: 'Start ciąży', days: 'Dni 1–7', development: 'Po kryciu plemniki docierają do jajowodów; zapłodnienie może nastąpić kilka dni po kryciu. Rozpoczyna się rozwój zarodków.', female: 'Suka zachowuje się jak zwykle. Zmiany apetytu lub zachowania nie potwierdzają ciąży.', tips: 'Zapisz daty wszystkich kryć i wyniki progesteronu – ułatwi to późniejsze wyznaczenie terminu porodu.' },
  { week: 2, title: 'Droga do macicy', days: 'Dni 8–14', development: 'Zarodki przemieszczają się do macicy; trwa intensywny podział komórkowy.', female: 'Brak pewnych objawów zewnętrznych. Normalna aktywność.', tips: 'Nie zmieniaj jeszcze diety ani aktywności, jeśli lekarz nie zaleci inaczej.' },
  { week: 3, title: 'Implantacja', days: 'Dni 15–21', development: 'Zarodki zagnieżdżają się w ścianie macicy. Powstają zawiązki łożysk.', female: 'U części suk większa senność, zmiana apetytu lub lekkie nudności.', tips: 'Zaplanuj USG na 25.–30. dzień od pierwszego krycia.' },
  { week: 4, title: 'Czas na USG', days: 'Dni 22–28', development: 'Rozwijają się narządy wewnętrzne, kręgosłup i głowa. Pod koniec tygodnia USG może potwierdzić ciążę.', female: 'Możliwe powiększenie sutków i delikatna śluzowa wydzielina.', tips: 'Wykonaj USG. Pamiętaj, że USG nie określa dokładnie liczby szczeniąt.' },
  { week: 5, title: 'Szczenięta nabierają kształtu', days: 'Dni 29–35', development: 'Płody nabierają kształtu psa: wyraźne łapy, pazury, zarysy wąsów. Zaczyna kształtować się płeć.', female: 'Brzuch może zacząć się powiększać; rośnie apetyt.', tips: 'Omów z lekarzem żywienie w drugiej połowie ciąży. Unikaj suplementów „na wszelki wypadek”.' },
  { week: 6, title: 'Rosnący brzuszek', days: 'Dni 36–42', development: 'Płody rosną intensywnie, kształtuje się umaszczenie. Kości zaczynają się mineralizować.', female: 'Powiększony brzuch, częstsze i mniejsze posiłki są wygodniejsze.', tips: 'Stopniowo zwiększaj kaloryczność diety. Przygotuj miejsce porodowe.' },
  { week: 7, title: 'Kościec widoczny na RTG', days: 'Dni 43–49', development: 'Szkielety płodów stają się widoczne na RTG (ok. 45. dnia). Szczenięta są dobrze rozwinięte.', female: 'Suka szybciej się męczy, więcej odpoczywa. Możliwe wyciekanie siary.', tips: 'Zaplanuj RTG (najdokładniejsze po 55. dniu) do oceny liczby szczeniąt. Przygotuj kojec, podkłady, wagę.' },
  { week: 8, title: 'Porodówka gotowa', days: 'Dni 50–56', development: 'Płody kończą rozwój; pojawia się sierść. Szczenięta wyczuwalne w brzuchu.', female: 'Suka może szukać miejsca na gniazdo, mniej jeść, być niespokojna.', tips: 'Przygotuj kontakt do lekarza i lecznicy całodobowej. Zacznij mierzyć temperaturę 2× dziennie.' },
  { week: 9, title: 'Odliczanie do porodu', days: 'Dni 57–68', development: 'Szczenięta kończą rozwój i przygotowują się do narodzin. Od ok. 58. dnia poród może rozpocząć się w fizjologicznym przedziale.', female: 'Niepokój, szukanie gniazda, dyszenie, odmawianie jedzenia. Spadek temperatury ciała ok. 8–24 h przed porodem.', tips: 'Możesz stopniowo wprowadzać mniejsze, częstsze posiłki. Kontroluj masę ciała, ale unikaj przekarmiania. Przy niepokojących objawach kontaktuj się z lekarzem weterynarii.' },
];

export interface PregnancyInfo {
  matingDate: string;
  day: number;
  week: number;
  expected: string;
  usgFrom: string; usgTo: string;
  rtgFrom: string;
  observeFrom: string;
  birthFrom: string; birthTo: string;
  progress: number;
  remaining: number;
  timeline: { title: string; desc: string; date: string; day: number }[];
}

export function pregnancyInfo(matingDate: string, todayStr = new Date().toISOString().slice(0, 10)): PregnancyInfo {
  const day = daysBetween(matingDate, todayStr) + 1;
  const week = Math.min(9, Math.max(1, Math.ceil(day / 7)));
  const expected = addDays(matingDate, 62);
  return {
    matingDate, day, week, expected,
    usgFrom: addDays(matingDate, 24), usgTo: addDays(matingDate, 29),
    rtgFrom: addDays(matingDate, 44),
    observeFrom: addDays(matingDate, 57),
    birthFrom: addDays(matingDate, 57), birthTo: addDays(matingDate, 67),
    progress: Math.min(100, Math.max(0, (day / 63) * 100)),
    remaining: 63 - day,
    timeline: [
      { title: 'Krycie', desc: 'Pierwsze krycie', date: matingDate, day: 1 },
      { title: 'USG', desc: 'Potwierdzenie ciąży', date: addDays(matingDate, 24), day: 25 },
      { title: 'RTG', desc: 'Liczenie szczeniąt', date: addDays(matingDate, 44), day: 45 },
      { title: 'Czas czuwania', desc: 'Poród może rozpocząć się w fizjologicznym terminie', date: addDays(matingDate, 57), day: 58 },
      { title: 'Spodziewany poród', desc: 'Około 63. dnia od pierwszego krycia', date: addDays(matingDate, 62), day: 63 },
    ],
  };
}

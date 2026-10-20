export type Sex = 'male' | 'female';
export type Module = 'owner' | 'breeder';
export type Plan = 'free' | 'pro';

export interface Dog {
  id: string;
  name: string; // imię domowe
  pedigreeName: string;
  breed: string;
  sex: Sex;
  birthDate: string;
  color?: string;
  weightKg?: number;
  neutered?: boolean;
  fatherName?: string;
  motherName?: string;
  pedigreeNo?: string;
  regNo?: string;
  chip?: string;
  kennelName?: string;
  photo?: string;
  gallery?: string[]; // galeria zdjęć psa, maks. GALLERY_MAX (data URL)
  notes?: string;
  pawId?: string;
  fatherId?: string;
  motherId?: string;
  createdAt: string;
}

export interface Heat {
  id: string;
  dogId: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  dogId?: string;
  litterId?: string;
  puppyId?: string;
}

export interface BirthEvent {
  id: string;
  time: string;
  kind: 'start' | 'puppy' | 'note' | 'vet' | 'end';
  puppyName?: string;
  note?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'invited';
}

export type HealthKind = 'vaccination' | 'deworming' | 'parasite' | 'procedure' | 'exam';
export const HEALTH_LABEL: Record<HealthKind, string> = {
  vaccination: 'Szczepienie',
  deworming: 'Odrobaczenie',
  parasite: 'Ochrona przed pasożytami',
  procedure: 'Leczenie i zabiegi',
  exam: 'Badanie',
};

export interface HealthRecord {
  id: string;
  dogId?: string;
  puppyId?: string;
  kind: HealthKind;
  date: string;
  name: string;
  nextDate?: string;
  vet?: string;
  result?: string;
  notes?: string;
}

export interface MatingEvent { date: string; type: 'natural' | 'insemination'; tie?: boolean }
export interface DatedValue { date: string; value: string }

export interface Breeding {
  id: string;
  femaleId: string;
  maleId?: string;
  maleName: string;
  maleKennel?: string;
  heatStartDate?: string;
  matings: MatingEvent[];
  usg: DatedValue[];
  progesterone: DatedValue[];
  rtg: DatedValue[];
  litterId?: string;
  notes?: string;
}

export interface StudMating {
  id: string;
  maleId: string;
  femaleName: string;
  ownerFirst: string;
  ownerLast: string;
  place: 'kennel' | 'external';
  type: 'natural' | 'insemination';
  tie?: boolean;
  dates: string[];
  puppiesCount?: number;
  notes?: string;
}

export interface LitterPack {
  foodBrand?: string;
  foodName?: string;
  portion?: string;
  mealsPerDay?: number;
  feedingHours?: string;
  supplements?: string;
  grooming?: string;
  firstDays?: string;
  accustomed: string[];
}

export interface Litter {
  id: string;
  name: string;
  motherId?: string;
  motherName: string;
  fatherId?: string;
  fatherName: string;
  birthDate: string;
  breedingId?: string;
  breed?: string;
  letter?: string; // litera miotu
  regNo?: string; // nr zgłoszenia / rejestracji miotu
  reviewDate?: string; // data przeglądu miotu
  notes: string[];
  checklist: Record<string, boolean>;
  pack: LitterPack;
  birthDiary: BirthEvent[];
  createdAt: string;
}

export interface PuppyOwner {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface Puppy {
  id: string;
  litterId: string;
  name: string;
  sex: Sex;
  birthDateTime: string;
  color?: string;
  birthWeightG?: number;
  birthStatus: 'alive' | 'stillborn' | 'died';
  markerColor: string;
  photo?: string; // data URL (JPEG, max 640 px)
  pedigreeNo?: string;
  chip?: string;
  pawId: string;
  price?: number;
  privateNotes?: string;
  owners: PuppyOwner[];
  handoverDate?: string;
  character: string[];
  aboutText?: string;
}

export interface Weight {
  id: string;
  dogId?: string;
  puppyId?: string;
  date: string; // ISO datetime
  grams: number;
}

export interface Show {
  id: string;
  dogId: string;
  country: string;
  city: string;
  rank: string;
  date: string;
  dogClass: string;
  catalogNo?: string;
  place?: string;
  grade?: string;
  judge?: string;
  titles?: string;
  certificates?: string;
  notes?: string;
}

export interface Championship {
  id: string;
  dogId: string;
  country: string;
  title: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  scope: 'kennel' | 'show';
  category: string;
  type?: string;
  description?: string;
  dogId?: string;
  showId?: string;
  litterId?: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  dogId?: string;
  done: boolean;
  notes?: string;
}

export interface Profile {
  module: Module;
  plan: Plan;
  kennelName: string;
  kennelNo?: string;
  breederName: string;
  email?: string;
  onboarded: boolean;
  darkMode?: boolean; // wynikowy tryb (dla zgodności); źródłem prawdy jest `theme`
  theme?: 'light' | 'dark' | 'system';
  logo?: string; // logo hodowli (data URL)
  authProvider?: 'email' | 'google'; // prototyp: logowanie symulowane
  plannedShows?: string[]; // id wystaw z kalendarza ZKwP, na które hodowca planuje start
  language?: 'pl' | 'en';
  currency?: Currency;
  notify?: NotifySettings;
  dismissedNotifications?: string[];
  social?: SocialSettings;
  lastCloudBackup?: string;
  autoBackup?: boolean;
}

export type Currency = 'PLN' | 'EUR' | 'USD';
export type NotifKind = 'vaccination' | 'exam' | 'procedure' | 'prevention' | 'heat' | 'pregnancy' | 'show' | 'general';
export const NOTIF_LABEL: Record<NotifKind, string> = { vaccination: 'Szczepienia', exam: 'Badania', procedure: 'Zabiegi', prevention: 'Profilaktyka (odrobaczanie, pasożyty)', heat: 'Cieczki', pregnancy: 'Ciąża i poród', show: 'Wystawy', general: 'Przypomnienia ogólne' };
export interface NotifySettings {
  widget: boolean;           // sekcja z terminami na Starcie
  homeCount: number;         // ile pozycji pokazywać na Starcie
  lead: Record<NotifKind, number>; // z ilu dni wyprzedzeniem pokazywać dany typ
  off: NotifKind[];          // wyłączone typy
  push: boolean;             // powiadomienia systemowe (przeglądarka / telefon)
  pushHour: number;          // o której godzinie dzienne podsumowanie
  emailDigest: 'off' | 'daily' | 'weekly';
}
export const DEFAULT_NOTIFY: NotifySettings = {
  widget: true, homeCount: 3, off: [], push: false, pushHour: 8, emailDigest: 'weekly',
  lead: { vaccination: 14, exam: 7, procedure: 7, prevention: 7, heat: 21, pregnancy: 7, show: 30, general: 3 },
};
export interface SocialAccount { connected: boolean; name: string; url?: string; connectedAt?: string }
export interface SocialPost { id: string; date: string; text: string; networks: ('facebook' | 'instagram')[]; kind: string }
export interface SocialSettings {
  facebook?: SocialAccount;
  instagram?: SocialAccount;
  showOnPortal?: boolean;    // linki do profili na stronie dla nabywcy
  posts?: SocialPost[];
}

export interface AppState {
  profile: Profile;
  dogs: Dog[];
  health: HealthRecord[];
  breedings: Breeding[];
  studMatings: StudMating[];
  litters: Litter[];
  puppies: Puppy[];
  weights: Weight[];
  shows: Show[];
  championships: Championship[];
  expenses: Expense[];
  reminders: Reminder[];
  heats: Heat[];
  incomes: Income[];
  members: Member[];
}

export const INCOME_CATEGORIES = ['Sprzedaż szczenięcia', 'Zaliczka za szczenię', 'Krycie (opłata)', 'Nagroda / wystawa', 'Inne'];
export const HEAT_DEFAULT_INTERVAL_DAYS = 180;
export const GALLERY_MAX = 6;

export const FREE_LIMITS = { females: 2, males: 2, shows: 5, championships: 6, chartMonths: 4 };

export const EXPENSE_CATEGORIES: Record<string, string[]> = {
  'Żywienie': ['Karma sucha', 'Karma mokra', 'Przysmaki', 'Inne'],
  'Suplementy i witaminy': ['Witaminy', 'Suplementy na stawy', 'Inne'],
  'Pielęgnacja': ['Kosmetyki', 'Groomer', 'Inne'],
  'Weterynarz': ['Szczepienie', 'Odrobaczenie', 'Badanie', 'Zabieg', 'Wizyta kontrolna', 'Inne'],
  'Wyposażenie': ['Smycz/obroża', 'Legowisko', 'Zabawki', 'Klatka', 'Inne'],
  'Opłaty i składki': ['Składka klubowa', 'Rodowody', 'Rejestracja', 'Inne'],
  'Rozród i miot': ['Krycie', 'Inseminacja', 'USG/RTG', 'Akcesoria dla szczeniąt', 'Chipowanie', 'Inne'],
  'Inne': ['Inne'],
};
export const SHOW_EXPENSE_TYPES = ['Zgłoszenia psów', 'Paliwo / dojazd', 'Nocleg', 'Wyżywienie na miejscu', 'Handler', 'Inne'];
export const SHOW_RANKS = ['Wystawa Krajowa', 'Wystawa Międzynarodowa', 'Wystawa Klubowa', 'Wystawa Championów', 'Wystawa Europejska', 'Wystawa Światowa'];
export const SHOW_CLASSES = ['Klasa baby', 'Klasa szczeniąt', 'Klasa młodzieży', 'Klasa pośrednia', 'Klasa otwarta', 'Klasa użytkowa', 'Klasa championów', 'Klasa weteranów'];
export const SHOW_GRADES = ['Doskonała', 'Bardzo dobra', 'Dobra', 'Dostateczna', 'Wybitnie obiecujący', 'Obiecujący', 'Dyskwalifikacja'];
export const SHOW_TITLES = ['BOB', 'BOS', 'BOG', 'BIS', 'Zwycięzca Młodzieży', 'Zwycięzca Rasy', 'Najlepszy Junior', 'Najlepsze Baby', 'Najlepsze Szczenię', 'Najlepszy Weteran'];
export const SHOW_CERTS = ['CWC', 'Res. CWC', 'CACIB', 'Res. CACIB', 'CAJC', 'CAC', 'Res. CAC'];
export const CHARACTER_TAGS = ['Spokojna dusza', 'Wulkan energii', 'Odkrywca', 'Śmiałek', 'Rozważny', 'Dusza towarzystwa', 'Pieszczoch', 'Indywidualista', 'Czuły', 'Lider', 'Psotnik', 'Smakosz', 'Przylepa', 'Bystrzak'];
export const ACCUSTOMED_ITEMS = ['Dzieci', 'Psy', 'Koty', 'Kojec i transporter', 'Podróże autem', 'Chwile w samotności', 'Obroża i smycz', 'Szczotka i kąpiel', 'Odkurzacz i dźwięki domu'];
export const MARKER_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#f59e0b', '#7c3aed', '#0891b2', '#ec4899', '#111827', '#f97316', '#84cc16'];
export const COUNTRIES = ['Polska', 'Niemcy', 'Czechy', 'Słowacja', 'Litwa', 'Łotwa', 'Estonia', 'Ukraina', 'Węgry', 'Rumunia', 'Austria', 'Włochy', 'Francja', 'Hiszpania', 'Holandia', 'Belgia', 'Dania', 'Szwecja', 'Norwegia', 'Finlandia', 'Wielka Brytania', 'Irlandia', 'Chorwacja', 'Słowenia', 'Serbia', 'Inny'];

export const LITTER_CHECKLIST: { group: string; items: { key: string; title: string; desc: string }[] }[] = [
  { group: 'Zdrowie szczeniąt', items: [
    { key: 'deworm1', title: 'Odrobaczanie – dawka 1', desc: 'Około 2. tygodnia życia, preparat dobrany z weterynarzem.' },
    { key: 'deworm2', title: 'Odrobaczanie – dawka 2', desc: 'Kolejna dawka po około dwóch tygodniach.' },
    { key: 'deworm3', title: 'Odrobaczanie – dawka 3', desc: 'Ostatnia dawka przed wydaniem szczeniąt.' },
    { key: 'vacc1', title: 'Szczepienie podstawowe', desc: 'Pierwsza szczepionka według zaleceń lekarza.' },
    { key: 'vacc2', title: 'Szczepienie przypominające', desc: 'Druga dawka szczepienia.' },
    { key: 'vacc3', title: 'Szczepienie przed odbiorem', desc: 'Ostatnie szczepienie przed przekazaniem do nowego domu.' },
    { key: 'vet', title: 'Kontrola poporodowa', desc: 'Lekarz ogląda sukę i wszystkie szczenięta.' },
  ]},
  { group: 'Papiery i formalności', items: [
    { key: 'chip', title: 'Mikroczipy wszczepione', desc: 'Numery czipów wpisane do profili szczeniąt.' },
    { key: 'review', title: 'Przegląd miotu w związku', desc: 'Wizyta kierownika sekcji lub przedstawiciela oddziału.' },
    { key: 'pedigrees', title: 'Dokumenty miotu złożone', desc: 'Wniosek o metryki i rodowody wysłany do oddziału.' },
    { key: 'contracts', title: 'Umowy gotowe do podpisu', desc: 'Umowa sprzedaży dla każdego szczenięcia (zakładka Dokumenty).' },
  ]},
  { group: 'Rozwój i nowy dom', items: [
    { key: 'bw', title: 'Pierwsze ważenie', desc: 'Waga każdego szczenięcia zaraz po porodzie.' },
    { key: 'solid', title: 'Pierwsza papka', desc: 'Start dokarmiania, zwykle w 3.–4. tygodniu.' },
    { key: 'wean', title: 'Samodzielne jedzenie', desc: 'Szczenięta jedzą już tylko pokarm stały.' },
    { key: 'social', title: 'Oswajanie ze światem', desc: 'Nowe dźwięki, ludzie, podłoża i krótkie wyjścia.' },
    { key: 'photos', title: 'Sesja zdjęciowa', desc: 'Zdjęcia do ogłoszeń i strony dla nabywców.' },
    { key: 'portal', title: 'Strony dla nabywców udostępnione', desc: 'Każdy nabywca dostał link do strony swojego szczenięcia.' },
    { key: 'pack', title: 'Pakiet na nowy dom gotowy', desc: 'Żywienie, pielęgnacja i opis każdego szczenięcia uzupełnione.' },
    { key: 'handover', title: 'Odbiory zakończone', desc: 'Wszystkie szczenięta są już w nowych domach.' },
  ]},
];

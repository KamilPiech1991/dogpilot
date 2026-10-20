import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, FileSignature, ClipboardCheck, ListChecks, Printer, HeartPulse } from 'lucide-react';
import { useStore } from '../app/store';
import { Card, Empty, Field, PageHeader } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { FileText as ArtIcon } from 'lucide-react';
import { fmtDate, fmtDateLong, fmtDateTime, fmtMoney, today } from '../app/format';
import { HEALTH_LABEL } from '../app/types';

const DOCS = [
  { kind: 'umowa', title: 'Umowa sprzedaży szczenięcia', desc: 'Dane stron, szczenię, cena, zaliczka, zobowiązania', ico: <FileSignature size={24} /> },
  { kind: 'protokol', title: 'Protokół przekazania szczenięcia', desc: 'Stan zdrowia, dokumenty, pakiet na nowy dom, podpisy', ico: <ClipboardCheck size={24} /> },
  { kind: 'karta-miotu', title: 'Karta miotu', desc: 'Zestawienie miotu do dokumentacji oddziałowej', ico: <ListChecks size={24} /> },
  { kind: 'karta-zdrowia', title: 'Karta zdrowia szczenięcia', desc: 'Szczepienia, odrobaczenia, wagi – dla nowego właściciela', ico: <HeartPulse size={24} /> },
];

export default function Documents() {
  const { kind } = useParams();
  const nav = useNavigate();
  const { state } = useStore();
  const [puppyId, setPuppyId] = useState(state.puppies[0]?.id ?? '');
  const [litterId, setLitterId] = useState(state.litters[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [place, setPlace] = useState('');
  if (!kind) {
    return (
      <div className="stack">
        <ArtHeader compact tone="lilac" icon={<ArtIcon size={24} />} title="Dokumenty" sub="Gotowe wzory wypełniane danymi z aplikacji. Drukuj lub zapisz jako PDF." />
        <div className="grid cols-2">{DOCS.map(d => <Card key={d.kind} onClick={() => nav(`/dokumenty/${d.kind}`)}><div className="tile" style={{ border: 0, padding: 0, minHeight: 0, cursor: 'pointer' }}><div className="ico">{d.ico}</div><b>{d.title}</b><div className="muted">{d.desc}</div></div></Card>)}</div>
        <Card className="soft"><small>Wzory mają charakter pomocniczy i nie zastępują porady prawnej. Dostosuj zapisy do własnej hodowli i wymogów klubu.</small></Card>
      </div>
    );
  }
  const def = DOCS.find(d => d.kind === kind);
  if (!def) return <Card><Empty>Nieznany dokument.</Empty></Card>;
  const puppy = state.puppies.find(p => p.id === puppyId);
  const litterOfPuppy = state.litters.find(l => l.id === puppy?.litterId);
  const litter = kind === 'karta-miotu' ? state.litters.find(l => l.id === litterId) : litterOfPuppy;
  const mother = state.dogs.find(d => d.id === litter?.motherId);
  const owner = puppy?.owners[0];
  const kennel = state.profile;
  const priceVal = price ? Number(price) : puppy?.price ?? 0;
  const depositVal = deposit ? Number(deposit) : 0;
  const needsPuppy = kind !== 'karta-miotu';

  return (
    <div>
      <PageHeader back={() => nav('/dokumenty')} title={def.title} actions={<button className="btn" onClick={() => window.print()}><Printer size={16} /> Drukuj / PDF</button>} />
      <Card className="no-print" title="Dane dokumentu" icon={<FileText size={18} />}>
        <div className="form-grid">
          {needsPuppy ? <Field label="Szczenię"><select value={puppyId} onChange={e => setPuppyId(e.target.value)}>{state.puppies.map(p => <option key={p.id} value={p.id}>{p.name} ({state.litters.find(l => l.id === p.litterId)?.name})</option>)}</select></Field>
            : <Field label="Miot"><select value={litterId} onChange={e => setLitterId(e.target.value)}>{state.litters.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>}
          <Field label="Miejscowość"><input value={place} onChange={e => setPlace(e.target.value)} placeholder="np. Marki" /></Field>
          {kind === 'umowa' && <><Field label="Cena (PLN)"><input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder={String(puppy?.price ?? '')} /></Field><Field label="Zaliczka (PLN)"><input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} /></Field></>}
        </div>
        {needsPuppy && !owner && <div className="badge warn">Brak danych nabywcy – uzupełnij właściciela w profilu szczenięcia.</div>}
      </Card>

      <Card>
        <div style={{ fontFamily: 'Georgia, serif', lineHeight: 1.6, fontSize: 14 }}>
          <div className="row between" style={{ marginBottom: 16 }}><div className="row" style={{ gap: 12 }}>{kennel.logo && <img className="kennel-logo lg" src={kennel.logo} alt="" />}<div><b style={{ fontSize: 16 }}>{kennel.kennelName}</b><div className="muted">{kennel.breederName}{kennel.kennelNo ? ` · nr hodowli ${kennel.kennelNo}` : ''}{kennel.email ? ` · ${kennel.email}` : ''}</div></div></div><div className="muted" style={{ textAlign: 'right' }}>{place || '[MIEJSCOWOŚĆ]'}, {fmtDateLong(today())}</div></div>
          <h2 style={{ textAlign: 'center', textTransform: 'uppercase', fontSize: 18, margin: '14px 0' }}>{def.title}</h2>

          {kind === 'umowa' && puppy && (
            <div>
              <p><b>Zawarta pomiędzy:</b> {kennel.breederName}, prowadzącym hodowlę {kennel.kennelName} (dalej „Hodowca”), a {owner?.name ?? '[IMIĘ I NAZWISKO NABYWCY]'}, zam. {owner?.address ?? '[ADRES]'}, tel. {owner?.phone ?? '[TELEFON]'}, e-mail {owner?.email ?? '[E-MAIL]'} (dalej „Nabywca”).</p>
              <p><b>§1.</b> Przedmiotem umowy jest szczenię rasy {mother?.breed ?? '[RASA]'}, {puppy.sex === 'male' ? 'pies' : 'suka'}, imię {puppy.name}, ur. {fmtDateTime(puppy.birthDateTime)}, umaszczenie {puppy.color ?? '[UMASZCZENIE]'}, nr chipa {puppy.chip ?? '[NR CHIPA]'}, nr metryki/rodowodu {puppy.pedigreeNo ?? '[NR]'}, po ojcu {litter?.fatherName} i matce {litter?.motherName}.</p>
              <p><b>§2.</b> Cena sprzedaży wynosi <b>{fmtMoney(priceVal)}</b>{depositVal ? <>, z czego zaliczka <b>{fmtMoney(depositVal)}</b> została wpłacona, a pozostała kwota <b>{fmtMoney(priceVal - depositVal)}</b> płatna jest przy odbiorze</> : ', płatna przy odbiorze'}. Odbiór szczenięcia nastąpi {puppy.handoverDate ? fmtDateLong(puppy.handoverDate) : '[DATA ODBIORU]'}.</p>
              <p><b>§3.</b> Hodowca oświadcza, że szczenię w dniu wydania jest zdrowe, odrobaczone i zaszczepione zgodnie z kartą zdrowia stanowiącą załącznik, posiada metrykę oraz jest oznakowane mikroczipem.</p>
              <p><b>§4.</b> Nabywca zobowiązuje się zapewnić szczenięciu właściwe warunki, opiekę weterynaryjną oraz nie przekazywać go osobom trzecim bez wiedzy Hodowcy. W razie niemożności dalszego utrzymania psa Nabywca w pierwszej kolejności poinformuje Hodowcę.</p>
              <p><b>§5.</b> Hodowca przekazuje wraz ze szczenięciem pakiet na nowy dom (żywienie, pielęgnacja, przyzwyczajenia) oraz kartę przekazania.</p>
              <p><b>§6.</b> W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.</p>
            </div>
          )}

          {kind === 'protokol' && puppy && (
            <div>
              <p>W dniu {puppy.handoverDate ? fmtDateLong(puppy.handoverDate) : fmtDateLong(today())} Hodowca {kennel.breederName} ({kennel.kennelName}) przekazał, a Nabywca {owner?.name ?? '[NABYWCA]'} odebrał szczenię <b>{puppy.name}</b> ({mother?.breed}, {puppy.sex === 'male' ? 'pies' : 'suka'}, ur. {fmtDate(puppy.birthDateTime)}, chip {puppy.chip ?? '—'}).</p>
              <table className="tbl" style={{ margin: '10px 0' }}><tbody>
                <tr><th style={{ width: '40%' }}>Stan zdrowia w dniu przekazania</th><td>bez zastrzeżeń ☐ · uwagi: ____________________</td></tr>
                <tr><th>Ostatnia waga</th><td>{state.weights.filter(w => w.puppyId === puppy.id).sort((a, b) => b.date.localeCompare(a.date))[0]?.grams ?? '—'} g</td></tr>
                <tr><th>Szczepienia</th><td>{state.health.filter(h => h.puppyId === puppy.id && h.kind === 'vaccination').map(h => `${h.name} (${fmtDate(h.date)})`).join(', ') || '—'}</td></tr>
                <tr><th>Odrobaczenia</th><td>{state.health.filter(h => h.puppyId === puppy.id && (h.kind === 'deworming' || h.kind === 'parasite')).map(h => `${h.name} (${fmtDate(h.date)})`).join(', ') || '—'}</td></tr>
                <tr><th>Przekazane dokumenty</th><td>metryka ☐ · książeczka zdrowia ☐ · umowa ☐ · karta przekazania ☐</td></tr>
                <tr><th>Pakiet na nowy dom</th><td>karma {[litter?.pack.foodBrand, litter?.pack.foodName].filter(Boolean).join(' ') || '—'} ☐ · kocyk ☐ · zabawka ☐ · pakiet na nowy dom ☐</td></tr>
              </tbody></table>
              <p>Nabywca potwierdza odbiór szczenięcia w stanie opisanym powyżej.</p>
            </div>
          )}

          {kind === 'karta-miotu' && litter && (
            <div>
              <table className="tbl" style={{ marginBottom: 12 }}><tbody>
                <tr><th style={{ width: '35%' }}>Oznaczenie miotu</th><td>{litter.name}</td></tr>
                <tr><th>Data urodzenia</th><td>{fmtDateLong(litter.birthDate)}</td></tr>
                <tr><th>Matka</th><td>{litter.motherName}{mother?.pedigreeNo ? ` · rodowód ${mother.pedigreeNo}` : ''}{mother?.chip ? ` · chip ${mother.chip}` : ''}</td></tr>
                <tr><th>Ojciec</th><td>{litter.fatherName}</td></tr>
                <tr><th>Liczba szczeniąt</th><td>{state.puppies.filter(p => p.litterId === litter.id).length} (psów: {state.puppies.filter(p => p.litterId === litter.id && p.sex === 'male').length}, suk: {state.puppies.filter(p => p.litterId === litter.id && p.sex === 'female').length})</td></tr>
              </tbody></table>
              <table className="tbl"><thead><tr><th>#</th><th>Imię</th><th>Płeć</th><th>Godzina ur.</th><th>Umaszczenie</th><th>Waga ur.</th><th>Chip</th><th>Nabywca</th></tr></thead><tbody>
                {state.puppies.filter(p => p.litterId === litter.id).map((p, i) => <tr key={p.id}><td>{i + 1}</td><td>{p.name}</td><td>{p.sex === 'male' ? 'pies' : 'suka'}</td><td>{p.birthDateTime.slice(11, 16)}</td><td>{p.color ?? ''}</td><td>{p.birthWeightG ?? ''} g</td><td>{p.chip ?? ''}</td><td>{p.owners[0]?.name ?? ''}</td></tr>)}
              </tbody></table>
              {litter.birthDiary.length > 0 && <p style={{ marginTop: 10 }}><b>Przebieg porodu:</b> {litter.birthDiary.map(e => `${e.time.slice(11, 16)} ${e.kind === 'puppy' ? e.puppyName : ''} ${e.note ?? ''}`.trim()).join('; ')}.</p>}
            </div>
          )}

          {kind === 'karta-zdrowia' && puppy && (
            <div>
              <p><b>{puppy.name}</b> · {mother?.breed} · {puppy.sex === 'male' ? 'pies' : 'suka'} · ur. {fmtDateTime(puppy.birthDateTime)} · chip {puppy.chip ?? '—'} · matka {litter?.motherName} · ojciec {litter?.fatherName}</p>
              <h3>Profilaktyka</h3>
              <table className="tbl"><thead><tr><th>Data</th><th>Rodzaj</th><th>Preparat</th><th>Następny termin</th><th>Lekarz</th></tr></thead><tbody>{state.health.filter(h => h.puppyId === puppy.id).sort((a, b) => a.date.localeCompare(b.date)).map(h => <tr key={h.id}><td>{fmtDate(h.date)}</td><td>{HEALTH_LABEL[h.kind]}</td><td>{h.name}</td><td>{fmtDate(h.nextDate)}</td><td>{h.vet ?? ''}</td></tr>)}</tbody></table>
              <h3 style={{ marginTop: 12 }}>Historia wag</h3>
              <table className="tbl"><thead><tr><th>Data</th><th>Waga</th></tr></thead><tbody>{state.weights.filter(w => w.puppyId === puppy.id).sort((a, b) => a.date.localeCompare(b.date)).map(w => <tr key={w.id}><td>{fmtDateTime(w.date)}</td><td>{w.grams} g</td></tr>)}</tbody></table>
              <p style={{ marginTop: 12 }}><b>Zalecenia:</b> kolejne szczepienie wg zaleceń lekarza weterynarii; odrobaczanie co 3 miesiące; karma {[litter?.pack.foodBrand, litter?.pack.foodName].filter(Boolean).join(' ') || '—'}, {litter?.pack.portion ?? ''} {litter?.pack.mealsPerDay ? `${litter.pack.mealsPerDay}× dziennie` : ''}.</p>
            </div>
          )}

          {needsPuppy && !puppy && <Empty>Dodaj szczenię, aby wygenerować dokument.</Empty>}
          {kind !== 'karta-miotu' && (
            <div className="grid cols-2" style={{ marginTop: 40 }}><div style={{ borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>Hodowca</div><div style={{ borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>Nabywca</div></div>
          )}
        </div>
      </Card>
    </div>
  );
}

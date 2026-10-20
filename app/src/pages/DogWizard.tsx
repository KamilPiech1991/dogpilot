import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Dog as DogIcon, PawPrint, QrCode, Search, Sparkles, Venus, Mars, ScanLine, Camera, X } from 'lucide-react';
import { useStore } from '../app/store';
import { BREEDS, COLORS } from '../app/breeds';
import { ageText, fmtDate, today, uid } from '../app/format';
import { PhotoPicker } from '../components/ui';
import type { Dog, Sex } from '../app/types';

type Step = 0 | 1 | 2 | 3 | 4;
const STEPS = ['Płeć', 'Dane podstawowe', 'Rodzice', 'Identyfikacja', 'Podsumowanie'];

/** Kreator dodawania psa lub suki: krok po kroku, z podglądem karty na żywo. */
export default function DogWizard() {
  const { state, upsert, limits, toast } = useStore();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const preSex = params.get('sex') as Sex | null;
  const [step, setStep] = useState<Step>(preSex ? 1 : 0);
  const [d, setD] = useState<Dog>({ id: uid(), name: '', pedigreeName: '', breed: '', sex: preSex ?? 'female', birthDate: '', createdAt: today() });
  const [breedQ, setBreedQ] = useState('');
  const [breedOpen, setBreedOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Dog>(k: K, v: Dog[K]) => setD(x => ({ ...x, [k]: v }));
  const female = d.sex === 'female';
  const word = female ? 'sukę' : 'psa';
  const males = state.dogs.filter(x => x.sex === 'male'), females = state.dogs.filter(x => x.sex === 'female');

  const breedHits = useMemo(() => {
    const q = breedQ.trim().toLowerCase();
    const mine = [...new Set(state.dogs.map(x => x.breed).filter(Boolean))];
    const all = [...new Set([...mine, ...BREEDS])];
    return (q ? all.filter(b => b.toLowerCase().includes(q)) : mine.length ? mine : all.slice(0, 8)).slice(0, 8);
  }, [breedQ, state.dogs]);

  const chipOk = !d.chip || /^\d{15}$/.test(d.chip.replace(/\s/g, ''));
  const errors: Record<number, string[]> = {
    0: [],
    1: [!d.name.trim() && 'Podaj imię domowe.', !d.breed.trim() && 'Wybierz lub wpisz rasę.', !d.birthDate && 'Podaj datę urodzenia.', d.birthDate > today() && 'Data urodzenia nie może być w przyszłości.'].filter(Boolean) as string[],
    2: [],
    3: [!chipOk && 'Numer chipa ma 15 cyfr (ISO 11784).'].filter(Boolean) as string[],
    4: [],
  };
  const canNext = errors[step].length === 0;
  const next = () => { if (!canNext) { setTouched(true); return; } setTouched(false); setStep(s => Math.min(4, s + 1) as Step); };
  const back = () => { if (step === 0 || (step === 1 && preSex)) nav(-1); else setStep(s => Math.max(0, s - 1) as Step); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && !breedOpen) { e.preventDefault(); next(); } };

  const missing = [!d.pedigreeName && 'imię hodowlane', !d.photo && 'zdjęcie', !d.color && 'umaszczenie', !d.pedigreeNo && 'nr rodowodu', !d.chip && 'nr chipa', !(d.fatherId || d.fatherName) && 'ojciec', !(d.motherId || d.motherName) && 'matka'].filter(Boolean) as string[];
  const checks = [d.name, d.breed, d.birthDate, d.pedigreeName, d.photo, d.color, d.weightKg, d.pedigreeNo, d.chip, d.fatherId || d.fatherName, d.motherId || d.motherName];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const save = () => {
    if (!limits.canAddDog(d.sex)) { toast('Limit planu FREE osiągnięty. Przejdź na PRO, aby dodać więcej psów.'); return; }
    upsert('dogs', { ...d, chip: d.chip?.replace(/\s/g, '') || undefined, pedigreeName: d.pedigreeName || d.name });
    setSaved(true);
    setTimeout(() => nav(`/psy/${d.id}`), 1100);
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const parentPicker = (role: 'father' | 'mother') => {
    const list = role === 'father' ? males : females;
    const idKey = role === 'father' ? 'fatherId' : 'motherId', nameKey = role === 'father' ? 'fatherName' : 'motherName';
    const selId = d[idKey];
    return (
      <div className="wiz-box" key={role}>
        <div className="wiz-label">{role === 'father' ? <><Mars size={16} /> Ojciec</> : <><Venus size={16} /> Matka</>}</div>
        {list.length > 0 && <>
          <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>Z Twojej hodowli – kliknij, żeby połączyć z rodowodem:</div>
          <div className="pick-row">
            {list.map(p => (
              <button key={p.id} type="button" className={`pick ${selId === p.id ? 'on' : ''}`} onClick={() => setD(x => ({ ...x, [idKey]: selId === p.id ? undefined : p.id, [nameKey]: selId === p.id ? '' : p.pedigreeName }))}>
                <span className="pick-ava">{p.photo ? <img src={p.photo} alt="" /> : <DogIcon size={18} />}</span>
                <span><b>{p.name}</b><small>{p.breed}</small></span>
                {selId === p.id && <Check size={16} className="pick-check" />}
              </button>
            ))}
          </div>
        </>}
        <input value={d[nameKey] ?? ''} onChange={e => setD(x => ({ ...x, [idKey]: undefined, [nameKey]: e.target.value }))} placeholder={list.length ? 'lub wpisz nazwę rodowodową spoza hodowli' : 'Nazwa rodowodowa, np. Bubi Dolina Krzemowa FCI'} />
      </div>
    );
  };

  return (
    <div className={`wizard wiz-theme ${female ? 'fem' : 'mal'}`} onKeyDown={onKey}>
      <div className="wiz-top">
        <button className="icon-btn" onClick={back} aria-label="Wstecz"><ArrowLeft size={22} /></button>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>KROK {step + 1} Z 5 · {STEPS[step].toUpperCase()}</div>
          <h1 style={{ margin: 0, fontSize: 22 }}>{step === 0 ? 'Kto dołącza do hodowli?' : `Dodaj ${word}`}</h1>
        </div>
        <button className="icon-btn" onClick={() => nav('/psy')} aria-label="Zamknij kreator"><X size={22} /></button>
      </div>
      <div className="wiz-steps" role="list">
        {STEPS.map((s, i) => (
          <button key={s} role="listitem" type="button" className={`${i === step ? 'cur' : ''} ${i < step ? 'done' : ''}`} disabled={i > step} onClick={() => i < step && setStep(i as Step)} aria-label={s} title={s}>
            <span>{i < step ? <Check size={12} /> : i + 1}</span>
          </button>
        ))}
        <div className="wiz-bar"><div style={{ width: `${(step / 4) * 100}%` }} /></div>
      </div>

      {step > 0 && (
        <div className="wiz-preview" aria-live="polite">
          <div className="pv-ava">{d.photo ? <img src={d.photo} alt="" /> : <DogIcon size={30} />}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pv-name">{d.name || (female ? 'Imię suki' : 'Imię psa')} <span className="pv-sex">{female ? <Venus size={14} /> : <Mars size={14} />}</span></div>
            <div className="pv-sub">{d.pedigreeName || 'imię hodowlane'}</div>
            <div className="pv-tags">
              <span>{d.breed || 'rasa'}</span>
              {d.birthDate && <span>{ageText(d.birthDate) || 'nowo narodzony'}</span>}
              {d.color && <span>{d.color}</span>}
              {d.neutered && <span>{female ? 'sterylizowana' : 'kastrowany'}</span>}
            </div>
          </div>
          <div className="pv-pct" title="Kompletność karty"><svg viewBox="0 0 36 36"><path d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="4" /><path d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray={`${pct} 100`} pathLength={100} strokeLinecap="round" /></svg><b>{pct}%</b></div>
        </div>
      )}

      <div className="wiz-body" key={step}>
        {step === 0 && (
          <>
            <div className="sex-cards">
              <button type="button" className="sex-card fem" onClick={() => { set('sex', 'female'); setStep(1); }}>
                <span className="sex-ico"><Venus size={34} /></span><b>Suka</b><small>Rozród, cieczki, monitor ciąży i mioty</small><span className="sex-count">{females.length} w hodowli</span>
              </button>
              <button type="button" className="sex-card mal" onClick={() => { set('sex', 'male'); setStep(1); }}>
                <span className="sex-ico"><Mars size={34} /></span><b>Pies</b><small>Krycia, reproduktor, osiągnięcia i zdrowie</small><span className="sex-count">{males.length} w hodowli</span>
              </button>
            </div>
            <button type="button" className="wiz-alt" onClick={() => nav('/skanuj')}>
              <span className="sex-ico sm"><QrCode size={20} /></span>
              <span style={{ flex: 1, textAlign: 'left' }}><b>Mam kartę przekazania od hodowcy</b><small>Zeskanuj kod QR, a dane, wagi i szczepienia wczytają się same</small></span>
              <ArrowRight size={18} />
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="wiz-box"><PhotoPicker value={d.photo} onChange={v => set('photo', v)} label={`Dodaj zdjęcie ${female ? 'suki' : 'psa'}`} /></div>
            <div className="wiz-box">
              <label className="wiz-label" htmlFor="w-name">Imię domowe *</label>
              <input id="w-name" autoFocus value={d.name} onChange={e => set('name', e.target.value)} placeholder={female ? 'np. Diana' : 'np. Rocky'} className={touched && !d.name.trim() ? 'bad' : ''} />
              <label className="wiz-label" htmlFor="w-ped" style={{ marginTop: 12 }}>Imię hodowlane <small className="muted">(z rodowodu)</small></label>
              <input id="w-ped" value={d.pedigreeName} onChange={e => set('pedigreeName', e.target.value)} placeholder="np. Diana zza Miedzy FCI" />
            </div>
            <div className="wiz-box">
              <label className="wiz-label" htmlFor="w-breed">Rasa *</label>
              <div className={`combo ${touched && !d.breed.trim() ? 'bad' : ''}`}>
                <Search size={18} />
                <input id="w-breed" role="combobox" aria-expanded={breedOpen} aria-controls="w-breed-list" value={breedOpen ? breedQ : d.breed} placeholder="Szukaj rasy, np. jamnik" onFocus={() => { setBreedOpen(true); setBreedQ(d.breed); }} onBlur={() => setTimeout(() => setBreedOpen(false), 150)} onChange={e => { setBreedQ(e.target.value); set('breed', e.target.value); }} />
                {d.breed && <button type="button" className="icon-btn" aria-label="Wyczyść rasę" onClick={() => { set('breed', ''); setBreedQ(''); }}><X size={16} /></button>}
              </div>
              {breedOpen && (
                <div className="combo-list" id="w-breed-list" role="listbox">
                  {breedHits.map(b => <button type="button" role="option" aria-selected={d.breed === b} key={b} onMouseDown={e => e.preventDefault()} onClick={() => { set('breed', b); setBreedQ(b); setBreedOpen(false); }}>{b}{d.breed === b && <Check size={14} />}</button>)}
                  {breedQ.trim() && !breedHits.some(b => b.toLowerCase() === breedQ.trim().toLowerCase()) && <button type="button" className="custom" onMouseDown={e => e.preventDefault()} onClick={() => { set('breed', breedQ.trim()); setBreedOpen(false); }}>Użyj „{breedQ.trim()}”</button>}
                </div>
              )}
            </div>
            <div className="wiz-box">
              <label className="wiz-label" htmlFor="w-birth">Data urodzenia *</label>
              <input id="w-birth" type="date" max={today()} value={d.birthDate} onChange={e => set('birthDate', e.target.value)} className={touched && !d.birthDate ? 'bad' : ''} />
              {d.birthDate && d.birthDate <= today() && <div className="wiz-hint"><Sparkles size={14} /> {d.name || (female ? 'Suka' : 'Pies')} ma {ageText(d.birthDate) || 'mniej niż miesiąc'}.</div>}
            </div>
            <div className="wiz-box">
              <div className="wiz-label">Umaszczenie</div>
              <div className="chips-wrap">{COLORS.map(c => <button key={c} type="button" className={`chip ${d.color === c ? 'on' : ''}`} onClick={() => set('color', d.color === c ? '' : c)}>{c}</button>)}</div>
              <input value={d.color ?? ''} onChange={e => set('color', e.target.value)} placeholder="lub wpisz własne" style={{ marginTop: 8 }} />
            </div>
            <div className="wiz-box two">
              <div>
                <label className="wiz-label" htmlFor="w-kg">Waga</label>
                <div className="stepper">
                  <button type="button" onClick={() => set('weightKg', Math.max(0, Math.round(((d.weightKg ?? 0) - 0.5) * 10) / 10) || undefined)} aria-label="Mniej">−</button>
                  <input id="w-kg" type="number" step="0.1" min="0" inputMode="decimal" value={d.weightKg ?? ''} onChange={e => set('weightKg', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
                  <span>kg</span>
                  <button type="button" onClick={() => set('weightKg', Math.round(((d.weightKg ?? 0) + 0.5) * 10) / 10)} aria-label="Więcej">+</button>
                </div>
              </div>
              <div>
                <div className="wiz-label">{female ? 'Sterylizowana' : 'Kastrowany'}</div>
                <div className="seg2">
                  <button type="button" className={!d.neutered ? 'on' : ''} onClick={() => set('neutered', false)}>Nie</button>
                  <button type="button" className={d.neutered ? 'on' : ''} onClick={() => set('neutered', true)}>Tak</button>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {parentPicker('father')}
            {parentPicker('mother')}
            <div className="mini-ped">
              <div className="mp-child">{d.name || word}</div>
              <div className="mp-lines"><span /><span /></div>
              <div className="mp-parents"><div className={d.fatherId || d.fatherName ? 'set' : ''}><Mars size={14} /> {d.fatherName || 'ojciec'}</div><div className={d.motherId || d.motherName ? 'set' : ''}><Venus size={14} /> {d.motherName || 'matka'}</div></div>
              <small className="muted">Rodzice z hodowli łączą się z rodowodem i współczynnikiem inbredu (COI).</small>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="wiz-box">
              <label className="wiz-label" htmlFor="w-ped-no">Nr rodowodu</label>
              <input id="w-ped-no" value={d.pedigreeNo ?? ''} onChange={e => set('pedigreeNo', e.target.value)} placeholder="np. PKR.IV-12345" />
              <label className="wiz-label" htmlFor="w-reg" style={{ marginTop: 12 }}>Nr rejestracji oddziałowej</label>
              <input id="w-reg" value={d.regNo ?? ''} onChange={e => set('regNo', e.target.value)} placeholder="np. ZKwP/W/2024/118" />
            </div>
            <div className="wiz-box">
              <label className="wiz-label" htmlFor="w-chip"><ScanLine size={16} /> Nr chipa</label>
              <input id="w-chip" inputMode="numeric" value={d.chip ?? ''} onChange={e => set('chip', e.target.value.replace(/[^\d ]/g, ''))} placeholder="15 cyfr, np. 616093900123456" className={touched && !chipOk ? 'bad' : ''} />
              <div className="chip-meter"><div style={{ width: `${Math.min(100, ((d.chip ?? '').replace(/\s/g, '').length / 15) * 100)}%` }} className={chipOk && d.chip ? 'ok' : ''} /></div>
              <small className="muted">{(d.chip ?? '').replace(/\s/g, '').length}/15 cyfr{d.chip?.startsWith('616') ? ' · kod kraju 616 = Polska' : ''}</small>
            </div>
            <div className="wiz-box">
              <label className="wiz-label" htmlFor="w-kennel">Hodowla pochodzenia</label>
              <input id="w-kennel" value={d.kennelName ?? ''} onChange={e => set('kennelName', e.target.value)} placeholder={state.profile.kennelName || 'np. z Zielonego Wzgórza'} />
              {state.profile.kennelName && !d.kennelName && <button type="button" className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => set('kennelName', state.profile.kennelName)}><PawPrint size={14} /> Z mojej hodowli</button>}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="wiz-box summary">
              {[
                ['Imię domowe', d.name], ['Imię hodowlane', d.pedigreeName || '—'], ['Rasa', d.breed], ['Data urodzenia', `${fmtDate(d.birthDate)} (${ageText(d.birthDate) || 'mniej niż miesiąc'})`],
                ['Umaszczenie', d.color || '—'], ['Waga', d.weightKg ? `${d.weightKg} kg` : '—'], [female ? 'Sterylizowana' : 'Kastrowany', d.neutered ? 'tak' : 'nie'],
                ['Ojciec', d.fatherName || '—'], ['Matka', d.motherName || '—'], ['Nr rodowodu', d.pedigreeNo || '—'], ['Nr rejestracji', d.regNo || '—'], ['Chip', d.chip || '—'],
              ].map(([k, v], i) => (
                <button type="button" key={k} className="sum-row" onClick={() => setStep(i < 7 ? 1 : i < 9 ? 2 : 3)} title="Kliknij, żeby poprawić"><span className="muted">{k}</span><b>{v}</b></button>
              ))}
            </div>
            {missing.length > 0 && <div className="wiz-box soft"><b>Możesz uzupełnić później:</b> {missing.join(', ')}. Karta jest gotowa w {pct}%.</div>}
          </>
        )}

        {touched && errors[step].length > 0 && <div className="badge danger" role="alert" style={{ alignSelf: 'flex-start' }}>{errors[step][0]}</div>}
      </div>

      {step > 0 && createPortal(
        <div className={`wiz-actions wiz-theme ${female ? 'fem' : 'mal'}`}>
          <button className="btn secondary" onClick={back}><ArrowLeft size={18} /> Wstecz</button>
          {step < 4
            ? <button className="btn" onClick={next}>{step === 3 ? 'Podsumowanie' : 'Dalej'} <ArrowRight size={18} /></button>
            : <button className="btn" onClick={save} disabled={saved}><Check size={18} /> {`Dodaj ${word}`}</button>}
        </div>,
        document.body,
      )}

      {saved && createPortal(
        <div className={`wiz-done wiz-theme ${female ? 'fem' : 'mal'}`} role="status">
          <div className="burst">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ ['--a' as string]: `${i * (360 / 14)}deg` }} />)}</div>
          <div className="done-ava">{d.photo ? <img src={d.photo} alt="" /> : <Camera size={34} />}</div>
          <h2>{d.name} {female ? 'dołączyła' : 'dołączył'} do hodowli!</h2>
          <p className="muted">Otwieram kartę…</p>
        </div>,
        document.body,
      )}
    </div>
  );
}

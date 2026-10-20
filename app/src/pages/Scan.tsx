import { useEffect, useRef, useState } from 'react';
import { Camera, Backpack } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../app/store';
import { Card, Field, KV } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { QrCode as ArtIcon } from 'lucide-react';
import { decodePawId, type PawIdPayload } from '../app/pawid';
import { fmtDateTime, today, uid } from '../app/format';

export default function Scan() {
  const { state, dispatch, toast, limits } = useStore();
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [payload, setPayload] = useState<PawIdPayload | null>(null);
  const [homeName, setHomeName] = useState('');
  const [camera, setCamera] = useState(false);
  const [camErr, setCamErr] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const hasDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null; let timer = 0; let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const det = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (cancelled || !video.current) return;
          try { const codes = await det.detect(video.current); if (codes[0]?.rawValue) { const p = decodePawId(codes[0].rawValue); if (p) { setPayload(p); setText(codes[0].rawValue); setCamera(false); return; } } } catch { /* ignore frame */ }
          timer = window.setTimeout(tick, 400);
        };
        tick();
      } catch { setCamErr('Nie udało się uruchomić kamery. Wklej kod ręcznie.'); setCamera(false); }
    })();
    return () => { cancelled = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, [camera]);

  const parse = () => { const p = decodePawId(text); if (!p) toast('To nie jest prawidłowy kod przekazania'); setPayload(p); };

  const importPuppy = () => {
    if (!payload) return;
    if (!limits.canAddDog(payload.sex)) { toast('Limit psów w planie FREE. Przejdź na PRO.'); return; }
    const dogId = uid();
    dispatch({ type: 'bulk', fn: s => ({
      ...s,
      dogs: [...s.dogs, { id: dogId, name: homeName || payload.name, pedigreeName: payload.name, breed: payload.breed ?? '', sex: payload.sex, birthDate: payload.birth.slice(0, 10), color: payload.color, fatherName: payload.father, motherName: payload.mother, pedigreeNo: payload.pedigreeNo, chip: payload.chip, kennelName: payload.kennel, pawId: payload.id, notes: [payload.pack?.about, payload.pack?.food ? `Karma: ${payload.pack.food}, porcja ${payload.pack.portion ?? ''}, ${payload.pack.meals ?? ''}× dziennie (${payload.pack.hours ?? ''})` : '', payload.pack?.supplements ? `Suplementy: ${payload.pack.supplements}` : '', payload.pack?.grooming ? `Pielęgnacja: ${payload.pack.grooming}` : '', payload.pack?.firstDays ? `Pierwsze dni: ${payload.pack.firstDays}` : '', payload.pack?.accustomed?.length ? `Oswojone z: ${payload.pack.accustomed.join(', ')}` : '', payload.pack?.character?.length ? `Charakter: ${payload.pack.character.join(', ')}` : ''].filter(Boolean).join('\n'), createdAt: today() }],
      health: [...s.health, ...payload.vacc.map(v => ({ id: uid(), dogId, kind: 'vaccination' as const, date: v.d, name: v.n })), ...payload.deworm.map(v => ({ id: uid(), dogId, kind: 'deworming' as const, date: v.d, name: v.n }))],
      weights: [...s.weights, ...payload.weights.map(w => ({ id: uid(), dogId, date: w.d, grams: w.g }))],
    }) });
    toast('Szczenię dodane do Twoich psów');
    nav(`/psy/${dogId}`);
  };

  return (
    <div className="stack">
      <ArtHeader compact tone="slate" icon={<ArtIcon size={24} />} title="Odbierz psa" sub="Zeskanuj kod z karty przekazania – profil psa pojawi się sam" />
      {!payload && (
        <Card>
          {hasDetector ? (
            <div className="stack">
              {!camera ? <button className="btn" onClick={() => { setCamErr(''); setCamera(true); }}><Camera size={18} /> Uruchom kamerę i zeskanuj kod QR</button> : <><video ref={video} style={{ width: '100%', borderRadius: 12, background: '#000' }} muted playsInline /><button className="btn secondary" onClick={() => setCamera(false)}>Zatrzymaj</button></>}
              {camErr && <div className="badge danger">{camErr}</div>}
            </div>
          ) : <p className="muted">Skanowanie kamerą jest dostępne w aplikacji mobilnej i w przeglądarkach z obsługą BarcodeDetector. Możesz też wkleić kod poniżej.</p>}
          <Field label="Lub wklej kod przekazania (tekst spod kodu QR)"><textarea value={text} onChange={e => setText(e.target.value)} placeholder="DGP1:..." /></Field>
          <button className="btn" disabled={!text.trim()} onClick={parse}>Odczytaj</button>
        </Card>
      )}
      {payload && (
        <>
          <div className="pawid">
            <div className="muted" style={{ color: 'rgba(255,255,255,.8)' }}>Karta szczenięcia · {payload.kennel}</div>
            <h2 style={{ color: '#fff', fontSize: 26 }}>{payload.name}</h2>
            <KV items={[['Miot', payload.litter], ['Rasa', payload.breed], ['Płeć', payload.sex === 'male' ? 'Pies' : 'Suka'], ['Urodzony', fmtDateTime(payload.birth)], ['Umaszczenie', payload.color], ['Waga ur.', payload.bw ? `${payload.bw} g` : '—'], ['Ojciec', payload.father], ['Matka', payload.mother], ['Nr rodowodu', payload.pedigreeNo], ['Chip', payload.chip], ['Szczepienia', payload.vacc.map(v => `${v.n} (${v.d})`).join(', ') || '—'], ['Odrobaczenia', payload.deworm.map(v => `${v.n} (${v.d})`).join(', ') || '—'], ['Pomiary wagi', `${payload.weights.length} wpisów`]]} />
          </div>
          {payload.pack && (
            <Card title="Pakiet na nowy dom" icon={<Backpack size={18} />}>
              <KV items={[['Karma', payload.pack.food], ['Porcja', payload.pack.portion], ['Posiłki', payload.pack.meals ? `${payload.pack.meals}× dziennie, godz. ${payload.pack.hours ?? ''}` : '—'], ['Suplementy', payload.pack.supplements], ['Pielęgnacja', payload.pack.grooming], ['Pierwsze dni', payload.pack.firstDays], ['Oswojony z', payload.pack.accustomed?.join(', ')], ['Charakter', payload.pack.character?.join(', ')], ['O szczenięciu', payload.pack.about]]} />
            </Card>
          )}
          <Card>
            <Field label="Imię domowe (możesz nadać własne)"><input value={homeName} onChange={e => setHomeName(e.target.value)} placeholder={payload.name} /></Field>
            <div className="row">
              <button className="btn" onClick={importPuppy}>Dodaj do moich psów</button>
              <button className="btn secondary" onClick={() => { setPayload(null); setText(''); }}>Anuluj</button>
            </div>
            {state.profile.module === 'breeder' && <small className="muted">Jesteś w module Hodowca – szczenię trafi do listy Twoich psów.</small>}
          </Card>
        </>
      )}
    </div>
  );
}

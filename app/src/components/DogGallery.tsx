import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus, X, ChevronLeft, ChevronRight, Star, Trash2, Images, Loader2 } from 'lucide-react';
import { useStore } from '../app/store';
import { readPhoto } from '../app/photo';
import { GALLERY_MAX, type Dog } from '../app/types';
import { Card } from './ui';

/** Galeria zdjęć psa: do 6 zdjęć, podgląd pełnoekranowy, zmiana kolejności, ustawienie zdjęcia głównego. */
export default function DogGallery({ dog }: { dog: Dog }) {
  const { upsert, toast } = useStore();
  const pics = dog.gallery ?? [];
  const left = GALLERY_MAX - pics.length;
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const save = (gallery: string[], photo = dog.photo) => upsert('dogs', { ...dog, gallery, photo });

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files].filter(f => f.type.startsWith('image/'));
    if (list.length > left) toast(`Galeria mieści ${GALLERY_MAX} zdjęć. Dodaję ${left} z ${list.length}.`);
    setBusy(true);
    try {
      const out: string[] = [];
      for (const f of list.slice(0, left)) out.push(await readPhoto(f, 900));
      save([...pics, ...out], dog.photo ?? out[0]);
      if (out.length) toast(out.length === 1 ? 'Dodano zdjęcie' : `Dodano ${out.length} zdjęcia`);
    } catch { toast('Nie udało się wczytać zdjęcia'); }
    setBusy(false);
  };
  const del = (i: number) => { const g = pics.filter((_, k) => k !== i); save(g, dog.photo === pics[i] ? g[0] : dog.photo); setOpen(g.length ? Math.min(i, g.length - 1) : null); toast('Usunięto zdjęcie'); };
  const move = (i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= pics.length) return; const g = [...pics]; [g[i], g[j]] = [g[j], g[i]]; save(g); setOpen(j); };

  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); if (e.key === 'ArrowRight') setOpen(o => o === null ? o : (o + 1) % pics.length); if (e.key === 'ArrowLeft') setOpen(o => o === null ? o : (o - 1 + pics.length) % pics.length); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open, pics.length]);

  return (
    <Card title={<>Galeria</>} icon={<Images size={18} />} right={<span className={`badge ${left ? 'gray' : 'warn'}`}>{pics.length}/{GALLERY_MAX}</span>}>
      <div className="gallery-grid">
        {pics.map((src, i) => (
          <button key={i} type="button" className="g-tile" onClick={() => setOpen(i)} aria-label={`Zdjęcie ${i + 1}`} style={{ animationDelay: `${i * 40}ms` }}>
            <img src={src} alt="" />
            {dog.photo === src && <span className="g-main"><Star size={11} fill="currentColor" /> główne</span>}
          </button>
        ))}
        {left > 0 && (
          <button type="button" className="g-tile g-add no-print" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={26} className="spin" /> : <ImagePlus size={26} />}
            <b>{pics.length ? 'Dodaj' : 'Dodaj zdjęcia'}</b><small>{`jeszcze ${left}`}</small>
          </button>
        )}
        {Array.from({ length: Math.max(0, left - 1) }).map((_, i) => <span key={`e${i}`} className="g-tile g-empty" aria-hidden />)}
      </div>
      {!pics.length && <small className="muted" style={{ display: 'block', marginTop: 8 }}>Pokaż psa z każdej strony: głowa, profil, ruch, wystawa. Pierwsze zdjęcie staje się zdjęciem głównym.</small>}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={e => { add(e.target.files); e.target.value = ''; }} />

      {open !== null && pics[open] && createPortal(
        <div className="lightbox" role="dialog" aria-label="Podgląd zdjęcia" onClick={() => setOpen(null)}>
          <div className="lb-top" onClick={e => e.stopPropagation()}>
            <span>{dog.name} · {open + 1}/{pics.length}</span>
            <button className="icon-btn light" onClick={() => setOpen(null)} aria-label="Zamknij"><X size={24} /></button>
          </div>
          <img key={open} src={pics[open]} alt="" onClick={e => e.stopPropagation()} />
          {pics.length > 1 && <>
            <button className="lb-nav prev" onClick={e => { e.stopPropagation(); setOpen((open - 1 + pics.length) % pics.length); }} aria-label="Poprzednie"><ChevronLeft size={30} /></button>
            <button className="lb-nav next" onClick={e => { e.stopPropagation(); setOpen((open + 1) % pics.length); }} aria-label="Następne"><ChevronRight size={30} /></button>
          </>}
          <div className="lb-actions" onClick={e => e.stopPropagation()}>
            <button className="btn sm secondary" disabled={open === 0} onClick={() => move(open, -1)}><ChevronLeft size={14} /> Przesuń</button>
            <button className="btn sm" disabled={dog.photo === pics[open]} onClick={() => { save(pics, pics[open]); toast('Ustawiono jako zdjęcie główne'); }}><Star size={14} /> {dog.photo === pics[open] ? 'Zdjęcie główne' : 'Ustaw jako główne'}</button>
            <button className="btn sm danger" onClick={() => del(open)}><Trash2 size={14} /> Usuń</button>
            <button className="btn sm secondary" disabled={open === pics.length - 1} onClick={() => move(open, 1)}>Przesuń <ChevronRight size={14} /></button>
          </div>
        </div>,
        document.body,
      )}
    </Card>
  );
}

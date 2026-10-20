import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Pencil, Trash2, X, PawPrint, Camera, ImagePlus } from 'lucide-react';
import { readPhoto } from '../app/photo';

export const APP_NAME = 'Dogpilot';

export function PageHeader({ title, sub, actions, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: () => void }) {
  return (
    <div className="page-header">
      <div className="row">
        {back && <button className="icon-btn no-print" onClick={back} aria-label="Wstecz"><ArrowLeft size={22} /></button>}
        <div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
      </div>
      {actions && <div className="row no-print">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '', onClick, title, right, icon }: { children?: ReactNode; className?: string; onClick?: () => void; title?: ReactNode; right?: ReactNode; icon?: ReactNode }) {
  return (
    <div className={`card ${onClick ? 'clickable' : ''} ${className}`} onClick={onClick}>
      {(title || right) && <div className="row between" style={{ marginBottom: 10 }}><h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>{icon && <span style={{ color: 'var(--primary)', display: 'grid' }}>{icon}</span>}{title}</h3>{right}</div>}
      {children}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="field"><label>{label}</label>{children}{hint && <small>{hint}</small>}</div>;
}

export function Modal({ title, onClose, children, actions, wide }: { title: string; onClose: () => void; children: ReactNode; actions?: ReactNode; wide?: boolean }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={wide ? { maxWidth: 860 } : undefined} role="dialog" aria-modal="true">
        <div className="row between"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Zamknij"><X size={20} /></button></div>
        {children}
        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { key: T; label: string }[] }) {
  return <div className="tabs no-print">{items.map(i => <button key={i.key} className={i.key === value ? 'active' : ''} onClick={() => onChange(i.key)}>{i.label}</button>)}</div>;
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return <div className="empty"><div className="ico">{icon ?? <PawPrint size={28} />}</div>{children}</div>;
}

export function Stat({ value, label, icon }: { value: ReactNode; label: string; icon?: ReactNode }) {
  return <div className="card stat">{icon && <div style={{ color: 'var(--primary)', display: 'grid', placeItems: 'center', marginBottom: 4 }}>{icon}</div>}<div className="value">{value}</div><div className="label">{label}</div></div>;
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return <dl className="kv">{items.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v ?? '—'}</dd></div>)}</dl>;
}

export function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return <div className="chips">{options.map(o => <button type="button" key={o} className={`chip ${value.includes(o) ? 'on' : ''}`} onClick={() => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])}>{o}</button>)}</div>;
}

export function ProBadge() { return <span className="badge pro">PRO</span>; }

export function EditBtn({ onClick, label = 'Edytuj' }: { onClick: () => void; label?: string }) { return <button className="icon-btn" onClick={e => { e.stopPropagation(); onClick(); }} aria-label={label} title={label}><Pencil size={17} /></button>; }
export function DelBtn({ onClick, label = 'Usuń' }: { onClick: () => void; label?: string }) { return <button className="icon-btn danger" onClick={e => { e.stopPropagation(); onClick(); }} aria-label={label} title={label}><Trash2 size={17} /></button>; }

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export function confirmDel(msg = 'Na pewno usunąć ten wpis?') { return window.confirm(msg); }

export const sexIcon = (s: 'male' | 'female') => (s === 'male' ? '♂' : '♀');
export const sexLabel = (s: 'male' | 'female') => (s === 'male' ? 'Pies' : 'Suka');

export type ArtTone = 'green' | 'blue' | 'sun' | 'rose' | 'lilac' | 'teal' | 'slate' | 'custom';
/** Gradientowy baner nagłówka z dużą ikoną w tle i opcjonalnym zdjęciem. */
export function ArtHeader({ tone = 'green', icon, photo, title, sub, actions, back, children, style, compact }: { tone?: ArtTone; icon?: ReactNode; photo?: string | null; title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: () => void; children?: ReactNode; style?: React.CSSProperties; compact?: boolean }) {
  return (
    <div className={`art-hero ${tone}${compact ? ' compact' : ''}`} style={style}>
      {icon && <span className="art" aria-hidden>{icon}</span>}
      <div className="art-top">
        {back && <button className="icon-btn light no-print" onClick={back} aria-label="Wstecz"><ArrowLeft size={22} /></button>}
        {photo !== undefined && <div className="art-photo">{photo ? <img src={photo} alt="" /> : icon}</div>}
        <div className="art-text"><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
        {actions && <div className="row no-print art-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Wybór zdjęcia z podglądem; obraz jest zmniejszany w przeglądarce i zapisywany jako data URL. */
export function PhotoPicker({ value, onChange, label = 'Dodaj zdjęcie' }: { value?: string; onChange: (v?: string) => void; label?: string }) {
  return (
    <div className="photo-picker">
      <div className="avatar lg">{value ? <img src={value} alt="" /> : <Camera size={30} />}</div>
      <div className="stack" style={{ gap: 6, alignItems: 'flex-start' }}>
        <label className="btn secondary sm"><ImagePlus size={16} /> {value ? 'Zmień zdjęcie' : label}<input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) { try { onChange(await readPhoto(f)); } catch { /* ignore */ } } e.target.value = ''; }} /></label>
        {value && <button className="btn ghost sm" onClick={() => onChange(undefined)}><Trash2 size={16} /> Usuń zdjęcie</button>}
        <small className="muted">JPG lub PNG. Zmniejszamy do 640 px, zdjęcie zostaje w Twoich danych.</small>
      </div>
    </div>
  );
}

/** Znak słowny „dogpilot” z nagłówka marki; ciemnozielony w trybie jasnym, biały w ciemnym. */
export function Wordmark({ height = 26, light }: { height?: number; light?: boolean }) {
  const base = import.meta.env.BASE_URL;
  if (light) return <span className="wordmark"><img src={`${base}brand/wordmark-white.png`} alt={APP_NAME} style={{ height }} /></span>;
  return <span className="wordmark"><img className="wm-light" src={`${base}brand/wordmark.png`} alt={APP_NAME} style={{ height }} /><img className="wm-dark" src={`${base}brand/wordmark-white.png`} alt="" style={{ height }} /></span>;
}

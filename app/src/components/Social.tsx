import { useMemo, useState } from 'react';
import { Copy, Share2, Check, Loader2, Link2, Hash, ShieldCheck } from 'lucide-react';
import { useStore } from '../app/store';
import { Modal } from './ui';
import { uid, today } from '../app/format';
import type { SocialAccount, SocialSettings } from '../app/types';

export type Network = 'facebook' | 'instagram';

export function FacebookMark({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2" /><path fill="#fff" d="M15.3 8.4h-1.6c-.6 0-.9.3-.9.9v1.5h2.4l-.3 2.6h-2.1V20h-2.9v-6.6H8.1v-2.6h1.8V9c0-2.1 1.2-3.3 3.3-3.3h2.1z" /></svg>;
}
export function InstagramMark({ size = 22 }: { size?: number }) {
  const id = useMemo(() => `ig${Math.random().toString(36).slice(2, 7)}`, []);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#FEDA75" /><stop offset=".35" stopColor="#FA7E1E" /><stop offset=".6" stopColor="#D62976" /><stop offset=".85" stopColor="#962FBF" /><stop offset="1" stopColor="#4F5BD5" /></linearGradient></defs>
      <rect width="24" height="24" rx="7" fill={`url(#${id})`} /><rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="16.1" cy="7.9" r="1" fill="#fff" />
    </svg>
  );
}
export const NETWORK_LABEL: Record<Network, string> = { facebook: 'Facebook', instagram: 'Instagram' };
const Mark = ({ n, size }: { n: Network; size?: number }) => n === 'facebook' ? <FacebookMark size={size} /> : <InstagramMark size={size} />;

/** Połączenie konta. W prototypie symulujemy logowanie przez Meta; docelowo OAuth (Facebook Login) i Graph API po stronie serwera. */
export function ConnectModal({ network, onClose }: { network: Network; onClose: () => void }) {
  const { state, setProfile, toast } = useStore();
  const [name, setName] = useState(network === 'facebook' ? (state.profile.kennelName || '') : '');
  const [busy, setBusy] = useState(false);
  const perms = network === 'facebook'
    ? ['nazwa i zdjęcie Twojej strony hodowli', 'publikowanie postów na stronie w Twoim imieniu', 'bez dostępu do prywatnych wiadomości i znajomych']
    : ['nazwa profilu firmowego lub twórcy', 'publikowanie zdjęć i opisów (post lub relacja)', 'wymaga konta firmowego połączonego ze stroną na Facebooku'];
  const connect = () => {
    if (!name.trim()) return;
    setBusy(true);
    setTimeout(() => {
      const handle = network === 'instagram' ? name.trim().replace(/^@/, '') : name.trim();
      const acc: SocialAccount = { connected: true, name: network === 'instagram' ? `@${handle}` : handle, url: network === 'instagram' ? `https://instagram.com/${handle}` : `https://facebook.com/${handle.toLowerCase().replace(/\s+/g, '')}`, connectedAt: today() };
      setProfile({ social: { ...state.profile.social, [network]: acc } });
      toast(`Połączono z kontem ${NETWORK_LABEL[network]}`);
      onClose();
    }, 900);
  };
  return (
    <Modal title={`Połącz z ${network === 'facebook' ? 'Facebookiem' : 'Instagramem'}`} onClose={onClose} actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className={`btn ${network}`} disabled={!name.trim() || busy} onClick={connect}>{busy ? <Loader2 size={16} className="spin" /> : <Mark n={network} size={18} />} {busy ? 'Łączenie…' : `Kontynuuj z ${NETWORK_LABEL[network]}`}</button></>}>
      <div className="row" style={{ gap: 12, marginBottom: 12 }}><Mark n={network} size={44} /><div><b>Dogpilot poprosi o dostęp do:</b><ul className="perm-list">{perms.map(p => <li key={p}><Check size={14} /> {p}</li>)}</ul></div></div>
      <div className="field"><label>{network === 'facebook' ? 'Strona hodowli na Facebooku' : 'Nazwa profilu na Instagramie'}</label><input value={name} onChange={e => setName(e.target.value)} placeholder={network === 'facebook' ? 'np. Hodowla z Zielonego Wzgórza' : 'np. @zielonewzgorze_kennel'} autoFocus /></div>
      <small className="muted" style={{ display: 'flex', gap: 6 }}><ShieldCheck size={16} style={{ flexShrink: 0 }} /> Prototyp: logowanie jest symulowane. W wersji produkcyjnej otworzy się okno logowania Meta, a token trzymamy na serwerze. Połączenie możesz w każdej chwili odłączyć.</small>
    </Modal>
  );
}

export interface ShareDraft { kind: string; title: string; text: string; photo?: string; hashtags: string[] }

/** Kreator posta na Facebooka i Instagrama z podglądem. */
export function ShareComposer({ draft, onClose }: { draft: ShareDraft; onClose: () => void }) {
  const { state, setProfile, toast } = useStore();
  const social: SocialSettings = state.profile.social ?? {};
  const connected = (['facebook', 'instagram'] as Network[]).filter(n => social[n]?.connected);
  const [nets, setNets] = useState<Network[]>(connected);
  const [text, setText] = useState(draft.text);
  const [tags, setTags] = useState<string[]>(draft.hashtags.slice(0, 4));
  const [preview, setPreview] = useState<Network>(connected[0] ?? 'facebook');
  const [connectFor, setConnectFor] = useState<Network | null>(null);
  const [busy, setBusy] = useState(false);
  const full = `${text.trim()}${tags.length ? `\n\n${tags.map(t => `#${t}`).join(' ')}` : ''}`;
  const igNoPhoto = nets.includes('instagram') && !draft.photo;
  const author = social[preview]?.name || state.profile.kennelName || 'Twoja hodowla';

  const publish = () => {
    setBusy(true);
    setTimeout(() => {
      const posts = [{ id: uid(), date: today(), text: full, networks: nets, kind: draft.kind }, ...(social.posts ?? [])].slice(0, 20);
      setProfile({ social: { ...social, posts } });
      toast(`Opublikowano: ${nets.map(n => NETWORK_LABEL[n]).join(' i ')} (symulacja w prototypie)`);
      onClose();
    }, 900);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(full); toast('Skopiowano tekst posta'); } catch { toast('Nie udało się skopiować'); } };
  const nativeShare = async () => { try { await navigator.share({ title: draft.title, text: full }); } catch { /* anulowano */ } };

  return (
    <Modal wide title={`Udostępnij: ${draft.title}`} onClose={onClose} actions={<>
      <button className="btn ghost" onClick={copy}><Copy size={16} /> Kopiuj tekst</button>
      {'share' in navigator && <button className="btn ghost" onClick={nativeShare}><Share2 size={16} /> Inne aplikacje</button>}
      <button className="btn" disabled={!nets.length || busy || !text.trim() || (igNoPhoto && nets.length === 1)} onClick={publish}>{busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Opublikuj{nets.length ? ` (${nets.length})` : ''}</button>
    </>}>
      <div className="share-grid">
        <div className="stack" style={{ gap: 10 }}>
          <div className="share-nets">
            {(['facebook', 'instagram'] as Network[]).map(n => social[n]?.connected ? (
              <button key={n} type="button" className={`net ${nets.includes(n) ? 'on' : ''}`} onClick={() => setNets(x => x.includes(n) ? x.filter(y => y !== n) : [...x, n])} aria-pressed={nets.includes(n)}>
                <Mark n={n} size={22} /><span><b>{NETWORK_LABEL[n]}</b><small>{social[n]!.name}</small></span>{nets.includes(n) && <Check size={16} />}
              </button>
            ) : (
              <button key={n} type="button" className="net off" onClick={() => setConnectFor(n)}><Mark n={n} size={22} /><span><b>{NETWORK_LABEL[n]}</b><small>Połącz konto</small></span><Link2 size={16} /></button>
            ))}
          </div>
          {igNoPhoto && <div className="badge warn" style={{ alignSelf: 'flex-start' }}>Instagram wymaga zdjęcia. Dodaj zdjęcie w karcie miotu lub psa.</div>}
          <div className="field" style={{ margin: 0 }}><label>Treść posta</label><textarea rows={7} value={text} onChange={e => setText(e.target.value)} maxLength={2000} /></div>
          <small className="muted" style={{ textAlign: 'right', marginTop: -6 }}>{full.length}/2200 znaków (limit Instagrama)</small>
          <div><div className="muted" style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={14} /> Hasztagi</div>
            <div className="chips-wrap">{draft.hashtags.map(h => <button key={h} type="button" className={`chip ${tags.includes(h) ? 'on' : ''}`} onClick={() => setTags(x => x.includes(h) ? x.filter(y => y !== h) : [...x, h])}>#{h}</button>)}</div>
          </div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Podgląd</div>
          <div className="seg2" style={{ marginBottom: 10 }}>{(['facebook', 'instagram'] as Network[]).map(n => <button key={n} type="button" className={preview === n ? 'on' : ''} onClick={() => setPreview(n)}>{NETWORK_LABEL[n]}</button>)}</div>
          <div className={`post-preview ${preview}`}>
            <div className="pp-head"><span className="pp-ava">{state.profile.logo ? <img src={state.profile.logo} alt="" /> : <Mark n={preview} size={20} />}</span><div><b>{author}</b><small>Teraz · {preview === 'facebook' ? 'Publiczny' : 'Post'}</small></div></div>
            {preview === 'facebook' && <div className="pp-text">{full}</div>}
            <div className="pp-photo">{draft.photo ? <img src={draft.photo} alt="" /> : <span>{draft.title}</span>}</div>
            {preview === 'instagram' && <div className="pp-text"><b>{author.replace(/^@/, '')}</b> {full}</div>}
          </div>
        </div>
      </div>
      {connectFor && <ConnectModal network={connectFor} onClose={() => { setConnectFor(null); }} />}
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { authReady, currentUser, onAuth, setPassword, type AuthUser } from '../app/auth';
import { Field, Wordmark } from '../components/ui';

/** Ustawianie / zmiana hasła – z linku w e-mailu (sesja odzyskiwania) albo z Ustawień. */
export default function SetPassword() {
  const nav = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [err, setErr] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!authReady) return; currentUser().then(setUser); return onAuth(setUser); }, []);

  const save = async () => {
    setErr('');
    if (pw.length < 8) return setErr('Hasło musi mieć co najmniej 8 znaków.');
    if (pw !== pw2) return setErr('Hasła różnią się od siebie.');
    setBusy(true); const { error } = await setPassword(pw); setBusy(false);
    if (error) return setErr(error);
    setDone(true);
  };

  return (
    <div className="module-pick"><div className="box auth card" style={{ maxWidth: 480 }}>
      <div className="row" style={{ gap: 10, marginBottom: 12 }}><Wordmark height={26} /></div>
      <h2>{user?.hasPassword ? 'Zmień hasło' : 'Ustaw hasło'}</h2>
      {!authReady && <p className="muted">Tryb demo – logowanie kontem nie jest skonfigurowane.</p>}
      {authReady && !user && <p className="muted">Otwórz ten ekran z linku w e-mailu albo zaloguj się najpierw w panelu.</p>}
      {user && !done && <>
        <p className="muted" style={{ marginTop: -4 }}>Konto: <b>{user.email}</b>. {user.hasPassword ? 'Nowe hasło zastąpi obecne.' : 'Po ustawieniu hasła zalogujesz się także e-mailem, nie tylko kontem Google.'}</p>
        <form onSubmit={e => { e.preventDefault(); save(); }} noValidate>
          <Field label="Nowe hasło" hint="Co najmniej 8 znaków."><div className="input-ico"><Lock size={18} /><input type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} /></div></Field>
          <Field label="Powtórz hasło"><div className="input-ico"><Lock size={18} /><input type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></div></Field>
          {err && <div className="badge danger" style={{ marginTop: 8 }}>{err}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 12, height: 48 }} disabled={busy}>{busy ? 'Zapisywanie…' : 'Zapisz hasło'}</button>
        </form>
      </>}
      {done && <>
        <div className="badge" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginTop: 4 }}><ShieldCheck size={16} /> Hasło zapisane</div>
        <p className="muted">Od teraz zalogujesz się adresem <b>{user?.email}</b> i tym hasłem – na telefonie i w przeglądarce.</p>
      </>}
      <button className="btn secondary" style={{ width: '100%', marginTop: 10 }} onClick={() => nav('/')}>Przejdź do panelu</button>
    </div></div>
  );
}

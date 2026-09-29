import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/AuthContext';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [career, setCareer] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [teachInput, setTeachInput] = useState('');
  const [learnInput, setLearnInput] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setCareer(profile.career || '');
      setSemester(profile.semester || '');
      setBio(profile.bio || '');
      setUniversity(profile.user.university_name || '');
    }
  }, [profile]);

  if (!profile) return <div className="card">Cargando perfil…</div>;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMsg(''); setBusy(true);
    try {
      await api.put('/api/profile', { career, semester, bio, university_name: university });
      await refreshProfile();
      setMsg('Perfil actualizado.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addKnowledge = async (kind: 'teach' | 'learn') => {
    const raw = kind === 'teach' ? teachInput : learnInput;
    const name = raw.trim();
    if (!name) return;
    setError(''); setMsg('');
    try {
      const current = kind === 'teach' ? profile.teach : profile.learn;
      await api.post('/api/knowledge', kind === 'teach'
        ? { teach: [...current, name] }
        : { learn: [...current, name] });
      if (kind === 'teach') setTeachInput(''); else setLearnInput('');
      await refreshProfile();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const removeKnowledge = async (kind: 'teach' | 'learn', name: string) => {
    const current = kind === 'teach' ? profile.teach : profile.learn;
    await api.post('/api/knowledge', kind === 'teach'
      ? { teach: current.filter((t) => t !== name) }
      : { learn: current.filter((l) => l !== name) });
    await refreshProfile();
  };

  return (
    <div className="grid">
      <div className="card hero">
        <div>
          <h1 style={{ margin: 0 }}>{profile.user.first_name} {profile.user.last_name}</h1>
          <p>{career || 'Carrera por definir'} · {university}</p>
          <p className="hint">{profile.user.institutional_email} · {profile.user.is_verified ? '✓ Correo institucional verificado' : 'Correo sin verificar'}</p>
        </div>
      </div>

      {msg && <div className="ok">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Perfil académico</h3>
          <form className="form" onSubmit={saveProfile}>
            <label>Universidad<input value={university} onChange={(e) => setUniversity(e.target.value)} /></label>
            <label>Carrera<input value={career} onChange={(e) => setCareer(e.target.value)} placeholder="Ej. Ingeniería Informática" /></label>
            <label>Ciclo / semestre<input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Ej. 5to ciclo" /></label>
            <label>Descripción breve<textarea rows={3} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
            <button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar perfil'}</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Puedo enseñar</h3>
          <div className="chips">
            {profile.teach.map((t) => (
              <span key={t} className="chip">{t} <button onClick={() => removeKnowledge('teach', t)} title="Eliminar">×</button></span>
            ))}
            {profile.teach.length === 0 && <span className="muted">Agrega lo que puedes enseñar.</span>}
          </div>
          <div className="toolbar" style={{ marginTop: 10 }}>
            <input placeholder="Ej. Java" value={teachInput} onChange={(e) => setTeachInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKnowledge('teach'); } }} />
            <button className="btn btn-ghost" onClick={() => addKnowledge('teach')}>Agregar</button>
          </div>

          <h3>Quiero aprender</h3>
          <div className="chips">
            {profile.learn.map((l) => (
              <span key={l} className="chip learn">{l} <button onClick={() => removeKnowledge('learn', l)} title="Eliminar">×</button></span>
            ))}
            {profile.learn.length === 0 && <span className="muted">Agrega lo que quieres aprender.</span>}
          </div>
          <div className="toolbar" style={{ marginTop: 10 }}>
            <input placeholder="Ej. Estadística" value={learnInput} onChange={(e) => setLearnInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKnowledge('learn'); } }} />
            <button className="btn btn-ghost" onClick={() => addKnowledge('learn')}>Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

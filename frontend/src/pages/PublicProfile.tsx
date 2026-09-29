import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ProfileFull } from '../types';

export default function PublicProfile() {
  const { id } = useParams();
  const [p, setP] = useState<ProfileFull | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<ProfileFull>(`/api/profile/${id}`)
      .then(setP)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (error) return <div className="error">{error}</div>;
  if (!p) return <div className="card">Cargando…</div>;

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{p.user.first_name} {p.user.last_name}</h2>
        <p className="muted">{p.career} · {p.semester} · {p.user.university_name}</p>
        <p>{p.bio || 'Sin descripción.'}</p>
        <h4>Puedo enseñar</h4>
        <div className="chips">{p.teach.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        <h4>Quiero aprender</h4>
        <div className="chips">{p.learn.map((l) => <span key={l} className="chip learn">{l}</span>)}</div>
        <div className="toolbar" style={{ marginTop: 14 }}>
          <Link className="btn btn-ghost" to="/descubrir">Volver a Descubrir</Link>
          <Link className="btn" to="/mensajes">Ir a mensajes</Link>
        </div>
      </div>
    </div>
  );
}

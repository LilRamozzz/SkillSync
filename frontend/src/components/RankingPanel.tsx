import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/AuthContext';

interface Row { position: number; id: number; name: string; university: string; given: number; rating: number }
interface Data { top: Row[]; me: Row | null; total: number }

function Stars({ value }: { value: number }) {
  return <span className="stars" style={{ ['--v' as string]: `${(value / 5) * 100}%` } as React.CSSProperties} aria-label={`${value} de 5`}>★★★★★</span>;
}

export default function RankingPanel() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => { api.get<Data>('/api/ranking').then(setData).catch(() => {}); }, []);

  const contact = async (id: number) => {
    setBusy(id);
    try {
      const r = await api.post<{ conversationId: number }>('/api/matches', { user_id: id });
      nav(`/mensajes?c=${r.conversationId}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pos = data?.me?.position ?? 0;
  return (
    <aside className="card rank-panel">
      <h3>Ranking de asesores</h3>
      <p className="hint" style={{ margin: 0 }}>Los 10 con más asesorías dadas.</p>
      {!data && <p className="muted">Cargando ranking…</p>}
      {data && data.top.length === 0 && <p className="muted">Aún no hay asesores en el ranking.</p>}
      <ol className="rank-list">
        {data?.top.map((r) => {
          const mine = r.id === user?.id;
          return (
            <li key={r.id} className={`rank-item ${mine ? 'me' : ''}`}>
              <span className={`pos ${r.position <= 3 ? `p${r.position}` : ''}`}>TOP {r.position}</span>
              <div className="rank-info">
                <div className="rank-name">{r.name}</div>
                <div className="rank-uni">{r.university}</div>
                <div className="rank-stars"><Stars value={r.rating} /> <span>({r.given} asesorías)</span></div>
              </div>
              {mine
                ? <span className="you">Tú</span>
                : <button className="btn btn-sm" disabled={busy === r.id} onClick={() => contact(r.id)}>Contactar</button>}
            </li>
          );
        })}
      </ol>
      {data && data.me && pos > 10 && (
        <div className="rank-me">Tu posición: <strong>TOP {pos > 100 ? '100+' : pos}</strong></div>
      )}
      {data && !data.me && (
        <div className="rank-me">Agrega lo que puedes enseñar en tu perfil para entrar al ranking.</div>
      )}
    </aside>
  );
}
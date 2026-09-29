import { useState } from 'react';
import type { MatchView } from '../types';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

export function MatchCard({ m }: { m: MatchView }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      const data = await api.post<{ conversationId: number }>('/api/matches', { user_id: m.user.id });
      nav(`/mensajes?c=${data.conversationId}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card match">
      <div className="match-head">
        <span className="avatar">{m.user.first_name.charAt(0)}</span>
        <div>
          <div className="match-name">{m.user.first_name} {m.user.last_name}</div>
          <div className="match-meta">{m.user.career || 'Estudiante'} · {m.user.university_name}</div>
        </div>
        <div className="compat">
          <strong>{m.compatibility}%</strong>
          <span>compatibilidad de conocimientos</span>
        </div>
      </div>

      <div>
        {m.bidirectional
          ? <span className="badge badge-bi">Intercambio mutuo</span>
          : <span className="badge badge-uni">Coincidencia parcial</span>}
      </div>

      <div className="why">
        <div className="row">
          <span className="row-label">Tú puedes enseñarle:</span>
          <strong>{m.youCanTeachThem.length ? m.youCanTeachThem.join(', ') : '—'}</strong>
        </div>
        <div className="row">
          <span className="row-label">Él/ella puede enseñarte:</span>
          <strong>{m.theyCanTeachYou.length ? m.theyCanTeachYou.join(', ') : '—'}</strong>
        </div>
        <div className="exchange">↕</div>
      </div>

      <div>
        <div className="muted">Puede enseñar</div>
        <div className="chips">{m.teach.map((t) => <Chip key={t}>{t}</Chip>)}</div>
      </div>
      <div>
        <div className="muted">Quiere aprender</div>
        <div className="chips">{m.learn.map((l) => <span key={l} className="chip learn">{l}</span>)}</div>
      </div>

      <div className="toolbar">
        <Link className="btn btn-ghost" to={`/perfil/${m.user.id}`}>Ver perfil</Link>
        <button className="btn" disabled={busy} onClick={connect}>
          {busy ? 'Conectando…' : 'Conectar'}
        </button>
      </div>
    </article>
  );
}

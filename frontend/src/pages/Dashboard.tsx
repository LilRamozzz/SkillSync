import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/AuthContext';
import type { MatchView } from '../types';
import { MatchCard } from '../components/MatchCard';
import RankingPanel from '../components/RankingPanel';

export default function Dashboard() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<MatchView[]>('/api/matches')
      .then(setMatches)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = profile?.user.first_name || 'estudiante';
  const learn = profile?.learn || [];
  const filtered = matches.filter((m) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [...m.teach, ...m.learn, m.user.first_name, m.user.last_name].join(' ').toLowerCase().includes(q);
  });

  return (
    <div className="dash">
    <div className="grid">
      <div className="card hero">
        <div>
          <h1>Hola, {firstName}</h1>
          <p>Encuentra estudiantes que necesitan lo que tú sabes y saben lo que tú necesitas aprender.</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>¿Qué quieres aprender?</h3>
        <div className="chips">
          {learn.length ? learn.map((l) => <span key={l} className="chip learn">{l}</span>)
            : <span className="muted">Aún no defines qué quieres aprender. Completa tu perfil.</span>}
        </div>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input placeholder="Buscar por conocimiento, ej. Estadística"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <h2 className="section-title">Personas compatibles contigo</h2>
      {loading && <div className="card muted">Buscando coincidencias…</div>}
      {!loading && filtered.length === 0 && (
        <div className="card muted">
          Sin coincidencias todavía. Agrega más conocimientos que puedes enseñar o quieres aprender en tu perfil.
        </div>
      )}
      <div className="grid">
        {filtered.slice(0, 6).map((m) => <MatchCard key={m.user.id} m={m} />)}
      </div>
    </div>
    <RankingPanel />
    </div>
  );
}
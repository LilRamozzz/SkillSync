import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { MatchView } from '../types';
import { MatchCard } from '../components/MatchCard';

export default function Matches() {
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<MatchView[]>('/api/matches')
      .then((all) => setMatches(all.filter((m) => m.bidirectional)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Mis conexiones</h2>
        <p className="hint">
          Estudiantes con quienes puedes intercambiar conocimientos: tú les enseñas algo
          y ellos te enseñan algo.
        </p>
      </div>
      {loading && <div className="card muted">Cargando matches…</div>}
      {!loading && matches.length === 0 && (
        <div className="card muted">Aún no tienes conexiones de intercambio. Explora la sección Descubrir.</div>
      )}
      <div className="grid grid-2">
        {matches.map((m) => <MatchCard key={m.user.id} m={m} />)}
      </div>
    </div>
  );
}

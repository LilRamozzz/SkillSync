import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { MatchView } from '../types';
import { MatchCard } from '../components/MatchCard';

export default function Discover() {
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [career, setCareer] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (name.trim()) params.set('name', name.trim());
      if (university.trim()) params.set('university', university.trim());
      if (career.trim()) params.set('career', career.trim());
      if (knowledge.trim()) params.set('knowledge', knowledge.trim());
      const q = params.toString();
      const data = await api.get<MatchView[]>(`/api/matches/discover${q ? `?${q}` : ''}`);
      setMatches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Descubrir</h2>
        <p className="hint">Busca asesores por nombre, universidad, carrera o conocimiento.</p>
        <div className="toolbar">
          <input placeholder="Buscar asesor por nombre" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} />
          <input placeholder="Universidad" value={university} onChange={(e) => setUniversity(e.target.value)} />
          <input placeholder="Carrera" value={career} onChange={(e) => setCareer(e.target.value)} />
          <input placeholder="Conocimiento (ej. Java)" value={knowledge} onChange={(e) => setKnowledge(e.target.value)} />
          <button className="btn" onClick={load}>Buscar</button>
        </div>
      </div>

      {loading && <div className="card muted">Buscando…</div>}
      {!loading && matches.length === 0 && (
        <div className="card muted">Sin resultados con esos filtros. Prueba con otra búsqueda.</div>
      )}
      <div className="grid grid-2">
        {matches.map((m) => <MatchCard key={m.user.id} m={m} />)}
      </div>
    </div>
  );
}
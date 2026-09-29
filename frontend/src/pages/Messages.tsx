import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/AuthContext';
import type { ConversationView, MessageView } from '../types';

const QUICK = ['¡Hola! Me interesa coordinar contigo', '¿Qué días tienes libres?', '¡Gracias!'];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MODES = ['Google Meet', 'Zoom', 'Presencial'];

export default function Messages() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = Number(params.get('c') || 0) || null;
  const [convs, setConvs] = useState<ConversationView[]>([]);
  const [msgs, setMsgs] = useState<MessageView[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [showSession, setShowSession] = useState(false);
  const [day, setDay] = useState(DAYS[0]);
  const [time, setTime] = useState('18:00');
  const [mode, setMode] = useState(MODES[0]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvs = async () => {
    const data = await api.get<ConversationView[]>('/api/conversations');
    setConvs(data);
    if (!activeId && data.length > 0) setParams({ c: String(data[0].id) });
  };

  useEffect(() => { loadConvs().catch(() => {}); }, []);

  useEffect(() => {
    if (!activeId) return;
    api.get<MessageView[]>(`/api/conversations/${activeId}/messages`)
      .then(setMsgs)
      .catch((e) => setError((e as Error).message));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const post = async (body: string) => {
    if (!body.trim() || !activeId) return;
    setError('');
    try {
      await api.post(`/api/conversations/${activeId}/messages`, { body });
      const fresh = await api.get<MessageView[]>(`/api/conversations/${activeId}/messages`);
      setMsgs(fresh);
      loadConvs().catch(() => {});
      return true;
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await post(draft)) setDraft('');
  };

  const sendSession = async () => {
    const ok = await post(`Propongo una sesión el ${day} a las ${time} por ${mode}. ¿Te parece bien?`);
    if (ok) setShowSession(false);
  };

  const active = convs.find((c) => c.id === activeId);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Mensajes</h2>
        <p className="hint">Coordina con tus conexiones qué van a aprender, cuándo y por dónde.</p>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="chat-layout">
        <div className="card">
          <h4 style={{ marginTop: 0 }}>Conversaciones</h4>
          {convs.length === 0 && <p className="muted">Sin conversaciones. Conecta con alguien desde Descubrir.</p>}
          {convs.map((c) => (
            <div key={c.id}
              className={`conv ${c.id === activeId ? 'active' : ''}`}
              onClick={() => setParams({ c: String(c.id) })}>
              <strong>{c.other.first_name} {c.other.last_name}</strong><br />
              <small>{c.other.career} · {c.other.university_name}</small><br />
              <small>{c.lastMessage ? `“${c.lastMessage.slice(0, 60)}”` : 'Sin mensajes'}</small>
            </div>
          ))}
        </div>
        <div className="card">
          {!active && <p className="muted">Selecciona una conversación.</p>}
          {active && (
            <>
              <div className="chat-head">
                <span className="avatar">{active.other.first_name.charAt(0)}</span>
                <div>
                  <h4>{active.other.first_name} {active.other.last_name}</h4>
                  <span className="muted">{active.other.career} · {active.other.university_name}</span>
                </div>
                <div className="actions">
                  <Link className="btn btn-ghost btn-sm" to={`/perfil/${active.other.id}`}>Ver perfil</Link>
                  <button className="btn btn-sm" type="button" onClick={() => setShowSession(!showSession)}>Proponer sesión</button>
                </div>
              </div>

              <div className="bubbles">
                {msgs.length === 0 && <p className="muted">Aún no hay mensajes. Usa una respuesta rápida para empezar.</p>}
                {msgs.map((m) => (
                  <div key={m.id} className={`bubble ${m.sender_id === user?.id ? 'me' : 'them'}`}>
                    <div style={{ fontSize: 11, opacity: 0.75 }}>{m.sender_name}</div>
                    {m.body}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {showSession && (
                <div className="session-box">
                  <h5>Proponer una sesión</h5>
                  <div className="toolbar">
                    <select value={day} onChange={(e) => setDay(e.target.value)} aria-label="Día">
                      {DAYS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Hora" />
                    <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Medio">
                      {MODES.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="toolbar">
                    <button className="btn btn-sm" type="button" onClick={sendSession}>Enviar propuesta</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowSession(false)}>Cancelar</button>
                  </div>
                </div>
              )}

              <div className="quick">
                {QUICK.map((q) => <button key={q} type="button" onClick={() => setDraft(q)}>{q}</button>)}
              </div>
              <form className="chat-input" onSubmit={send}>
                <input placeholder="Escribe un mensaje…" value={draft} onChange={(e) => setDraft(e.target.value)} />
                <button className="btn" type="submit">Enviar</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
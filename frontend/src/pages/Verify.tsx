import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/AuthContext';
import type { PublicUser } from '../types';

export default function Verify() {
  const nav = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState(sessionStorage.getItem('skillsync_pending_email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const demoCode = sessionStorage.getItem('skillsync_demo_code') || '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.post<{ user: PublicUser; token: string }>('/api/auth/verify', { email, code });
      sessionStorage.removeItem('skillsync_pending_email');
      sessionStorage.removeItem('skillsync_demo_code');
      setSession(data.user, data.token);
      nav('/perfil');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Verifica tu correo institucional</h2>
        <p className="hint">
          Te enviamos un código de 6 dígitos a tu correo universitario.
          Ingrésalo para activar tu cuenta.
        </p>
        {demoCode && (
          <div className="ok">
            <strong>Prototipo (verificación simulada):</strong> tu código es
            <div className="code-box" style={{ marginTop: 8 }}>{demoCode}</div>
          </div>
        )}
        {error && <div className="error">{error}</div>}
        <form className="form" onSubmit={submit}>
          <label>Correo institucional<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Código de verificación<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required /></label>
          <button className="btn" disabled={busy}>{busy ? 'Verificando…' : 'Verificar'}</button>
        </form>
        <p className="hint">✓ Al verificar, podrás continuar con la creación de tu perfil académico.</p>
      </div>
    </div>
  );
}

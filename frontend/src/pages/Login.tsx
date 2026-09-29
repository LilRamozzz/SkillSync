import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('leonardo.ramos@utp.edu.pe');
  const [password, setPassword] = useState('Password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      nav('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Bienvenido a SkillSync</h2>
        <p className="hint">Encuentra estudiantes que necesitan lo que tú sabes y saben lo que tú necesitas aprender.</p>
        {error && <div className="error">{error}</div>}
        <form className="form" onSubmit={submit}>
          <label>Correo institucional<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="btn" disabled={busy}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
        </form>
        <p className="hint">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
        <div className="ok">
          <strong>Usuarios demo</strong> (clave: <code>Password123</code>)<br />
          leonardo.ramos@utp.edu.pe · carlos.mendoza@unmsm.edu.pe<br />
          andrea.torres@pucp.edu.pe · miguel.quispe@upc.edu.pe
        </div>
      </div>
    </div>
  );
}

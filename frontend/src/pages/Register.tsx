import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', institutional_email: '',
    university_name: '', password: '', confirm_password: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.post<{ verification_code: string }>(
        '/api/auth/register', form);
      // Prototipo: guardamos email + código mock para la pantalla de verificación
      sessionStorage.setItem('skillsync_pending_email', form.institutional_email.trim().toLowerCase());
      sessionStorage.setItem('skillsync_demo_code', data.verification_code);
      nav('/verificar');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Crear tu cuenta</h2>
        <p className="hint">
          Regístrate con tu <strong>correo institucional universitario</strong>.{' '}
          Ejemplo: <code>nombre.apellido@universidad.edu.pe</code>
        </p>
        {error && <div className="error">{error}</div>}
        <form className="form" onSubmit={submit}>
          <div className="grid grid-2">
            <label>Nombre<input value={form.first_name} onChange={set('first_name')} required /></label>
            <label>Apellido<input value={form.last_name} onChange={set('last_name')} required /></label>
          </div>
          <label>
            Correo institucional
            <input type="email" placeholder="nombre.apellido@universidad.edu.pe"
              value={form.institutional_email} onChange={set('institutional_email')} required />
          </label>
          <label>
            Universidad / institución
            <input placeholder="Ej. Universidad Tecnológica del Perú (UTP)"
              value={form.university_name} onChange={set('university_name')} required />
          </label>
          <div className="grid grid-2">
            <label>Contraseña (mín. 8)<input type="password" value={form.password} onChange={set('password')} required /></label>
            <label>Confirmar contraseña<input type="password" value={form.confirm_password} onChange={set('confirm_password')} required /></label>
          </div>
          <button className="btn" disabled={busy}>{busy ? 'Registrando…' : 'Registrarse'}</button>
        </form>
        <p className="hint">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </div>
  );
}

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const P: Record<string, JSX.Element> = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.6 3.5 6" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
};
function Icon({ name }: { name: string }) {
  return <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name]}</svg>;
}

const ITEMS: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/descubrir', label: 'Descubrir', icon: 'search' },
  { to: '/matches', label: 'Mis conexiones', icon: 'people' },
  { to: '/mensajes', label: 'Mensajes', icon: 'chat' },
  { to: '/perfil', label: 'Mi perfil', icon: 'user' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const onLogout = () => { logout(); nav('/login'); };

  const brand = (
    <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
      <span className="brand-mark">S</span>
      <span>SkillSync</span>
    </Link>
  );

  if (!user) {
    return (
      <div className="shell">
        <header className="topbar">
          {brand}
          <div className="topbar-right">
            <Link to="/login">Entrar</Link>
            <Link to="/registro" className="btn" style={{ textDecoration: 'none' }}>Crear cuenta</Link>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    );
  }

  return (
    <div className="shell with-side">
      <aside className="side">
        {brand}
        <nav className="side-nav">
          {ITEMS.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}>
              <Icon name={i.icon} />{i.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-user">
          <span className="avatar">{user.first_name.charAt(0).toUpperCase()}</span>
          <strong>{user.first_name}</strong>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Salir</button>
        </div>
      </aside>
      <div className="content">
        <main className="main">{children}</main>
      </div>
      <nav className="mobile-nav">
        {ITEMS.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end}>
            <Icon name={i.icon} />{i.label.replace('Mis conexiones', 'Conexiones')}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
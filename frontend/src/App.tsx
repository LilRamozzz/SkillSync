import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Matches from './pages/Matches';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';

function Guard({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Layout><div className="card">Cargando…</div></Layout>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/verificar" element={<Verify />} />
            <Route path="/" element={<Guard><Dashboard /></Guard>} />
            <Route path="/descubrir" element={<Guard><Discover /></Guard>} />
            <Route path="/matches" element={<Guard><Matches /></Guard>} />
            <Route path="/mensajes" element={<Guard><Messages /></Guard>} />
            <Route path="/perfil" element={<Guard><Profile /></Guard>} />
            <Route path="/perfil/:id" element={<Guard><PublicProfile /></Guard>} />
            <Route path="*" element={<div className="card">Página no encontrada.</div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
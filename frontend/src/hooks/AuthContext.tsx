import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';
import type { PublicUser, ProfileFull } from '../types';

interface AuthState {
  user: PublicUser | null;
  profile: ProfileFull | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setSession: (user: PublicUser, token: string) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const token = localStorage.getItem('skillsync_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const p = await api.get<ProfileFull>('/api/profile');
      setProfile(p);
      setUser(p.user);
    } catch {
      localStorage.removeItem('skillsync_token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: PublicUser; token: string }>('/api/auth/login', { email, password });
    localStorage.setItem('skillsync_token', data.token);
    setUser(data.user);
    await refreshProfile();
  };

  const setSession = (u: PublicUser, token: string) => {
    localStorage.setItem('skillsync_token', token);
    setUser(u);
    refreshProfile();
  };

  const logout = () => {
    localStorage.removeItem('skillsync_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <Ctx.Provider value={{ user, profile, token: localStorage.getItem('skillsync_token'), loading, login, logout, refreshProfile, setSession }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth fuera de AuthProvider');
  return v;
}

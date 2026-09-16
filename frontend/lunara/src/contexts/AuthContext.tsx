import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Account, RoleCode } from '@/types';
import { api, googleLogin } from '@/lib/api';

interface AuthContextType {
  user: Account | null;
  role: RoleCode;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  hasPermission: (allowedRoles: RoleCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Account>('/api/v1/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try { await api('/api/v1/auth/logout', { method: 'POST' }); } finally { setUser(null); }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.roleCode || 'CUSTOMER',
      isAuthenticated: !!user,
      loading,
      login: googleLogin,
      logout,
      hasPermission: (allowedRoles) => !!user && allowedRoles.includes(user.roleCode),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

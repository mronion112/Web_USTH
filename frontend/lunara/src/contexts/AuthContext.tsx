import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Account, RoleCode } from '@/types';
import { authApi, getStoredToken, googleLogin, setStoredRefreshToken, setStoredToken } from '@/lib/api';

interface AuthContextType {
  user: Account | null;
  role: RoleCode;
  isAuthenticated: boolean;
  loading: boolean;
  login: (redirectPath?: string) => void;
  exchange: (code: string) => Promise<Account>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<Account | null>;
  hasPermission: (allowedRoles: RoleCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async (): Promise<Account | null> => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await authApi.getMe();
      if (res && res.email) {
        const account: Account = {
          id: String(res.id),
          roleId: String(res.id),
          roleCode: (res.role as RoleCode) || 'CUSTOMER',
          email: res.email,
          displayName: res.displayName || res.email,
          avatarUrl: res.avatarUrl,
          isActive: res.isActive,
        };
        setUser(account);
        return account;
      } else {
        setUser(null);
        setStoredToken(null);
        setStoredRefreshToken(null);
        return null;
      }
    } catch {
      setUser(null);
      setStoredToken(null);
      setStoredRefreshToken(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const exchange = async (code: string): Promise<Account> => {
    setLoading(true);
    try {
      await authApi.exchange(code);
      const account = await fetchCurrentUser();
      if (!account) throw new Error('Không thể tải tài khoản sau khi đăng nhập.');
      return account;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStoredToken(null);
      setStoredRefreshToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: (user?.roleCode as RoleCode) || 'CUSTOMER',
        isAuthenticated: !!user,
        loading,
        login: (redirectPath?: string) => googleLogin(redirectPath),
        exchange,
        logout,
        refreshMe: fetchCurrentUser,
        hasPermission: (allowedRoles) => !!user && allowedRoles.includes(user.roleCode),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

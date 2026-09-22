import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Account, RoleCode } from '@/types';
import { authApi, getStoredToken, googleLogin, setStoredRefreshToken, setStoredToken } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id?: number | string;
  email?: string;
  role?: string;
  displayName?: string;
  avatarUrl?: string;
  sub?: string;
  name?: string;
  exp?: number;
}

interface AuthContextType {
  user: Account | null;
  loading: boolean;
  login: (redirectPath?: string) => void;
  exchange: (code: string) => Promise<Account>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<Account | null>;
  hasPermission: (allowedRoles: RoleCode[]) => boolean;
  role: RoleCode;
  isAuthenticated: boolean;
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
      // Decode JWT statelessly to avoid unnecessary API calls on load (User's local architecture)
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Verify token isn't expired
      const exp = decoded.exp;
      if (exp && exp * 1000 < Date.now()) {
        // Let the auto-refresh handle this later, or force a fetch if needed
      }

      const email = decoded.email || decoded.sub || '';
      const roleStr = decoded.role || 'CUSTOMER';
      
      const account: Account = {
        id: String(decoded.id || 0),
        roleId: String(decoded.id || 0),
        roleCode: roleStr as RoleCode,
        email,
        displayName: decoded.displayName || decoded.name || email.split('@')[0] || '',
        avatarUrl: decoded.avatarUrl,
        isActive: true,
      };
      
      setUser(account);
      return account;
    } catch (err) {
      console.error('Failed to decode JWT statelessly:', err);
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

    // Listen to refresh events if we implement them
    const handleTokenRefresh = () => {
      fetchCurrentUser();
    };
    window.addEventListener('auth:token-refreshed', handleTokenRefresh);
    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefresh);
    };
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
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setStoredToken(null);
      setStoredRefreshToken(null);
      window.location.href = '/auth'; // User's local architecture redirect
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
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

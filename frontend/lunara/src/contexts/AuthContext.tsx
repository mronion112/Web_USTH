import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getAccessToken, clearTokens } from '@/lib/storage';
import { logoutUser } from '@/services/auth.service';
import { googleLogin } from '@/lib/api';
import { RoleCode } from '@/types';

export interface UserPayload {
  id: number;
  email: string;
  role: string;
  displayName: string;
  roleCode?: RoleCode;
  avatarUrl?: string;
}

interface DecodedToken {
  id?: number;
  email?: string;
  role?: string;
  displayName?: string;
  roleCode?: RoleCode;
  avatarUrl?: string;
  sub?: string;
  name?: string;
  exp?: number;
}

interface AuthContextType {
  user: UserPayload | null;
  loading: boolean;
  logout: () => void | Promise<void>;
  role: RoleCode;
  login: () => void;
  isAuthenticated: boolean;
  hasPermission: (allowedRoles: RoleCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        // Verify token isn't expired
        const exp = decoded.exp;
        if (exp && exp * 1000 < Date.now()) {
          throw new Error('Token expired');
        }
        const email = decoded.email || decoded.sub || '';
        const role = decoded.role || 'CUSTOMER';
        const userPayload: UserPayload = {
          id: decoded.id ?? 0,
          email,
          role,
          displayName: decoded.displayName || decoded.name || email.split('@')[0] || '',
          roleCode: role as RoleCode,
          avatarUrl: decoded.avatarUrl,
        };
        setUser(userPayload);
      } catch {
        clearTokens();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    clearTokens();
    setUser(null);
    window.location.href = '/auth'; // Redirect to login
  };

  const role = user?.roleCode || (user?.role as RoleCode) || 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        role,
        login: googleLogin,
        isAuthenticated: !!user,
        hasPermission: (allowedRoles: RoleCode[]) => !!user && allowedRoles.includes(role),
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

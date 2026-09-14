import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Account, RoleCode } from '@/types';

interface AuthContextType {
  user: Account | null;
  role: RoleCode;
  isAuthenticated: boolean;
  login: (role: RoleCode) => void;
  logout: () => void;
  setRole: (role: RoleCode) => void;
  hasPermission: (allowedRoles: RoleCode[]) => boolean;
}

const DEFAULT_USERS: Record<RoleCode, Account> = {
  OWNER: {
    id: 'usr-owner',
    roleId: 'r-1',
    roleCode: 'OWNER',
    email: 'chusp@lunara.vn',
    displayName: 'Hoàng Lan (Chủ Spa)',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    isActive: true
  },
  MANAGER: {
    id: 'usr-manager',
    roleId: 'r-2',
    roleCode: 'MANAGER',
    email: 'quanly@lunara.vn',
    displayName: 'Trần Minh (Quản Lý)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isActive: true
  },
  RECEPTIONIST: {
    id: 'usr-receptionist',
    roleId: 'r-3',
    roleCode: 'RECEPTIONIST',
    email: 'letan@lunara.vn',
    displayName: 'Ngọc Mai (Lễ Tân)',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    isActive: true
  },
  THERAPIST: {
    id: 'usr-therapist',
    roleId: 'r-4',
    roleCode: 'THERAPIST',
    email: 'linh.ktv@lunara.vn',
    displayName: 'Nguyễn Thị Linh (KTV Trưởng)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    isActive: true
  },
  ACCOUNTANT: {
    id: 'usr-accountant',
    roleId: 'r-5',
    roleCode: 'ACCOUNTANT',
    email: 'ketoan@lunara.vn',
    displayName: 'Bích Phương (Kế Toán)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isActive: true
  },
  CUSTOMER: {
    id: 'usr-customer',
    roleId: 'r-6',
    roleCode: 'CUSTOMER',
    email: 'khachhang@gmail.com',
    displayName: 'Nguyễn Văn An',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    isActive: true
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Default to OWNER for full access demo
  const [role, setRoleState] = useState<RoleCode>('OWNER');
  const [user, setUser] = useState<Account | null>(DEFAULT_USERS['OWNER']);

  const login = (newRole: RoleCode) => {
    setRoleState(newRole);
    setUser(DEFAULT_USERS[newRole]);
  };

  const logout = () => {
    setUser(null);
  };

  const setRole = (newRole: RoleCode) => {
    setRoleState(newRole);
    setUser(DEFAULT_USERS[newRole]);
  };

  const hasPermission = (allowedRoles: RoleCode[]) => {
    return allowedRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        login,
        logout,
        setRole,
        hasPermission
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

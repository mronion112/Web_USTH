import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_SECTIONS, ROLE_BASED_SECTIONS, STAFF_NAV } from '@/lib/constants';
import {
  LayoutDashboard,
  Radio,
  CalendarCheck,
  Calendar,
  Users,
  UserCog,
  Sparkles,
  CreditCard,
  Shield,
  BarChart3,
  ClipboardList,
  LogOut
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  Radio,
  CalendarCheck,
  Calendar,
  Users,
  UserCog,
  Sparkles,
  CreditCard,
  Shield,
  BarChart3,
  ClipboardList,
};

export const AdminSidebar: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  const { role, user, logout } = useAuth();

  // If role is THERAPIST, show dedicated therapist menu
  const isTherapist = role === 'THERAPIST';
  const allowedTitles = ROLE_BASED_SECTIONS[role] || [];
  const home = isTherapist ? '/staff/my-work'
    : role === 'ACCOUNTANT' ? '/admin/payments'
      : role === 'RECEPTIONIST' ? '/admin/live' : '/admin/dashboard';

  return (
    <aside className="w-64 bg-[#14271C] text-[#D9E5DC] flex flex-col h-full border-r border-[#2E4A37] select-none font-body">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-[#2E4A37] justify-between">
        <Link to={home} className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-white tracking-tight">
            Lunara
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold mt-1 px-1.5 py-0.5 rounded bg-[#C5A880]/10">
            Admin
          </span>
        </Link>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-6 py-3 bg-[#1E3B2B]/40 border-b border-[#2E4A37] flex items-center justify-between text-xs">
        <span className="text-[#8EAA97]">Vai trò:</span>
        <span className="font-semibold text-[#C5A880] bg-[#C5A880]/10 px-2 py-0.5 rounded-full">
          {role}
        </span>
      </div>

      {/* Nav Menu Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {isTherapist ? (
          /* Dedicated Therapist Menu */
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EAA97] px-3">
              KỸ THUẬT VIÊN
            </span>
            <div className="mt-2 space-y-1">
              {STAFF_NAV.map((item) => {
                const IconComponent = item.iconName ? ICON_MAP[item.iconName] : ClipboardList;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#1E3B2B] text-white font-semibold'
                          : 'text-[#D9E5DC]/80 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {IconComponent && <IconComponent className="h-4 w-4 text-[#8EAA97]" />}
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ) : (
          /* Role-Filtered Admin Sections */
          ADMIN_SECTIONS.map((sec) => {
            const visibleItems = sec.items.filter((item) => allowedTitles.includes(item.title));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sec.section} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EAA97] px-3">
                  {sec.section}
                </span>
                <div className="mt-1 space-y-0.5">
                  {visibleItems.map((item) => {
                    const IconComponent = item.iconName ? ICON_MAP[item.iconName] : LayoutDashboard;
                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-[#1E3B2B] text-white font-semibold'
                              : 'text-[#D9E5DC]/80 hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          {IconComponent && <IconComponent className="h-4 w-4 text-[#8EAA97]" />}
                          <span>{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-[#2E4A37] bg-[#14271C]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80'}
              alt={user?.displayName}
              className="h-8 w-8 rounded-full object-cover border border-[#2E4A37]"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.displayName || 'Quản trị viên'}
              </p>
              <p className="text-[10px] text-[#8EAA97] truncate">{user?.email}</p>
            </div>
          </div>

          <Link
            to="/admin/login"
            onClick={logout}
            className="p-1.5 rounded-lg text-[#8EAA97] hover:text-red-400 hover:bg-white/5 transition-colors"
            title="Đổi vai trò / Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Menu, X, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_HOME } from '@/lib/access-control';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleBookingClick = () => {
    navigate('/booking');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8E3]/60 bg-[#F8F9F5]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-[#14271C] group-hover:text-[#1E3B2B] transition-colors">
            Lunara
          </span>
          <span className="text-[10px] tracking-widest text-[#8EAA97] uppercase font-bold mt-1">
            Sanctuary
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center gap-8 font-body text-sm font-medium text-[#424843]">
          <Link to="/" className="text-[#14271C] hover:text-[#1E3B2B] transition-colors">
            Trang chủ
          </Link>
          <a href="#services" className="hover:text-[#1E3B2B] transition-colors">
            Dịch vụ
          </a>
          <a href="#experience" className="hover:text-[#1E3B2B] transition-colors">
            Trải nghiệm
          </a>
          <a href="#reviews" className="hover:text-[#1E3B2B] transition-colors">
            Đánh giá
          </a>
          {user && user.roleCode !== 'CUSTOMER' && (
            <Link
              to={ROLE_HOME[user.roleCode] || '/admin/dashboard'}
              className="text-xs transition-colors flex items-center gap-1 border px-2.5 py-1 rounded-full bg-[#E8F0EA] border-[#1E3B2B]/30 text-[#1E3B2B] font-semibold hover:bg-[#D9E5DC]"
            >
              <Sparkles className="h-3 w-3 text-[#C5A880]" />
              Quản trị ({user.roleCode})
            </Link>
          )}
        </nav>

        {/* CTA Action - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            onClick={handleBookingClick}
            className="rounded-full px-6 bg-[#1E3B2B] text-white hover:bg-[#14271C] shadow-luxury text-sm cursor-pointer"
          >
            <Calendar className="h-4 w-4 mr-1 text-[#D9E5DC]" />
            Đặt lịch
          </Button>

          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8E3]">
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full object-cover border border-[#D9E5DC]"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#1E3B2B] text-white flex items-center justify-center text-xs font-semibold">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-medium text-[#14271C] max-w-[120px] truncate" title={user.displayName}>
                  {user.displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="text-xs text-[#8EAA97] hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer flex items-center gap-1"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline text-[11px]">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate('/auth?redirect=/booking')}
              className="rounded-full px-5 border-[#D9E5DC] text-[#14271C] hover:bg-[#F8F9F5] text-xs font-medium cursor-pointer"
            >
              Đăng nhập
            </Button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#14271C] hover:bg-[#E2E8E3]/50 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8E3] bg-[#F8F9F5] px-6 py-6 font-body space-y-4 animate-in slide-in-from-top duration-200">
          {user && (
            <div className="pb-3 border-b border-[#E2E8E3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full object-cover border border-[#D9E5DC]"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#1E3B2B] text-white flex items-center justify-center text-xs font-semibold">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-[#14271C]">{user.displayName}</p>
                  <p className="text-[10px] text-[#8EAA97]">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                  navigate('/');
                }}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-[#14271C]"
          >
            Trang chủ
          </Link>
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-[#424843]"
          >
            Dịch vụ
          </a>
          <a
            href="#experience"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-[#424843]"
          >
            Trải nghiệm
          </a>
          <a
            href="#reviews"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-[#424843]"
          >
            Đánh giá
          </a>
          <div className="pt-4 border-t border-[#E2E8E3] flex flex-col gap-3">
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                handleBookingClick();
              }}
              className="w-full rounded-full bg-[#1E3B2B] text-white cursor-pointer"
            >
              Đặt lịch trị liệu ngay
            </Button>
            {user && user.roleCode !== 'CUSTOMER' && (
              <Link
                to={ROLE_HOME[user.roleCode] || '/admin/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-xs text-[#1E3B2B] font-semibold py-1 hover:underline"
              >
                Vào cổng Quản trị ({user.roleCode}) →
              </Link>
            )}
            {!user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth?redirect=/booking');
                }}
                className="text-center text-xs font-medium text-[#1E3B2B] py-1 cursor-pointer"
              >
                Đăng nhập tài khoản Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

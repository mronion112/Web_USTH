import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Menu, X, Calendar } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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
          <Link to="/admin/login" className="text-xs text-[#8EAA97] hover:text-[#1E3B2B] transition-colors flex items-center gap-1 border border-[#D9E5DC] px-2.5 py-1 rounded-full">
            <Sparkles className="h-3 w-3 text-[#C5A880]" /> Quản trị
          </Link>
        </nav>

        {/* CTA Action */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            onClick={() => navigate('/auth')}
            className="rounded-full px-7 bg-[#1E3B2B] text-white hover:bg-[#14271C] shadow-luxury"
          >
            <Calendar className="h-4 w-4 mr-1 text-[#D9E5DC]" />
            Đặt lịch
          </Button>
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
                navigate('/auth');
              }}
              className="w-full rounded-full bg-[#1E3B2B] text-white"
            >
              Đặt lịch trị liệu ngay
            </Button>
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-xs text-[#8EAA97] py-1"
            >
              Đăng nhập cổng Quản trị viên →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

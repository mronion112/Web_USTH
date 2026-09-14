import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Search, Bell, Clock, ExternalLink, Shield } from 'lucide-react';

export const AdminTopBar: React.FC = () => {
  const { user, role, setRole } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/admin/booking');
    }
  };

  return (
    <header className="h-20 bg-white border-b border-[#E2E8E3] px-6 lg:px-8 flex items-center justify-between font-body z-10">
      {/* Search Input (Mã vé / tra cứu nhanh) */}
      <form onSubmit={handleSearch} className="relative w-full max-w-md hidden sm:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tra cứu nhanh mã vé (vd: LNR-001) hoặc tên khách..."
          className="pl-10 h-10 text-xs bg-[#F8F9F5] border-[#E2E8E3] rounded-full focus-visible:ring-[#1E3B2B]"
        />
      </form>

      {/* Right Tools: Live Clock, Role Switcher Demo, Notifications, Profile */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-2 rounded-full bg-[#F8F9F5] px-3.5 py-1.5 border border-[#E2E8E3] text-xs font-semibold text-[#14271C]">
          <Clock className="h-3.5 w-3.5 text-[#1E3B2B]" />
          <span>{currentTime || '14:23:08'}</span>
        </div>

        {/* Demo Role Switcher Quick Pill */}
        <div className="flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1 border border-[#2E7D32]/20 text-xs">
          <Shield className="h-3.5 w-3.5 text-[#2E7D32]" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="bg-transparent text-xs font-semibold text-[#1E3B2B] focus:outline-none cursor-pointer"
          >
            <option value="OWNER">Chủ Spa (Toàn quyền)</option>
            <option value="MANAGER">Quản lý</option>
            <option value="RECEPTIONIST">Lễ tân</option>
            <option value="THERAPIST">Kỹ thuật viên</option>
            <option value="ACCOUNTANT">Kế toán</option>
          </select>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-full text-[#526056] hover:bg-[#F8F9F5] hover:text-[#14271C] transition-colors cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </button>

        {/* View Customer Website link */}
        <button
          onClick={() => navigate('/')}
          className="hidden sm:flex items-center gap-1 text-xs font-medium text-[#526056] hover:text-[#1E3B2B] border border-[#E2E8E3] px-3 py-1.5 rounded-full"
        >
          <span>Xem web khách</span>
          <ExternalLink className="h-3 w-3 text-[#8EAA97]" />
        </button>
      </div>
    </header>
  );
};

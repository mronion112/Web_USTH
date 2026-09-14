import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { RoleCode } from '@/types';
import { Sparkles, Shield, ArrowRight } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleCode>('OWNER');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole);
    if (selectedRole === 'THERAPIST') {
      navigate('/staff/my-work');
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center p-6 font-body">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-1">
        <Link to="/" className="inline-block">
          <span className="font-display text-4xl font-semibold text-[#14271C] tracking-tight">
            Lunara
          </span>
        </Link>
        <p className="text-xs uppercase tracking-widest text-[#8EAA97] font-semibold">
          Hệ Thống Quản Trị Spa
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 border border-[#E2E8E3] shadow-luxury space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-[#1E3B2B] mb-2">
            <Shield className="h-6 w-6 text-[#1E3B2B]" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#14271C]">
            Đăng nhập quản trị
          </h2>
          <p className="text-xs text-[#526056]">
            Cổng quản lý nội bộ dành cho Chủ spa, Quản lý, Lễ tân và Kỹ thuật viên.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Quick Role Selection for Evaluation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#526056] uppercase tracking-wider block">
              Chọn vai trò đăng nhập (Demo):
            </label>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleCode)}
            >
              <option value="OWNER">Chủ Spa (Toàn quyền quản trị & xem báo cáo)</option>
              <option value="MANAGER">Quản Lý (Điều phối nhân sự & dịch vụ)</option>
              <option value="RECEPTIONIST">Lễ Tân (Xem Live, check-in, đặt lịch)</option>
              <option value="THERAPIST">Kỹ Thuật Viên (Xem ca làm việc, nhận khách)</option>
              <option value="ACCOUNTANT">Kế Toán (Quản lý thanh toán & doanh thu)</option>
            </Select>
          </div>

          {/* Google Auth Button */}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-sm shadow-luxury"
          >
            <span>Đăng nhập với Google Workspace</span>
            <ArrowRight className="h-4 w-4 ml-1.5 text-[#C5A880]" />
          </Button>
        </form>

        <div className="pt-4 border-t border-[#E2E8E3] text-center">
          <Link to="/" className="text-xs font-medium text-[#8EAA97] hover:text-[#1E3B2B]">
            ← Quay lại trang chủ khách hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

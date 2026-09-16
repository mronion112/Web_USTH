import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';

export const AdminLoginPage = () => {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center p-6 font-body">
      <Link to="/" className="font-display text-4xl font-semibold text-[#14271C] mb-8">Lunara</Link>
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 border border-[#E2E8E3] shadow-luxury space-y-6 text-center">
        <Shield className="h-12 w-12 text-[#1E3B2B] mx-auto" />
        <h2 className="font-display text-2xl font-semibold text-[#14271C]">Đăng nhập quản trị</h2>
        <p className="text-xs text-[#526056]">Vai trò và quyền được xác định từ tài khoản đã được Lunara cấp, không chọn trên trình duyệt.</p>
        <Button onClick={login} className="w-full h-12 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-sm">
          Đăng nhập với Google <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Link to="/" className="block text-xs text-[#8EAA97]">← Quay lại trang chủ</Link>
      </div>
    </div>
  );
};

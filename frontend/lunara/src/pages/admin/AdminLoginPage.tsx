import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import { ROLE_HOME } from '@/lib/access-control';

export const AdminLoginPage = () => {
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && user.roleCode !== 'CUSTOMER') {
      navigate(ROLE_HOME[user.roleCode] || '/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center p-6 font-body">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E3B2B] border-t-transparent mb-3" />
        <p className="text-xs text-[#526056]">Đang kiểm tra quyền truy cập…</p>
      </div>
    );
  }

  // If already logged in as a non-customer, don't flash login UI
  if (user && user.roleCode !== 'CUSTOMER') {
    return null;
  }

  // If logged in as customer, explain clearly and provide switch button
  if (user && user.roleCode === 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center p-6 font-body">
        <Link to="/" className="font-display text-4xl font-semibold text-[#14271C] mb-8">Lunara</Link>
        <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 border border-[#E2E8E3] shadow-luxury space-y-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#14271C]">Phân quyền truy cập</h2>
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs text-amber-900 leading-relaxed text-left space-y-1">
            <p className="font-semibold text-amber-950">
              Đang đăng nhập: {user.displayName} ({user.email})
            </p>
            <p className="text-amber-800">
              Tài khoản của bạn hiện là <strong>Khách hàng</strong> và chưa được cấp quyền quản trị. Để truy cập hệ thống quản lý, vui lòng đăng nhập bằng tài khoản Google quản trị viên/nhân viên Lunara.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => logout().then(() => login('/admin'))}
              className="w-full h-12 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-sm cursor-pointer"
            >
              Đổi tài khoản Google khác <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/booking')}
              className="w-full h-12 rounded-xl border-[#D9E5DC] text-[#14271C] hover:bg-[#F8F9F5] font-semibold text-sm cursor-pointer"
            >
              Tiếp tục đặt lịch spa
            </Button>
          </div>

          <Link to="/" className="block text-xs text-[#8EAA97] hover:underline pt-2">← Quay lại trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center p-6 font-body">
      <Link to="/" className="font-display text-4xl font-semibold text-[#14271C] mb-8">Lunara</Link>
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 border border-[#E2E8E3] shadow-luxury space-y-6 text-center">
        <Shield className="h-12 w-12 text-[#1E3B2B] mx-auto" />
        <h2 className="font-display text-2xl font-semibold text-[#14271C]">Đăng nhập hệ thống</h2>
        <p className="text-xs text-[#526056]">Đăng nhập bằng Google SSO với tài khoản đã được Lunara cấp quyền.</p>

        <Button
          onClick={() => login('/admin')}
          className="w-full h-12 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-sm cursor-pointer"
        >
          Đăng nhập với Google <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <Link to="/" className="block text-xs text-[#8EAA97] hover:underline">← Quay lại trang chủ</Link>
      </div>
    </div>
  );
};

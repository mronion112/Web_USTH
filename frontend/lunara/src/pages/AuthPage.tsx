import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { IMAGES } from '@/lib/assets';

export const AuthPage: React.FC = () => {
  const { login } = useAuth();

  const handleGoogleAuth = () => login();

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col font-body">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-white border border-[#E2E8E3] overflow-hidden shadow-luxury">
          {/* Left Decorative Image Column */}
          <div className="relative hidden md:block bg-[#14271C] overflow-hidden p-10 flex flex-col justify-between">
            <img
              src={IMAGES.hero.spaAmbience}
              alt="Lunara sanctuary"
              className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity"
            />
            <div className="relative z-10">
              <span className="font-display text-2xl font-semibold text-white tracking-tight">
                Lunara
              </span>
              <p className="text-[11px] uppercase tracking-widest text-[#8EAA97] font-semibold">
                Sanctuary Portal
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              <blockquote className="font-display text-2xl text-white italic leading-snug">
                "Nơi cơ thể được lắng nghe và tâm hồn tìm lại sự tĩnh tại nguyên bản."
              </blockquote>
              <div className="space-y-2 text-xs text-[#D9E5DC]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#C5A880]" />
                  <span>Xác nhận lịch tức thì & bảo lưu thời gian riêng tư</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#C5A880]" />
                  <span>Không phát sinh phụ phí tại spa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Auth Action Column */}
          <div className="p-8 sm:p-12 flex flex-col justify-center text-center space-y-8">
            <div className="space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F5E9] text-[#2E7D32] mb-2 mx-auto">
                <Sparkles className="h-6 w-6 text-[#1E3B2B]" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-[#14271C]">
                Chào mừng quý khách
              </h2>
              <p className="text-xs sm:text-sm text-[#526056] max-w-xs mx-auto">
                Đăng nhập bằng tài khoản Google để tiếp tục đặt lịch hẹn và lưu giữ quyền lợi thành viên.
              </p>
            </div>

            {/* Google Login Button */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border border-[#D9E5DC] bg-white px-6 py-3.5 text-sm font-semibold text-[#14271C] shadow-xs hover:bg-[#F8F9F5] hover:border-[#1E3B2B] transition-all cursor-pointer group"
              >
                {/* Official Google SVG Icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="group-hover:text-[#1E3B2B]">Tiếp tục với Google</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8EAA97]">
                <Shield className="h-3.5 w-3.5" />
                <span>Bảo mật dữ liệu tuyệt đối theo tiêu chuẩn Google OAuth</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8E3] text-xs text-[#6B726C]">
              Cần hỗ trợ đặt lịch qua điện thoại? Gọi hotline{' '}
              <a href="tel:0912888999" className="font-semibold text-[#1E3B2B] hover:underline">
                0912 888 999
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

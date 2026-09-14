import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#14271C] text-white pt-20 pb-12 font-body relative overflow-hidden">
      {/* Subtle glow background element */}
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#1E3B2B]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-[#2E4A37]">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <span className="font-display text-3xl font-semibold tracking-tight text-white">
              Lunara
            </span>
            <p className="text-xs uppercase tracking-widest text-[#8EAA97] font-semibold">
              Serene Botanical Sanctuary
            </p>
            <p className="text-sm text-[#D9E5DC]/80 max-w-md leading-relaxed">
              Khởi nguồn từ sự an yên của thiên nhiên và liệu pháp trị liệu hữu cơ thượng hạng. Nơi tâm trí được tĩnh lặng, cơ thể được hồi sinh và từng giác quan được nuông chiều trọn vẹn.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#C5A880]">
              <Sparkles className="h-4 w-4" />
              <span>Độc quyền chuẩn mực Organic Luxury Spa Hospitality</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8EAA97]">
              Dịch vụ tiêu biểu
            </h4>
            <ul className="space-y-2.5 text-sm text-[#D9E5DC]/80">
              <li><Link to="/booking" className="hover:text-white transition-colors">Massage Thư Giãn Thảo Mộc</Link></li>
              <li><Link to="/booking" className="hover:text-white transition-colors">Chăm Sóc Da Mặt Chuyên Sâu</Link></li>
              <li><Link to="/booking" className="hover:text-white transition-colors">Trị Liệu Đá Nóng Himalaya</Link></li>
              <li><Link to="/booking" className="hover:text-white transition-colors">Gói VIP Suite Riêng Biệt</Link></li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8EAA97]">
              Thông tin liên hệ
            </h4>
            <p className="text-sm text-[#D9E5DC]/80">
              Số 88 Phố Hoàng Cầu, Đống Đa, Hà Nội
            </p>
            <p className="text-sm text-[#D9E5DC]/80">
              Hotline: <span className="text-white font-semibold">0912 888 999</span>
            </p>
            <p className="text-xs text-[#8EAA97]">
              Giờ đón khách: 09:00 - 21:00 (Mỗi ngày)
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8EAA97] gap-4">
          <p>© 2026 Lunara Spa. Bảo lưu mọi quyền.</p>
          <p className="flex items-center gap-1">
            Thiết kế với <Heart className="h-3.5 w-3.5 text-[#C5A880] fill-[#C5A880]" /> cho sức khỏe & sự tĩnh tâm
          </p>
        </div>
      </div>
    </footer>
  );
};

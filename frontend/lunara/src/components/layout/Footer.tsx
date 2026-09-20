import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Clock, Phone, Mail, MessageCircle, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#14271C] text-white pt-16 pb-12 font-body relative overflow-hidden border-t border-[#2E4A37]">
      {/* Subtle ambient glow element */}
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#1E3B2B]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#2E4A37]">
          {/* Brand Col */}
          <div className="md:col-span-1 lg:col-span-1 space-y-3.5">
            <span className="font-display text-3xl font-semibold tracking-tight text-white">
              Lunara
            </span>
            <p className="text-xs uppercase tracking-widest text-[#8EAA97] font-semibold">
              Botanical Sanctuary Spa
            </p>
            <p className="text-xs sm:text-sm text-[#D9E5DC]/80 leading-relaxed">
              Khởi nguồn từ sự an yên của thiên nhiên và liệu pháp trị liệu thảo mộc hữu cơ. Nơi tâm trí được tĩnh lặng, cơ thể được hồi sinh và từng giác quan được nuông chiều trọn vẹn.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-[#C5A880]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chuẩn mực Organic Luxury Spa Hospitality</span>
            </div>
          </div>

          {/* Featured Real Services */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8EAA97]">
              Liệu trình tiêu biểu
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#D9E5DC]/80">
              <li>
                <Link to="/booking" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Massage đá nóng bazan</span>
                  <span className="text-[11px] text-[#C5A880]">90 phút</span>
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Cấp ẩm chuyên sâu da mặt</span>
                  <span className="text-[11px] text-[#C5A880]">60 phút</span>
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Trị liệu đầu, cổ & vai gáy</span>
                  <span className="text-[11px] text-[#C5A880]">45 phút</span>
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Massage & ngâm chân thảo dược</span>
                  <span className="text-[11px] text-[#C5A880]">45 phút</span>
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Phục hồi da cao cấp</span>
                  <span className="text-[11px] text-[#C5A880]">90 phút</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Contact & Hours (from Knowledge Base) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8EAA97]">
              Thông tin liên hệ
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-[#D9E5DC]/80">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                <span>Hotline: <strong className="text-white font-medium">1900 0000</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                <span>Email: <strong className="text-white font-medium">hello@lunara-spa.demo</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                <span>Zalo OA: <strong className="text-white font-medium">Lunara Spa</strong></span>
              </p>
              <p className="flex items-start gap-2 pt-1 border-t border-[#2E4A37]/80 text-xs text-[#8EAA97]">
                <Clock className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                <span>Giờ mở cửa: <strong>09:00 – 21:00</strong> hằng ngày (Nhận lịch cuối lúc <strong>19:30</strong>)</span>
              </p>
            </div>
          </div>

          {/* Official Spa Policies (from Knowledge Base) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8EAA97]">
              Chính sách minh bạch
            </h4>
            <ul className="space-y-2 text-xs text-[#D9E5DC]/75 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Miễn phí hủy lịch:</strong> Khi báo trước từ 6 giờ trở lên.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Thanh toán tiện lợi:</strong> Hỗ trợ mã VietQR, thẻ ngân hàng hoặc tại spa.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Biểu phí niêm yết:</strong> Chưa gồm VAT 8% và phí phục vụ 5%.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Tiền tip:</strong> Tự nguyện, không bắt buộc và không tự cộng vào hóa đơn.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8EAA97] gap-3">
          <p>© 2026 Lunara Spa Sanctuary. Tất cả chính sách tuân thủ chuẩn vận hành.</p>
          <p className="flex items-center gap-1">
            Chăm chút với <Heart className="h-3.5 w-3.5 text-[#C5A880] fill-[#C5A880]" /> cho sức khỏe & sự tĩnh tâm
          </p>
        </div>
      </div>
    </footer>
  );
};

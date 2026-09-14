import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Leaf, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { IMAGES } from '@/lib/assets';

export const PhilosophySection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="experience" className="w-full bg-[#F8F9F5] py-24 font-body border-t border-[#E2E8E3]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 space-y-24">
        {/* Block 1: Experience Pure Luxury */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Photos Collage */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="overflow-hidden arch-mask h-64 bg-[#EDEEEA] shadow-luxury">
                <img
                  src={IMAGES.gallery[0]}
                  alt="Aroma botanical oils"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-2xl h-44 bg-[#EDEEEA] shadow-luxury">
                <img
                  src={IMAGES.gallery[1]}
                  alt="Botanical plant therapy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="overflow-hidden rounded-2xl h-44 bg-[#EDEEEA] shadow-luxury">
                <img
                  src={IMAGES.gallery[2]}
                  alt="Skin facial relaxation"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="overflow-hidden arch-mask h-64 bg-[#EDEEEA] shadow-luxury">
                <img
                  src={IMAGES.gallery[3]}
                  alt="Herbal essential oils"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Philosophy Text */}
          <div className="lg:col-span-6 space-y-6 lg:pl-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8EAA97]">
              Triết lý chữa lành
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#14271C]">
              Experience Pure <span className="italic font-normal text-[#1E3B2B]">Luxury</span>
            </h2>
            <p className="text-[#526056] text-base leading-relaxed">
              Mỗi sản phẩm trị liệu tại Lunara là một lời cam kết về vẻ đẹp thanh thuần, vượt thời gian. Chúng tôi chỉ sử dụng thảo dược canh tác tự nhiên, bảo toàn hoạt chất tươi mới để nuôi dưỡng làn da từ tầng sâu tế bào.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#2E7D32]">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#14271C]">Thuần khiết 100%</h4>
                  <p className="text-xs text-[#6B726C] mt-0.5">Không hóa chất tổng hợp, êm dịu cho da.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#2E7D32]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#14271C]">Vệ sinh vô trùng</h4>
                  <p className="text-xs text-[#6B726C] mt-0.5">Quy trình khăn & phòng chuẩn 5 sao.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#2E7D32]">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#14271C]">Chuyên viên tay nghề</h4>
                  <p className="text-xs text-[#6B726C] mt-0.5">Đào tạo bài bản theo liệu pháp Á Đông.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#2E7D32]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#14271C]">Suite riêng tư</h4>
                  <p className="text-xs text-[#6B726C] mt-0.5">Phòng đơn & phòng đôi cách âm tối đa.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => navigate('/booking')}
                className="rounded-full bg-[#1E3B2B] text-white hover:bg-[#14271C] px-7"
              >
                Đặt chỗ ngay hôm nay
                <ArrowRight className="h-4 w-4 ml-2 text-[#C5A880]" />
              </Button>
            </div>
          </div>
        </div>

        {/* Block 2: Deep Green Banner CTA ("Ready To Glamour Yourself Today?") */}
        <div className="rounded-3xl bg-[#14271C] text-white p-12 sm:p-16 text-center space-y-6 relative overflow-hidden shadow-luxury">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold">
              Ready To Glamour <br />
              <span className="italic font-normal text-[#C5A880]">Yourself Today?</span>
            </h3>
            <p className="text-sm text-[#D9E5DC]/80 font-body">
              Dành tặng bản thân một buổi chiều thư thái, trút bỏ mọi muộn phiền nơi ốc đảo thực vật Lunara. Đặt lịch online chỉ trong 2 phút.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => navigate('/auth')}
                className="rounded-full bg-white text-[#14271C] hover:bg-[#F8F9F5] font-semibold px-8 h-12 shadow-md hover:scale-105 transition-all"
              >
                Đặt Lịch Hẹn Ngay
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, ArrowRight, Sparkles } from 'lucide-react';
import { IMAGES } from '@/lib/assets';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-[#F8F9F5] pt-12 pb-24 lg:pt-16 lg:pb-32">
      {/* Giant Watermark Behind Composition */}
      <div className="absolute inset-x-0 bottom-6 pointer-events-none select-none text-center opacity-60">
        <span className="font-display text-[14vw] font-bold tracking-[0.2em] text-watermark whitespace-nowrap">
          S K I N &nbsp; C A R E
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F5E9] border border-[#2E7D32]/20 px-4 py-1.5 text-xs font-semibold text-[#2E7D32] tracking-wide font-body">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A880]" />
              <span>Sanctuary of Serenity & Organic Luxury</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#14271C] leading-[1.1]">
              Glow Skin <br />
              <span className="italic font-normal text-[#1E3B2B]">Naturally</span>
            </h1>

            <p className="font-body text-base sm:text-lg text-[#526056] max-w-lg leading-relaxed">
              Khám phá không gian phục hồi năng lượng nguyên bản. Chúng tôi hòa quyện tinh hoa thảo mộc Á Đông và kỹ nghệ spa đương đại để chăm chút từng phút giây thư thái của bạn.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                onClick={() => navigate('/booking')}
                className="rounded-full h-14 px-8 bg-[#1E3B2B] text-white hover:bg-[#14271C] shadow-luxury text-base font-semibold transition-transform hover:scale-[1.02] cursor-pointer"
              >
                Đặt lịch ngay
                <ArrowRight className="h-4 w-4 ml-2 text-[#C5A880]" />
              </Button>
              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-full h-14 px-8 border border-[#1E3B2B]/40 text-[#14271C] hover:bg-[#1E3B2B]/5 font-semibold text-base transition-colors"
              >
                Khám phá dịch vụ
              </a>
            </div>

            {/* Rating pill */}
            <div className="flex items-center gap-4 pt-4 border-t border-[#E2E8E3]/80">
              <div className="flex items-center text-[#C5A880]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#C5A880]" />
                ))}
              </div>
              <div className="text-sm font-body text-[#14271C]">
                <span className="font-bold">4.9/5</span> điểm đánh giá từ hơn 2,500 khách hàng
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Arched Photo Composition */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Central Arched Mask Portrait */}
              <div className="relative z-10 overflow-hidden arch-mask-lg border-8 border-white shadow-luxury-hover bg-[#EDEEEA] aspect-[3/4]">
                <img
                  src={IMAGES.hero.modelSerum}
                  alt="Lunara Organic Care"
                  className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Floating Highlight Tile Right */}
              <div className="hidden sm:flex absolute -right-6 top-1/4 z-20 w-52 flex-col rounded-2xl bg-white p-3 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95 duration-500">
                <div className="overflow-hidden rounded-xl h-28 w-full bg-[#EDEEEA] mb-3">
                  <img
                    src={IMAGES.hero.facialMask}
                    alt="Facial treatment"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-[11px] font-semibold text-[#14271C] font-body leading-snug">
                  Essential Glamour, Pure Confidence — Timeless Style That Speaks For Itself.
                </p>
              </div>

              {/* Floating Botanical Pill Left */}
              <div className="absolute -left-6 bottom-12 z-20 rounded-full bg-white/95 backdrop-blur-md px-5 py-3 shadow-luxury border border-[#E2E8E3] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
                  <Sparkles className="h-5 w-5 text-[#2E7D32]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#14271C]">100% Organic Herbals</div>
                  <div className="text-[10px] text-[#8EAA97]">Tinh dầu hữu cơ trị liệu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

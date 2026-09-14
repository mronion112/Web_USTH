import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import { MOCK_SERVICES } from '@/data/mock-services';

export const ServicesCollection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const navigate = useNavigate();

  const categories = ['All', 'Massage', 'Facial', 'Body Care', 'VIP Package'];

  const filteredServices = activeCategory === 'All'
    ? MOCK_SERVICES
    : MOCK_SERVICES.filter((s) => s.category === activeCategory);

  return (
    <section id="services" className="w-full bg-[#F8F9F5] py-24 font-body">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8EAA97]">
            Thực đơn trị liệu
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#14271C]">
            Discover Our <span className="italic font-normal text-[#1E3B2B]">Collection</span>
          </h2>
          <p className="text-[#526056] text-sm sm:text-base leading-relaxed">
            Mỗi liệu trình là một hành trình chăm sóc được cá nhân hóa, kết tinh từ dược liệu tinh tuyển và đôi bàn tay điêu luyện của các chuyên viên Lunara.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#1E3B2B] text-white shadow-sm'
                    : 'bg-white text-[#526056] border border-[#D9E5DC] hover:border-[#1E3B2B]'
                }`}
              >
                {cat === 'All' ? 'Tất cả dịch vụ' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Luxury Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="group relative flex flex-col rounded-3xl bg-white border border-[#E2E8E3] overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all duration-300"
            >
              {/* Photo Area with Top Badges */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EDEEEA]">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-white/95 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-[#1E3B2B] shadow-xs">
                    {service.category}
                  </span>
                  {service.isDurationAdjustable && (
                    <span className="rounded-full bg-[#C5A880] text-[#14271C] px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                      Tùy chỉnh giờ
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display text-xl font-semibold text-[#14271C] group-hover:text-[#1E3B2B] transition-colors">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#8EAA97]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.minimumDurationMinutes} phút</span>
                    {service.isDurationAdjustable && (
                      <span className="text-[#C5A880] font-medium">(có thể gia hạn +30p)</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#526056] line-clamp-2 leading-relaxed flex-1">
                  {service.description}
                </p>

                {/* Price & Action Button */}
                <div className="pt-4 border-t border-[#E2E8E3] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#8EAA97] block">Giá khởi điểm</span>
                    <span className="font-display text-lg font-bold text-[#14271C]">
                      {service.basePrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <Button
                    onClick={() => navigate('/booking')}
                    className="rounded-full bg-[#1E3B2B] text-white hover:bg-[#14271C] px-4 py-2 text-xs font-semibold group/btn"
                  >
                    <span>Đặt lịch</span>
                    <ArrowUpRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, ArrowUpRight, Sparkles, Sliders } from 'lucide-react';
import { servicesApi, ApiService } from '@/lib/api';
import { TiltCard } from '@/components/transitions/TiltCard';
import { getServiceIllustration } from '@/lib/assets';

const CATEGORY_LABELS: Record<string, string> = {
  All: 'Tất cả liệu trình',
  FACIAL: 'Chăm sóc Da mặt (Facial)',
  MASSAGE: 'Massage Trị liệu (Massage)',
  BODY: 'Chăm sóc Cơ thể (Body)',
};

/**
 * 11 Active Services accurately mirrored from database/v1/Production/services.csv
 */
const DEFAULT_SERVICES_V1: ApiService[] = [
  {
    id: 1,
    name: 'Chăm sóc da mặt cơ bản',
    category: 'FACIAL',
    description: 'Làm sạch, cân bằng và cấp ẩm cho da.',
    basePrice: 350000,
    minimumDurationMinutes: 60,
    isDurationAdjustable: true,
    durationStepMinutes: 30,
    pricePerDurationStep: 120000,
    preparationBufferMinutes: 10,
    cleanupBufferMinutes: 10,
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'Làm sạch sâu da mặt',
    category: 'FACIAL',
    description: 'Loại bỏ bã nhờn và bụi bẩn trong lỗ chân lông.',
    basePrice: 480000,
    minimumDurationMinutes: 75,
    isDurationAdjustable: false,
    durationStepMinutes: 0,
    pricePerDurationStep: 0,
    preparationBufferMinutes: 10,
    cleanupBufferMinutes: 15,
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 3,
    name: 'Cấp ẩm chuyên sâu da mặt',
    category: 'FACIAL',
    description: 'Liệu trình cấp ẩm chuyên sâu cho da khô.',
    basePrice: 520000,
    minimumDurationMinutes: 60,
    isDurationAdjustable: true,
    durationStepMinutes: 30,
    pricePerDurationStep: 150000,
    preparationBufferMinutes: 10,
    cleanupBufferMinutes: 10,
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 4,
    name: 'Massage thư giãn toàn thân',
    category: 'MASSAGE',
    description: 'Massage toàn thân giúp giảm căng cơ và thư giãn.',
    basePrice: 450000,
    minimumDurationMinutes: 60,
    isDurationAdjustable: true,
    durationStepMinutes: 30,
    pricePerDurationStep: 180000,
    preparationBufferMinutes: 5,
    cleanupBufferMinutes: 10,
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 5,
    name: 'Massage tinh dầu',
    category: 'MASSAGE',
    description: 'Massage với tinh dầu thiên nhiên, giảm mệt mỏi.',
    basePrice: 520000,
    minimumDurationMinutes: 60,
    isDurationAdjustable: true,
    durationStepMinutes: 30,
    pricePerDurationStep: 200000,
    preparationBufferMinutes: 5,
    cleanupBufferMinutes: 10,
    displayOrder: 5,
    isActive: true,
  },
  {
    id: 6,
    name: 'Massage đá nóng',
    category: 'MASSAGE',
    description: 'Dùng đá bazan nóng làm ấm và giảm đau cơ.',
    basePrice: 650000,
    minimumDurationMinutes: 90,
    isDurationAdjustable: false,
    durationStepMinutes: 0,
    pricePerDurationStep: 0,
    preparationBufferMinutes: 10,
    cleanupBufferMinutes: 15,
    displayOrder: 6,
    isActive: true,
  },
  {
    id: 7,
    name: 'Trị liệu đầu, cổ và vai gáy',
    category: 'MASSAGE',
    description: 'Tập trung vùng cổ vai gáy, giảm đau đầu do căng thẳng.',
    basePrice: 280000,
    minimumDurationMinutes: 45,
    isDurationAdjustable: false,
    durationStepMinutes: 0,
    pricePerDurationStep: 0,
    preparationBufferMinutes: 5,
    cleanupBufferMinutes: 5,
    displayOrder: 7,
    isActive: true,
  },
  {
    id: 8,
    name: 'Tẩy tế bào chết toàn thân',
    category: 'BODY',
    description: 'Tẩy da chết và làm mịn da toàn thân.',
    basePrice: 420000,
    minimumDurationMinutes: 60,
    isDurationAdjustable: false,
    durationStepMinutes: 0,
    pricePerDurationStep: 0,
    preparationBufferMinutes: 10,
    cleanupBufferMinutes: 15,
    displayOrder: 8,
    isActive: true,
  },
  {
    id: 9,
    name: 'Ủ dưỡng và chăm sóc cơ thể',
    category: 'BODY',
    description: 'Ủ dưỡng giúp da mềm mại và đều màu.',
    basePrice: 580000,
    minimumDurationMinutes: 75,
    isDurationAdjustable: false,
    durationStepMinutes: 0,
    pricePerDurationStep: 0,
    preparationBufferMinutes: 10,
    cleanupBufferMinutes: 15,
    displayOrder: 9,
    isActive: true,
  },
  {
    id: 10,
    name: 'Chăm sóc và massage bàn chân',
    category: 'BODY',
    description: 'Ngâm chân thảo dược và massage bàn chân.',
    basePrice: 250000,
    minimumDurationMinutes: 45,
    isDurationAdjustable: true,
    durationStepMinutes: 15,
    pricePerDurationStep: 80000,
    preparationBufferMinutes: 5,
    cleanupBufferMinutes: 5,
    displayOrder: 10,
    isActive: true,
  },
  {
    id: 11,
    name: 'Phục hồi da cao cấp',
    category: 'FACIAL',
    description: 'Liệu trình phục hồi chuyên sâu cho da tổn thương.',
    basePrice: 850000,
    minimumDurationMinutes: 90,
    isDurationAdjustable: false,
    durationStepMinutes: 0,
    pricePerDurationStep: 0,
    preparationBufferMinutes: 15,
    cleanupBufferMinutes: 15,
    displayOrder: 11,
    isActive: true,
  },
];

export const ServicesCollection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [services, setServices] = useState<ApiService[]>(DEFAULT_SERVICES_V1);
  const navigate = useNavigate();

  useEffect(() => {
    servicesApi.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Filter only active services
          const activeOnly = data.filter((s) => s.isActive !== false);
          setServices(activeOnly.length > 0 ? activeOnly : DEFAULT_SERVICES_V1);
        }
      })
      .catch((err) => {
        console.warn('Using default v1 services catalog:', err);
      });
  }, []);

  const rawCategories = Array.from(new Set(services.map((s) => s.category).filter(Boolean)));
  const categories = ['All', ...rawCategories];

  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter((s) => s.category === activeCategory);

  return (
    <section id="services" className="w-full bg-[#F8F9F5] py-24 font-body">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            Thực đơn trị liệu chuẩn hóa
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#14271C]">
            Khám phá <span className="italic font-normal text-[#1E3B2B]">Thực đơn Lunara</span>
          </h2>
          <p className="text-[#526056] text-sm sm:text-base leading-relaxed">
            11 liệu trình trị liệu và chăm sóc tinh tuyển từ thảo mộc thiên nhiên, được thiết kế khoa học với thời lượng và kỹ thuật bấm huyệt chuyên sâu mang lại sự thư thái tuyệt đối.
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
                    ? 'bg-[#1E3B2B] text-white shadow-xs'
                    : 'bg-white text-[#526056] border border-[#D9E5DC] hover:border-[#1E3B2B] hover:text-[#1E3B2B]'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Luxury Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => {
            const img = getServiceIllustration(service);

            return (
              <TiltCard
                key={service.id}
                maxTilt={6}
                cardClassName="group relative flex flex-col rounded-3xl bg-white border border-[#E2E8E3] overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all duration-300"
              >
                {/* Photo Area with Top Badges */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EDEEEA]">
                  <img
                    src={img}
                    alt={service.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white/95 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-[#1E3B2B] shadow-xs">
                      {CATEGORY_LABELS[service.category] || service.category}
                    </span>
                    {service.isDurationAdjustable && (
                      <span className="rounded-full bg-[#C5A880] text-[#14271C] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                        <Sliders className="w-3 h-3" />
                        Tùy chỉnh giờ
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-6 space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-display text-xl font-semibold text-[#14271C] group-hover:text-[#1E3B2B] transition-colors line-clamp-1">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#8EAA97]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#C5A880]" />
                        <strong>{service.minimumDurationMinutes || 60} phút</strong>
                      </span>
                      {service.isDurationAdjustable && service.durationStepMinutes ? (
                        <span className="text-[#C5A880] text-[11px] font-medium">
                          (tăng +{service.durationStepMinutes}p)
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-[#526056] line-clamp-2 leading-relaxed flex-1">
                    {service.description || 'Liệu trình thảo mộc cao cấp phục hồi năng lượng tại Lunara Spa.'}
                  </p>

                  {/* Price & Action Button */}
                  <div className="pt-4 border-t border-[#E2E8E3] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#8EAA97] block">
                        Giá cơ bản
                      </span>
                      <span className="font-display text-lg font-bold text-[#14271C]">
                        {Number(service.basePrice).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    <Button
                      onClick={() => navigate('/booking')}
                      className="rounded-full bg-[#1E3B2B] text-white hover:bg-[#14271C] px-4 py-2 text-xs font-semibold group/btn cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>Đặt lịch</span>
                      <ArrowUpRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </Button>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

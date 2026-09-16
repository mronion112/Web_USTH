import React, { useState, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { IMAGES } from '@/lib/assets';

export const CustomerReview: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const reviews = IMAGES.reviews;
  const groupRef = useRef<HTMLDivElement>(null);

  const handleAvatarHover = (hoverIdx: number) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!groupRef.current) return;
    const items = groupRef.current.querySelectorAll<HTMLElement>('.t-avatar');
    const lift = -8;
    const scale = 1.08;
    const falloff = 0.45;

    items.forEach((item, i) => {
      const distance = Math.abs(i - hoverIdx);
      const shift = (lift * Math.pow(falloff, distance)).toFixed(3);
      item.style.setProperty('--shift', `${shift}px`);
      item.style.setProperty('--scale-active', i === hoverIdx ? String(scale) : '1');
    });
  };

  const handleAvatarLeave = () => {
    if (!groupRef.current) return;
    const items = groupRef.current.querySelectorAll<HTMLElement>('.t-avatar');
    items.forEach((item) => {
      item.style.setProperty('--shift', '0px');
      item.style.setProperty('--scale-active', '1');
    });
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="reviews" className="w-full bg-[#14271C] py-24 text-white font-body relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header with Nav Arrows */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8EAA97]">
              Trải nghiệm chân thực
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white mt-2">
              Customer <span className="italic font-normal text-[#C5A880]">Review</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="h-12 w-12 rounded-full border border-[#D9E5DC]/20 flex items-center justify-center hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="h-12 w-12 rounded-full border border-[#D9E5DC]/20 flex items-center justify-center hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Story Circle Avatars with Spring Lift */}
        <div
          ref={groupRef}
          onMouseLeave={handleAvatarLeave}
          className="grid grid-cols-2 sm:grid-cols-5 gap-6 pb-12"
        >
          {reviews.map((rev, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => handleAvatarHover(idx)}
                className={`t-avatar flex flex-col items-center text-center cursor-pointer transition-opacity duration-300 ${
                  isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                }`}
              >
                {/* Avatar with Play Ring */}
                <div className={`relative mb-3 h-20 w-20 sm:h-24 sm:w-24 rounded-full p-1 transition-all ${
                  isSelected ? 'ring-2 ring-[#C5A880] ring-offset-4 ring-offset-[#14271C]' : 'border border-white/20'
                }`}>
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                  <div className="absolute inset-0 m-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-xs text-white">
                    <Play className="h-3 w-3 fill-white ml-0.5" />
                  </div>
                </div>

                <span className="text-sm font-semibold text-white">{rev.name}</span>
                <div className="flex items-center text-[#C5A880] text-xs mt-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-[#C5A880]" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlighted Review Quote Card */}
        <div className="mt-6 rounded-3xl bg-[#1E3B2B]/60 border border-[#8EAA97]/20 p-8 sm:p-12 backdrop-blur-md max-w-4xl mx-auto text-center relative">
          <p className="font-display text-xl sm:text-2xl italic text-[#F8F9F5] leading-relaxed">
            "{reviews[activeIndex].comment}"
          </p>
          <div className="mt-6 flex flex-col items-center">
            <span className="font-semibold text-[#C5A880] text-sm">
              {reviews[activeIndex].name}
            </span>
            <span className="text-xs text-[#8EAA97] mt-0.5">
              Gói dịch vụ: {reviews[activeIndex].treatment}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Clock, CreditCard, HeartHandshake, Sparkles, HelpCircle } from 'lucide-react';

interface FaqItem {
  id: string;
  icon: React.FC<{ className?: string }>;
  question: string;
  answer: string;
  highlight?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'hours-booking',
    icon: Clock,
    question: 'Giờ mở cửa và thời gian đặt lịch trước như thế nào?',
    answer: 'Lunara đón khách từ 09:00 đến 21:00 hằng ngày (kể cả ngày lễ), khung giờ nhận lịch cuối lúc 19:30 để bảo đảm trọn vẹn thời lượng trị liệu. Bạn có thể đặt lịch hẹn trước tối thiểu 2 giờ và tối đa 30 ngày qua website hoặc ứng dụng. Chúng tôi hỗ trợ ghép nhiều liệu trình khác nhau trong cùng một buổi hẹn.',
    highlight: '09:00 – 21:00 hằng ngày • Nhận lịch cuối 19:30',
  },
  {
    id: 'cancellation',
    icon: ShieldCheck,
    question: 'Chính sách hủy hoặc đổi giờ hẹn có mất phí không?',
    answer: 'Chúng tôi luôn thấu hiểu lịch trình của bạn có thể thay đổi: Khi thông báo đổi hoặc hủy lịch trước từ 6 giờ trở lên, bạn được miễn phí hoàn toàn 100%. Nếu hủy dưới 6 giờ trước giờ hẹn, phí áp dụng là 50% giá trị lịch đặt. Trường hợp không đến và không báo trước (No-show), phí tính 100% để đảm bảo thù lao cho chuyên viên đã giữ ca.',
    highlight: 'Miễn phí đổi/hủy trước 6 giờ',
  },
  {
    id: 'pricing-vat',
    icon: CreditCard,
    question: 'Giá dịch vụ đã gồm thuế VAT và tiền tip chưa?',
    answer: 'Giá hiển thị trên thực đơn là giá dịch vụ cơ bản, chưa bao gồm thuế VAT 8% và phí phục vụ 5% (sẽ được thể hiện minh bạch ở bước thanh toán). Tiền tip cho kỹ thuật viên là hoàn toàn tự nguyện tùy theo mức độ hài lòng của bạn, không bắt buộc và không tự cộng vào hóa đơn. Lunara hỗ trợ chuyển khoản quét mã VietQR, thẻ ngân hàng hoặc tiền mặt tại quầy.',
    highlight: 'VAT 8% & Phí phục vụ 5% • Tip tự nguyện',
  },
  {
    id: 'health-pregnancy',
    icon: HeartHandshake,
    question: 'Lưu ý về sức khỏe và phụ nữ mang thai khi trải nghiệm spa?',
    answer: 'Để đảm bảo an toàn tuyệt đối cho mẹ và bé, Lunara không nhận liệu trình cơ thể trong 3 tháng đầu thai kỳ. Từ tháng thứ 4 trở đi, bạn vui lòng tham khảo ý kiến bác sĩ và thông báo trước cho lễ tân để được điều chỉnh tư thế và tinh dầu an toàn. Khách từ 16 tuổi áp dụng liệu trình tiêu chuẩn; khách 12–15 tuổi cần có người giám hộ đi cùng.',
    highlight: 'Chăm sóc an toàn từ tháng thứ 4 thai kỳ',
  },
  {
    id: 'etiquette',
    icon: Sparkles,
    question: 'Tôi cần chuẩn bị gì và nên đến trước giờ hẹn bao lâu?',
    answer: 'Bạn nên đến trước giờ hẹn từ 10 đến 15 phút để thư thái thưởng thức tách trà thảo mộc đón tiếp, điền phiếu tư vấn da và thay trang phục spa thoải mái. Mọi tư trang cá nhân sẽ được cất an toàn trong tủ locker riêng có khóa số.',
    highlight: 'Đến trước 10 - 15 phút để thưởng thức trà chào mừng',
  },
];

export const SpaPoliciesFaq: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('cancellation');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="w-full bg-[#FCFBF9] py-20 font-body border-t border-[#E8DEC9]/60">
      <div className="mx-auto max-w-5xl px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EC] border border-[#C5A880]/30 text-[#8F6E40] text-xs font-semibold uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5 text-[#C5A880]" />
            Chính sách & Câu hỏi thường gặp
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#14271C]">
            Minh bạch <span className="italic font-normal text-[#1E3B2B]">Quy chuẩn Dịch vụ</span>
          </h2>
          <p className="text-[#526056] text-sm leading-relaxed">
            Mọi quy định về đặt lịch, đổi hủy, biểu phí và an toàn sức khỏe được ban hành rõ ràng nhằm đem đến trải nghiệm an tâm tuyệt đối cho quý khách.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => {
            const Icon = item.icon;
            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden bg-white ${
                  isOpen
                    ? 'border-[#1E3B2B]/30 shadow-md ring-1 ring-[#1E3B2B]/10'
                    : 'border-[#E2E8E3] hover:border-[#D5DDD7] shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-[#1E3B2B] text-white'
                          : 'bg-[#FAF8F5] text-stone-600 border border-stone-200/60'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-display font-semibold text-base sm:text-lg text-[#14271C]">
                      {item.question}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.highlight && (
                      <span className="hidden sm:inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                        {item.highlight}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-5 h-5 text-[#8EAA97] transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-[#1E3B2B]' : ''
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-stone-600 text-sm leading-relaxed border-t border-stone-100 animate-fadeIn">
                    <p className="pl-12">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

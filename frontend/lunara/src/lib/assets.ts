/**
 * High-resolution botanical, spa, skincare and portrait photography
 * Curated for Lunara Serene Botanical Sanctuary aesthetic.
 */
export const IMAGES = {
  hero: {
    modelSerum: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
    skincareBottle: "https://images.unsplash.com/photo-1608248597359-2169b8287515?auto=format&fit=crop&w=700&q=80",
    facialMask: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
    spaAmbience: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    botanicalLeaf: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
  },
  services: {
    relaxMassage: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
    facialCare: "https://images.unsplash.com/photo-1512290900672-1f02e604724b?auto=format&fit=crop&w=800&q=80",
    bodyTherapy: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80",
    hotStone: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    bodyScrub: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    vipPackage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
  },
  reviews: [
    {
      name: "Jordyn Bator",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      treatment: "Massage Thư Giãn 90p",
      comment: "Không gian tĩnh lặng tuyệt đối, mùi tinh dầu sả chanh khiến mọi âu lo tan biến. Tay nghề của KTV Linh vô cùng điêu luyện.",
      rating: 5
    },
    {
      name: "Paityn Philips",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      treatment: "Trị Liệu Thảo Dược",
      comment: "Liệu trình chăm sóc da mặt phục hồi thần kỳ sau những ngày làm việc căng thẳng. Tôi sẽ quay lại mỗi tháng!",
      rating: 5
    },
    {
      name: "Maren Bergson",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
      treatment: "Đá Nóng Himalaya",
      comment: "Thiết kế phòng VIP ấm cúng, trà thảo mộc thơm dịu. Trải nghiệm spa 5 sao tuyệt vời nhất tôi từng thử tại Hà Nội.",
      rating: 5
    },
    {
      name: "Adison Stanton",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
      treatment: "Gói VIP Toàn Thân",
      comment: "Quy trình đón tiếp chu đáo từ lễ tân đến chuyên viên. Ứng dụng đặt lịch cực kỳ nhanh chóng và tiện lợi.",
      rating: 5
    },
    {
      name: "Hanna Aminoff",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      treatment: "Chăm Sóc Da Chuyên Sâu",
      comment: "Làn da căng bóng mọng nước ngay sau buổi đầu tiên. Sản phẩm hữu cơ thuần khiết rất êm dịu cho da nhạy cảm.",
      rating: 5
    }
  ],
  gallery: [
    "https://images.unsplash.com/photo-1608248597359-2169b8287515?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1512290900672-1f02e604724b?auto=format&fit=crop&w=600&q=80"
  ]
};

/**
 * Curated authentic photography for all 11 services in database/v1/Production/services.csv
 */
export const SERVICE_PHOTOS: Record<number, string> = {
  // 1: Chăm sóc da mặt cơ bản (FACIAL)
  1: "https://images.unsplash.com/photo-1512290900672-1f02e604724b?auto=format&fit=crop&w=800&q=80",
  // 2: Làm sạch sâu da mặt (FACIAL)
  2: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
  // 3: Cấp ẩm chuyên sâu da mặt (FACIAL)
  3: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
  // 4: Massage thư giãn toàn thân (MASSAGE)
  4: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
  // 5: Massage tinh dầu (MASSAGE)
  5: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80",
  // 6: Massage đá nóng (MASSAGE)
  6: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
  // 7: Trị liệu đầu, cổ và vai gáy (MASSAGE)
  7: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
  // 8: Tẩy tế bào chết toàn thân (BODY)
  8: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
  // 9: Ủ dưỡng và chăm sóc cơ thể (BODY)
  9: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  // 10: Chăm sóc và massage bàn chân (BODY)
  10: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&w=800&q=80",
  // 11: Phục hồi da cao cấp (FACIAL)
  11: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
};

/**
 * Fallback images by category if an unknown service is added
 */
export const CATEGORY_FALLBACK_PHOTOS: Record<string, string> = {
  FACIAL: "https://images.unsplash.com/photo-1512290900672-1f02e604724b?auto=format&fit=crop&w=800&q=80",
  MASSAGE: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
  BODY: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  COMBO: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
};

/**
 * Intelligent helper to resolve the most accurate image for any service
 */
export function getServiceIllustration(service: {
  id?: number | string;
  name?: string;
  category?: string;
  imageUrl?: string | null;
}): string {
  // If service has an external, valid image url (not local placeholder), use it
  if (service.imageUrl && service.imageUrl !== '\\N' && !service.imageUrl.startsWith('/images')) {
    return service.imageUrl;
  }

  // Lookup by numeric ID
  const numId = Number(service.id);
  if (!Number.isNaN(numId) && SERVICE_PHOTOS[numId]) {
    return SERVICE_PHOTOS[numId];
  }

  // Lookup by keyword in name
  const lowerName = (service.name || '').toLowerCase();
  if (lowerName.includes('đá nóng')) return SERVICE_PHOTOS[6];
  if (lowerName.includes('cổ') || lowerName.includes('vai gáy')) return SERVICE_PHOTOS[7];
  if (lowerName.includes('chân')) return SERVICE_PHOTOS[10];
  if (lowerName.includes('tinh dầu')) return SERVICE_PHOTOS[5];
  if (lowerName.includes('làm sạch sâu')) return SERVICE_PHOTOS[2];
  if (lowerName.includes('cấp ẩm')) return SERVICE_PHOTOS[3];
  if (lowerName.includes('phục hồi')) return SERVICE_PHOTOS[11];
  if (lowerName.includes('tẩy tế bào')) return SERVICE_PHOTOS[8];
  if (lowerName.includes('ủ dưỡng')) return SERVICE_PHOTOS[9];
  if (lowerName.includes('toàn thân')) return SERVICE_PHOTOS[4];

  // Category fallback
  if (service.category && CATEGORY_FALLBACK_PHOTOS[service.category]) {
    return CATEGORY_FALLBACK_PHOTOS[service.category];
  }

  return SERVICE_PHOTOS[4];
}

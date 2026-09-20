"""Tham so va danh muc cho generator dataset v1.

Moi gia tri o day phai ton trong database/v1/RULES.md. Sua danh muc thi sua o day,
khong sua tay CSV.
"""

from __future__ import annotations

from datetime import datetime

SNAPSHOT = datetime(2026, 9, 15, 15, 0, 0)

# --- Danh muc dich vu -------------------------------------------------------------------
# category chi duoc dung MOT trong ba ma ma UI dang loc: MASSAGE / FACIAL / BODY
# (frontend/lunara/src/components/landing/ServicesCollection.tsx loc theo s.category).
# image_url de NULL: frontend da co anh mac dinh theo category, va /images/services/* khong ton tai.
SERVICES = [
    # id, name, category, description, base_price, min_duration, step_minutes, price_per_step, prep, cleanup, display_order, is_active
    (1, "Chăm sóc da mặt cơ bản", "FACIAL", "Làm sạch, cân bằng và cấp ẩm cho da.", 350000, 60, 30, 120000, 10, 10, 1, 1),
    (2, "Làm sạch sâu da mặt", "FACIAL", "Loại bỏ bã nhờn và bụi bẩn trong lỗ chân lông.", 480000, 75, None, None, 10, 15, 2, 1),
    (3, "Cấp ẩm chuyên sâu da mặt", "FACIAL", "Liệu trình cấp ẩm chuyên sâu cho da khô.", 520000, 60, 30, 150000, 10, 10, 3, 1),
    (4, "Massage thư giãn toàn thân", "MASSAGE", "Massage toàn thân giúp giảm căng cơ và thư giãn.", 450000, 60, 30, 180000, 5, 10, 4, 1),
    (5, "Massage tinh dầu", "MASSAGE", "Massage với tinh dầu thiên nhiên, giảm mệt mỏi.", 520000, 60, 30, 200000, 5, 10, 5, 1),
    (6, "Massage đá nóng", "MASSAGE", "Dùng đá bazan nóng làm ấm và giảm đau cơ.", 650000, 90, None, None, 10, 15, 6, 1),
    (7, "Trị liệu đầu, cổ và vai gáy", "MASSAGE", "Tập trung vùng cổ vai gáy, giảm đau đầu do căng thẳng.", 280000, 45, None, None, 5, 5, 7, 1),
    (8, "Tẩy tế bào chết toàn thân", "BODY", "Tẩy da chết và làm mịn da toàn thân.", 420000, 60, None, None, 10, 15, 8, 1),
    (9, "Ủ dưỡng và chăm sóc cơ thể", "BODY", "Ủ dưỡng giúp da mềm mại và đều màu.", 580000, 75, None, None, 10, 15, 9, 1),
    (10, "Chăm sóc và massage bàn chân", "BODY", "Ngâm chân thảo dược và massage bàn chân.", 250000, 45, 15, 80000, 5, 5, 10, 1),
    (11, "Phục hồi da cao cấp", "FACIAL", "Liệu trình phục hồi chuyên sâu cho da tổn thương.", 850000, 90, None, None, 15, 15, 11, 1),
    (12, "Gói chăm sóc cơ thể cổ điển", "BODY", "Gói chăm sóc cổ điển, hiện ngừng nhận booking mới.", 390000, 60, None, None, 10, 10, 12, 0),
]
# Testing chi dung 6 dich vu dau tien (giong quy mo dataset cu).
TESTING_SERVICE_IDS = (1, 2, 3, 4, 5, 6)

# --- Quy mo dataset ---------------------------------------------------------------------
PROFILES = {
    "Testing": {
        "seed": 20260915,
        "accounts": {"OWNER": 1, "MANAGER": 1, "RECEPTIONIST": 1, "THERAPIST": 4, "ACCOUNTANT": 1, "CUSTOMER": 12},
        "inactive_customers": 0,
        "service_ids": TESTING_SERVICE_IDS,
        "bookings": {"COMPLETED": 10, "PENDING_PAYMENT": 9, "CONFIRMED": 7, "CHECKED_IN": 2, "IN_SERVICE": 2},
        "history_days": 110,
        "future_days": 45,
        "feedback_ratio": 0.8,
        "training_courses": 0,
    },
    "Production": {
        "seed": 20260916,
        "accounts": {"OWNER": 1, "MANAGER": 4, "RECEPTIONIST": 4, "THERAPIST": 16, "ACCOUNTANT": 3, "CUSTOMER": 145},
        "inactive_customers": 3,
        "service_ids": tuple(range(1, 13)),
        "bookings": {"COMPLETED": 300, "PENDING_PAYMENT": 150, "CONFIRMED": 120, "CHECKED_IN": 15, "IN_SERVICE": 15},
        "history_days": 110,
        "future_days": 46,
        "feedback_ratio": 0.72,
        "training_courses": 1,
    },
}

JOB_TITLES = ["Therapist", "Senior Therapist", "Massage Specialist", "Facial Specialist"]

# --- Ten nguoi Viet ---------------------------------------------------------------------
SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
            "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đinh", "Trịnh", "Mai", "Tô"]
MIDDLE_FEMALE = ["Thị", "Thu", "Ngọc", "Hoài", "Thanh", "Khánh", "Minh", "Gia", "Hồng", "Phương",
                 "Diệu", "Bảo", "Thảo", "Kim", "Ánh", "Tuyết", "Như", "Yến", "Quỳnh", "Trúc"]
MIDDLE_MALE = ["Văn", "Minh", "Đức", "Quang", "Hoài", "Thanh", "Gia", "Hữu", "Tuấn", "Bảo",
               "Trung", "Hải", "Chí", "Thành", "Đình", "Xuân", "Công", "Bá", "Nhật", "Việt"]
GIVEN_FEMALE = ["Anh", "My", "Nhung", "Hà", "Lan", "Nga", "Hiền", "Uyên", "Yến", "Trâm",
                "Ngân", "Linh", "Vy", "Nhi", "Thư", "Chi", "Hạnh", "Mai", "Phương", "Quỳnh"]
GIVEN_MALE = ["Huy", "Minh", "Nam", "Bình", "Khánh", "Tuấn", "Hải", "Sơn", "Dũng", "Kiệt",
              "Long", "Phúc", "Thịnh", "Trí", "Vinh", "An", "Bảo", "Cường", "Đạt", "Hiếu"]

# --- Ghi chu khach (>= 12 cau, khong lap lien ke) -----------------------------------------
CUSTOMER_NOTES = [
    None,
    None,
    "Xin gọi trước khi đến 15 phút.",
    "Ưu tiên phòng yên tĩnh.",
    "Da hơi nhạy cảm, xin dùng sản phẩm dịu.",
    "Muốn kỹ thuật viên nữ hỗ trợ.",
    "Đã từng bị đau cổ vai gáy, xin massage nhẹ.",
    "Không dùng tinh dầu có mùi mạnh.",
    "Cần hóa đơn cho công ty.",
    "Đến cùng bạn, xin xếp phòng gần nhau.",
    "Xin giữ đồ trang sức ở quầy lễ tân.",
    "Lần trước dùng đá nóng thấy hợp, xin giữ nhiệt độ vừa.",
    "Không sử dụng phòng xông hơi trước dịch vụ.",
    "Xin nhắc uống nước sau liệu trình.",
    "Đặt nhân dịp sinh nhật, xin chuẩn bị trà thảo mộc.",
]

# --- Comment feedback theo tung muc rating (>= 20 cau khac nhau) --------------------------
FEEDBACK_COMMENTS = {
    1: [
        "Chờ khá lâu so với giờ hẹn, mong spa sắp xếp lại.",
        "Phòng hơi ồn, tôi không thư giãn được.",
        "Kỹ thuật viên đến muộn và phải rút ngắn thời gian.",
        "Định dạng lại: sẽ cân nhắc khi quay lại.",
    ],
    2: [
        "Dịch vụ tạm ổn nhưng chưa đúng kỳ vọng về thời lượng.",
        "Không gian đẹp nhưng lễ tân xác nhận lịch còn chậm.",
        "Tôi bị lạnh trong phòng, xin cải thiện nhiệt độ.",
        "Chưa được hỏi về lực massage phù hợp.",
    ],
    3: [
        "Trải nghiệm ở mức bình thường, không có gì nổi bật.",
        "Dịch vụ ổn, nhưng khu vực chờ hơi chật.",
        "Nhân viên thân thiện, mong cải thiện phần tư vấn sau dịch vụ.",
        "Giá hợp lý so với chất lượng nhận được.",
    ],
    4: [
        "Khá hài lòng, kỹ thuật viên làm kỹ và đúng giờ.",
        "Phòng sạch, mùi tinh dầu dễ chịu.",
        "Đặt lịch nhanh, lễ tân nhắc lịch trước khi đến.",
        "Dịch vụ tốt, tôi sẽ giới thiệu cho bạn bè.",
        "Massage lực vừa phải, đúng như tôi yêu cầu.",
    ],
    5: [
        "Rất hài lòng, kỹ thuật viên chuyên nghiệp và chu đáo.",
        "Không gian yên tĩnh, đúng phòng tôi đã đặt.",
        "Được tư vấn kỹ trước khi làm, tôi thấy an tâm.",
        "Đá nóng rất dễ chịu, cổ vai gáy đỡ hẳn.",
        "Nhân viên nhớ sở thích của tôi từ lần trước.",
        "Trà thảo mộc sau dịch vụ là điểm cộng.",
    ],
}

TIME_OFF_REASONS = ["Khám sức khỏe", "Đào tạo nội bộ", "Nghỉ phép cá nhân", "Nghỉ bù", "Việc gia đình"]

# --- Chinh sach gio lam viec -------------------------------------------------------------
SHIFTS = [("09:00:00", "18:00:00"), ("10:00:00", "19:00:00")]
CLOSED_DAYS_BY_STAFF = 1  # moi ky thuat vien nghi co dinh it nhat 1 ngay/tuan

# --- Ty le phan bo ----------------------------------------------------------------------
PAYMENT_METHOD_WEIGHTS = {"AT_SPA": 0.38, "CARD": 0.32, "QR": 0.30}
POSITIVE_RATING_WEIGHTS = {5: 0.45, 4: 0.35, 3: 0.12, 2: 0.05, 1: 0.03}
export_weights = None  # placeholder de ro rang: trong so duoc dung truc tiep o generator

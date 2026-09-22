"""Danh muc 12 tool chi doc cua v0."""

from __future__ import annotations

from app.core.actor import (
    ADMIN_STAFF_SCHEDULE,
    BOOKINGS_SERVICE_UPDATE,
    BOOKINGS_VIEW,
    PAYMENTS_VIEW,
    REPORTS_VIEW,
)
from app.tools import impl
from app.tools.registry import ToolSpec
from app.tools.schemas import (
    CheckAvailabilityInput,
    GetBusinessSummaryInput,
    GetMyAgendaInput,
    GetMyBookingInput,
    GetMyBookingsInput,
    GetOperationsOverviewInput,
    GetPaymentForBookingInput,
    GetServiceDetailInput,
    GetStaffScheduleInput,
    SearchBookingsInput,
    SearchKnowledgeInput,
    SearchServicesInput,
)

OPS_BOOKING_ROLES = frozenset({"OWNER", "MANAGER", "RECEPTIONIST"})
OVERVIEW_ROLES = frozenset({"OWNER", "MANAGER", "RECEPTIONIST"})
FINANCE_ROLES = frozenset({"OWNER", "MANAGER", "ACCOUNTANT"})
ANY_ROLE = frozenset({"OWNER", "MANAGER", "RECEPTIONIST", "THERAPIST", "ACCOUNTANT", "CUSTOMER"})

REGISTRY: dict[str, ToolSpec] = {
    "search_services": ToolSpec(
        name="search_services",
        group="services",
        description=(
            "Tim dich vu cua Lunara theo tu khoa, nhom hoac gia toi da. "
            "Dung khi khach hoi co dich vu gi, gia bao nhieu, thoi luong bao lau."
        ),
        input_model=SearchServicesInput,
        handler=impl.search_services,
        allowed_roles=ANY_ROLE,
        component="service_list",
    ),
    "get_service_detail": ToolSpec(
        name="get_service_detail",
        group="services",
        description="Xem chi tiet mot dich vu: mo ta, gia co ban, thoi luong toi thieu va cach tang thoi luong.",
        input_model=GetServiceDetailInput,
        handler=impl.get_service_detail,
        allowed_roles=ANY_ROLE,
        component="service_card",
    ),
    "check_availability": ToolSpec(
        name="check_availability",
        group="availability",
        description=(
            "Kiem tra khung gio con trong cho mot hoac nhieu dich vu. "
            "Bat buoc truoc khi de xuat lich hen cu the."
        ),
        input_model=CheckAvailabilityInput,
        handler=impl.check_availability,
        allowed_roles=ANY_ROLE,
        component="availability_slots",
    ),
    "get_my_bookings": ToolSpec(
        name="get_my_bookings",
        group="bookings_own",
        description="Liet ke booking cua chinh tai khoan dang dang nhap, loc theo trang thai hoac khoang thoi gian.",
        input_model=GetMyBookingsInput,
        handler=impl.get_my_bookings,
        required_permissions=frozenset({BOOKINGS_VIEW}),
        allowed_roles=ANY_ROLE,
        component="booking_list",
    ),
    "get_my_booking": ToolSpec(
        name="get_my_booking",
        group="bookings_own",
        description="Xem chi tiet mot booking cua chinh tai khoan theo ma booking.",
        input_model=GetMyBookingInput,
        handler=impl.get_my_booking,
        required_permissions=frozenset({BOOKINGS_VIEW}),
        allowed_roles=ANY_ROLE,
        component="booking_card",
    ),
    "search_knowledge": ToolSpec(
        name="search_knowledge",
        group="knowledge",
        description=(
            "Tra cuu chinh sach, FAQ, huong dan va SOP cua Lunara. "
            "Bat buoc dung khi tra loi ve chinh sach huy/doi lich, thanh toan, suc khoe, quy trinh."
        ),
        input_model=SearchKnowledgeInput,
        handler=impl.search_knowledge,
        allowed_roles=ANY_ROLE,
        component="citation_list",
    ),
    "get_my_agenda": ToolSpec(
        name="get_my_agenda",
        group="agenda",
        description="Xem danh sach dich vu duoc phan cong cho ky thuat vien dang dang nhap trong mot ngay.",
        input_model=GetMyAgendaInput,
        handler=impl.get_my_agenda,
        required_permissions=frozenset({BOOKINGS_SERVICE_UPDATE}),
        allowed_roles=frozenset({"THERAPIST"}),
        component="agenda_card",
    ),
    "search_bookings": ToolSpec(
        name="search_bookings",
        group="bookings_ops",
        description=(
            "Tim booking toan he thong theo khoang thoi gian, trang thai, ky thuat vien hoac ma booking. "
            "Dung cho le tan, quan ly va chu spa."
        ),
        input_model=SearchBookingsInput,
        handler=impl.search_bookings,
        required_permissions=frozenset({BOOKINGS_VIEW}),
        allowed_roles=OPS_BOOKING_ROLES,
        component="booking_list",
    ),
    "get_staff_schedule": ToolSpec(
        name="get_staff_schedule",
        group="schedule",
        description="Xem lich lam viec, thoi gian nghi va cac booking bi chan cua mot ky thuat vien.",
        input_model=GetStaffScheduleInput,
        handler=impl.get_staff_schedule,
        required_permissions=frozenset({ADMIN_STAFF_SCHEDULE}),
        allowed_roles=OPS_BOOKING_ROLES,
        component="schedule_card",
    ),
    "get_payment_for_booking": ToolSpec(
        name="get_payment_for_booking",
        group="payment",
        description="Xem trang thai thanh toan cua mot booking theo ID booking.",
        input_model=GetPaymentForBookingInput,
        handler=impl.get_payment_for_booking,
        required_permissions=frozenset({PAYMENTS_VIEW}),
        allowed_roles=frozenset({"OWNER", "MANAGER", "RECEPTIONIST", "ACCOUNTANT"}),
        component="payment_card",
    ),
    "get_operations_overview": ToolSpec(
        name="get_operations_overview",
        group="overview",
        description="Xem chi so van hanh tong quan hom nay: so booking, khach, ky thuat vien, doanh thu trong ngay.",
        input_model=GetOperationsOverviewInput,
        handler=impl.get_operations_overview,
        allowed_roles=OVERVIEW_ROLES,
        component="kpi_card",
    ),
    "get_business_summary": ToolSpec(
        name="get_business_summary",
        group="report",
        description="Xem bao cao kinh doanh theo khoang ngay: so booking, so hoan thanh, doanh thu da thu.",
        input_model=GetBusinessSummaryInput,
        handler=impl.get_business_summary,
        required_permissions=frozenset({REPORTS_VIEW}),
        allowed_roles=FINANCE_ROLES,
        component="report_card",
    ),
}

"""Input schema cho 12 tool (pydantic v2).

- Moi field co description tieng Viet de model chon dung tham so.
- Bound duoc enforce ngay o schema (date range, page size, do dai query).
- actor_account_id KHONG bao gio nam trong schema: lay tu trusted context.
"""

from __future__ import annotations

from datetime import date as Date
from datetime import datetime, timedelta
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

BookingStatus = Literal[
    "PENDING_PAYMENT",
    "PENDING",
    "CONFIRMED",
    "CHECKED_IN",
    "IN_SERVICE",
    "COMPLETED",
]

MAX_RANGE_DAYS = 31


def _check_range(label: str, start: datetime | Date | None, end: datetime | Date | None) -> None:
    if start is None or end is None:
        return
    if end < start:
        raise ValueError(f"{label}: thoi diem ket thuc phai sau thoi diem bat dau")
    if (end - start) > timedelta(days=MAX_RANGE_DAYS):
        raise ValueError(f"{label}: khoang thoi gian toi da {MAX_RANGE_DAYS} ngay")


class RangeMixin(BaseModel):
    from_dt: datetime | None = Field(
        default=None,
        alias="from",
        description="Thoi diem bat dau, ISO 8601 local, vi du 2026-09-20T09:00:00",
    )
    to_dt: datetime | None = Field(
        default=None,
        alias="to",
        description="Thoi diem ket thuc, ISO 8601 local, vi du 2026-09-20T21:00:00",
    )

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def _validate_range(self):
        _check_range(type(self).__name__, self.from_dt, self.to_dt)
        return self


class SearchServicesInput(BaseModel):
    query: str | None = Field(
        default=None,
        max_length=200,
        description="Tu khoa tim dich vu, vi du 'massage', 'da mat', 'goi dau'",
    )
    category: str | None = Field(default=None, max_length=100, description="Nhom dich vu can loc")
    max_price: int | None = Field(
        default=None, ge=0, le=100_000_000, description="Gia co ban toi da (VND)"
    )
    limit: int = Field(default=8, ge=1, le=20, description="So dich vu toi da tra ve")


class GetServiceDetailInput(BaseModel):
    service_id: int = Field(ge=1, description="ID dich vu lay tu ket qua tim kiem")


class BookingItemInput(BaseModel):
    service_id: int = Field(ge=1, description="ID dich vu")
    duration_minutes: int = Field(
        ge=1, le=600, description="Thoi luong khach chon (phut), toi thieu bang minimum_duration_minutes"
    )


class CheckAvailabilityInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[BookingItemInput] = Field(min_length=1, max_length=5, description="Danh sach dich vu can kiem tra")
    from_dt: datetime = Field(alias="from", description="Bat dau khung gio can tim, ISO 8601 local")
    to_dt: datetime = Field(alias="to", description="Ket thuc khung gio can tim, ISO 8601 local")
    staff_account_id: int | None = Field(
        default=None, ge=1, description="Chi dinh ky thuat vien khi khach yeu cau ro"
    )

    @model_validator(mode="after")
    def _validate_window(self):
        _check_range("check_availability", self.from_dt, self.to_dt)
        return self


class GetMyBookingsInput(RangeMixin):
    status: BookingStatus | None = Field(default=None, description="Loc theo trang thai booking")


class GetMyBookingInput(BaseModel):
    booking_code: str = Field(min_length=3, max_length=32, description="Ma booking, vi du LNR-XXXXXX")


class SearchBookingsInput(RangeMixin):
    status: BookingStatus | None = Field(default=None, description="Loc theo trang thai booking")
    staff_id: int | None = Field(default=None, ge=1, description="Loc theo ID ky thuat vien")
    code: str | None = Field(default=None, max_length=32, description="Tim theo ma booking")
    unassigned: bool | None = Field(default=None, description="Chi lay booking chua phan cong")
    page: int = Field(default=0, ge=0, le=100, description="Trang, bat dau tu 0")
    size: int = Field(default=20, ge=1, le=50, description="So ban ghi moi trang, toi da 50")


class GetStaffScheduleInput(RangeMixin):
    staff_id: int = Field(ge=1, description="ID ky thuat vien")


class GetPaymentForBookingInput(BaseModel):
    booking_id: int = Field(ge=1, description="ID booking (khong phai ma booking)")


class GetOperationsOverviewInput(BaseModel):
    """Khong co tham so: chi so van hanh tong quan cua hom nay."""


class GetBusinessSummaryInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_date: Date = Field(alias="from", description="Ngay bat dau, dinh dang YYYY-MM-DD")
    to_date: Date = Field(alias="to", description="Ngay ket thuc, dinh dang YYYY-MM-DD")
    group_by: Literal["DAY", "WEEK", "MONTH"] = Field(default="DAY", description="Nhom bao cao theo ngay/tuan/thang")

    @model_validator(mode="after")
    def _validate_range(self):
        _check_range("get_business_summary", self.from_date, self.to_date)
        return self


class GetMyAgendaInput(BaseModel):
    date: Date | None = Field(default=None, description="Ngay can xem lich (YYYY-MM-DD), mac dinh la hom nay")


class SearchKnowledgeInput(BaseModel):
    query: str = Field(min_length=2, max_length=200, description="Cau hoi hoac chu de can tra cuu chinh sach/FAQ/SOP")
    k: int = Field(default=5, ge=1, le=10, description="So doan tai lieu toi da")

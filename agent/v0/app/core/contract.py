"""ResponseContract - hop dong trung lap giua agent core va channel adapter.

Component duoc dung bang CODE tu tool_results, khong de model tu sinh, va da duoc
gioi han so luong/PII. Web va Google Chat se render rieng o adapter (chua lam o v0).
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

MAX_LIST_COMPONENTS = 8
MAX_SLOT_COMPONENTS = 10

FALLBACK_TEXT = {
    "service_list": "Day la cac dich vu phu hop:",
    "service_card": "Thong tin dich vu:",
    "availability_slots": "Cac khung gio con trong:",
    "booking_list": "Day la cac lich hen:",
    "booking_card": "Thong tin lich hen:",
    "agenda_card": "Lich lam viec cua ban:",
    "schedule_card": "Lich lam viec cua ky thuat vien:",
    "payment_card": "Thong tin thanh toan:",
    "kpi_card": "Chi so van hanh hom nay:",
    "report_card": "Bao cao kinh doanh:",
    "citation_list": "Thong tin tra cuu duoc:",
}


class Citation(BaseModel):
    doc_id: str
    title: str
    audience: str
    version: str
    approved: bool
    source_url: str


class Component(BaseModel):
    type: str
    data: dict[str, Any]


class ResponseContract(BaseModel):
    conversation_id: str
    correlation_id: str
    prompt_version: str
    text: str
    components: list[Component] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
    agent_trace: dict[str, Any] | None = None
    error: dict[str, Any] | None = None


def _cap(items: list, limit: int) -> list:
    return items[:limit]


def _component_for(tool_name: str, data: dict[str, Any]) -> Component | None:
    if tool_name == "search_services":
        return Component(type="service_list", data={"services": _cap(data.get("services") or [], MAX_LIST_COMPONENTS)})
    if tool_name == "get_service_detail":
        return Component(type="service_card", data=data)
    if tool_name == "check_availability":
        return Component(
            type="availability_slots",
            data={
                "totalDurationMinutes": data.get("totalDurationMinutes"),
                "slots": _cap(data.get("slots") or [], MAX_SLOT_COMPONENTS),
            },
        )
    if tool_name == "get_my_bookings":
        return Component(
            type="booking_list",
            data={"bookings": _cap(data.get("bookings") or [], MAX_LIST_COMPONENTS), "scope": "own"},
        )
    if tool_name == "search_bookings":
        return Component(
            type="booking_list",
            data={"bookings": _cap(data.get("bookings") or [], MAX_LIST_COMPONENTS), "scope": "operations"},
        )
    if tool_name == "get_my_booking":
        return Component(
            type="booking_card",
            data={
                "bookingCode": data.get("bookingCode"),
                "status": data.get("status"),
                "bookingStart": data.get("bookingStart"),
                "bookingEnd": data.get("bookingEnd"),
                "totalAmount": data.get("totalAmount"),
                "staffName": data.get("staffName"),
                "items": data.get("items") or [],
            },
        )
    if tool_name == "get_my_agenda":
        return Component(
            type="agenda_card",
            data={"date": data.get("date"), "tasks": _cap(data.get("tasks") or [], MAX_LIST_COMPONENTS)},
        )
    if tool_name == "get_staff_schedule":
        return Component(
            type="schedule_card",
            data={
                "staffId": data.get("staffId"),
                "workingHours": data.get("workingHours") or [],
                "timeOff": _cap(data.get("timeOff") or [], MAX_LIST_COMPONENTS),
                "bookingBlocks": _cap(data.get("bookingBlocks") or [], MAX_LIST_COMPONENTS),
            },
        )
    if tool_name == "get_payment_for_booking":
        # Chi giu truong an toan: khong bao gio dua qrPayload hay du lieu tho vao component.
        return Component(
            type="payment_card",
            data={
                "paymentId": data.get("paymentId"),
                "bookingId": data.get("bookingId"),
                "status": data.get("status"),
                "method": data.get("method"),
                "amount": data.get("amount"),
                "paidAt": data.get("paidAt"),
                "refundedAt": data.get("refundedAt"),
            },
        )
    if tool_name == "get_operations_overview":
        return Component(type="kpi_card", data=data)
    if tool_name == "get_business_summary":
        return Component(
            type="report_card",
            data={**data, "series": _cap(data.get("series") or [], MAX_LIST_COMPONENTS)},
        )
    if tool_name == "search_knowledge":
        return Component(type="citation_list", data={"results": _cap(data.get("results") or [], MAX_LIST_COMPONENTS)})
    return None


def build_components(tool_results: list[dict[str, Any]]) -> list[Component]:
    """Giu component cuoi cung cho moi loai, theo thu tu xuat hien."""
    latest: dict[str, Component] = {}
    for result in tool_results:
        if not result.get("ok"):
            continue
        component = _component_for(str(result.get("tool")), result.get("data") or {})
        if component is not None:
            latest[component.type] = component
    return list(latest.values())


def build_citations(tool_results: list[dict[str, Any]]) -> list[Citation]:
    seen: dict[tuple[str, str], Citation] = {}
    for result in tool_results:
        for raw in result.get("citations") or []:
            citation = Citation(
                doc_id=str(raw.get("docId") or ""),
                title=str(raw.get("title") or ""),
                audience=str(raw.get("audience") or ""),
                version=str(raw.get("version") or ""),
                approved=bool(raw.get("approved")),
                source_url=str(raw.get("sourceUrl") or ""),
            )
            seen[(citation.doc_id, citation.version)] = citation
    return list(seen.values())


def fallback_text(components: list[Component]) -> str:
    for component in components:
        if component.type in FALLBACK_TEXT:
            return FALLBACK_TEXT[component.type]
    return "Toi da tra cuu xong thong tin ban yeu cau."

"""Implementation cua 12 tool chi doc.

Moi handler:
- goi Spring Backend bang JWT cua actor (khong tu y them tham so dinh danh),
- tra ve du lieu rut gon, an toan, khong lo raw payload hay exception.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any
from zoneinfo import ZoneInfo

from app.core.errors import AgentError, AgentErrorCode
from app.knowledge.search import normalize
from app.tools.registry import ToolContext, ToolOutcome
from app.tools.schemas import (
    CheckAvailabilityInput,
    GetBusinessSummaryInput,
    GetMyAgendaInput,
    GetMyBookingInput,
    GetMyBookingsInput,
    GetPaymentForBookingInput,
    GetServiceDetailInput,
    GetStaffScheduleInput,
    SearchBookingsInput,
    SearchKnowledgeInput,
    SearchServicesInput,
)

logger = logging.getLogger(__name__)

MAX_LIST_ITEMS = 10
MAX_DESCRIPTION_CHARS = 240


def _local_iso(value: datetime | None, timezone: str) -> str | None:
    if value is None:
        return None
    if value.tzinfo is not None:
        value = value.astimezone(ZoneInfo(timezone)).replace(tzinfo=None)
    return value.isoformat(timespec="seconds")


def _day_iso(value: date | None) -> str | None:
    return value.isoformat() if value is not None else None


def _trim(text: Any, limit: int = MAX_DESCRIPTION_CHARS) -> str | None:
    if text is None:
        return None
    compact = " ".join(str(text).split())
    return compact[: limit - 1] + "…" if len(compact) > limit else compact


def _matches(text: Any, needle: str) -> bool:
    return bool(text) and needle in normalize(str(text))


async def _fail(coro) -> ToolOutcome:
    try:
        return await coro
    except AgentError as error:
        return ToolOutcome.failure(str(error.code), str(error))
    except Exception:  # pragma: no cover - phong ngu, chi tiet vao log
        logger.exception("tool loi khong xac dinh")
        return ToolOutcome.failure(str(AgentErrorCode.AGENT_ERROR), "Da co loi khi xu ly yeu cau.")


async def search_services(ctx: ToolContext, payload: SearchServicesInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        services = await ctx.backend.request(
            "GET", "/api/services", token=ctx.actor.token, correlation_id=ctx.correlation_id
        )
        items = services or []
        query = normalize(payload.query) if payload.query else None
        category = normalize(payload.category) if payload.category else None

        filtered: list[dict] = []
        for service in items:
            if service.get("isActive") is False:
                continue
            if query and not (
                _matches(service.get("name"), query)
                or _matches(service.get("category"), query)
                or _matches(service.get("description"), query)
            ):
                continue
            if category and not _matches(service.get("category"), category):
                continue
            if payload.max_price is not None and int(service.get("basePrice") or 0) > payload.max_price:
                continue
            filtered.append(service)

        trimmed = filtered[: payload.limit]
        return ToolOutcome.success(
            {
                "totalMatches": len(filtered),
                "services": [
                    {
                        "id": service.get("id"),
                        "name": service.get("name"),
                        "category": service.get("category"),
                        "description": _trim(service.get("description")),
                        "basePrice": service.get("basePrice"),
                        "minimumDurationMinutes": service.get("minimumDurationMinutes"),
                        "isDurationAdjustable": service.get("isDurationAdjustable"),
                        "durationStepMinutes": service.get("durationStepMinutes"),
                        "pricePerDurationStep": service.get("pricePerDurationStep"),
                        "preparationBufferMinutes": service.get("preparationBufferMinutes"),
                        "cleanupBufferMinutes": service.get("cleanupBufferMinutes"),
                    }
                    for service in trimmed
                ],
            },
            meta={"tool": "search_services", "returned": len(trimmed)},
        )

    return await _fail(run())


async def get_service_detail(ctx: ToolContext, payload: GetServiceDetailInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        service = await ctx.backend.request(
            "GET",
            f"/api/services/{payload.service_id}",
            token=ctx.actor.token,
            correlation_id=ctx.correlation_id,
        )
        return ToolOutcome.success(
            {
                "id": service.get("id"),
                "name": service.get("name"),
                "category": service.get("category"),
                "description": _trim(service.get("description"), 600),
                "basePrice": service.get("basePrice"),
                "minimumDurationMinutes": service.get("minimumDurationMinutes"),
                "isDurationAdjustable": service.get("isDurationAdjustable"),
                "durationStepMinutes": service.get("durationStepMinutes"),
                "pricePerDurationStep": service.get("pricePerDurationStep"),
                "preparationBufferMinutes": service.get("preparationBufferMinutes"),
                "cleanupBufferMinutes": service.get("cleanupBufferMinutes"),
                "staff": [member.get("displayName") for member in (service.get("staff") or [])][:MAX_LIST_ITEMS],
            },
            meta={"tool": "get_service_detail", "serviceId": payload.service_id},
        )

    return await _fail(run())


async def check_availability(ctx: ToolContext, payload: CheckAvailabilityInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        body = {
            "items": [
                {"serviceId": item.service_id, "durationMinutes": item.duration_minutes}
                for item in payload.items
            ],
            "from": _local_iso(payload.from_dt, ctx.timezone),
            "to": _local_iso(payload.to_dt, ctx.timezone),
        }
        if payload.staff_account_id is not None:
            body["staffAccountId"] = payload.staff_account_id

        result = await ctx.backend.request(
            "POST", "/api/availability", token=ctx.actor.token, json_body=body, correlation_id=ctx.correlation_id
        )
        slots = (result or {}).get("slots") or []
        return ToolOutcome.success(
            {
                "totalDurationMinutes": (result or {}).get("totalDurationMinutes"),
                "slotCount": len(slots),
                "slots": [
                    {
                        "staffAccountId": slot.get("staffAccountId"),
                        "staffName": slot.get("staffName"),
                        "bookingStart": slot.get("bookingStart"),
                        "bookingEnd": slot.get("bookingEnd"),
                    }
                    for slot in slots[:MAX_LIST_ITEMS]
                ],
            },
            meta={"tool": "check_availability", "slotCount": len(slots)},
        )

    return await _fail(run())


async def get_my_bookings(ctx: ToolContext, payload: GetMyBookingsInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        bookings = await ctx.backend.request(
            "GET", "/api/bookings/my", token=ctx.actor.token, correlation_id=ctx.correlation_id
        )
        items = bookings or []
        if payload.status:
            items = [item for item in items if item.get("status") == payload.status]
        if payload.from_dt:
            items = [
                item
                for item in items
                if item.get("bookingStart") and str(item["bookingStart"]) >= _local_iso(payload.from_dt, ctx.timezone)
            ]
        if payload.to_dt:
            items = [
                item
                for item in items
                if item.get("bookingStart") and str(item["bookingStart"]) <= _local_iso(payload.to_dt, ctx.timezone)
            ]

        trimmed = items[:MAX_LIST_ITEMS]
        return ToolOutcome.success(
            {
                "totalMatches": len(items),
                "bookings": [
                    {
                        "bookingId": item.get("id"),
                        "bookingCode": item.get("bookingCode"),
                        "status": item.get("status"),
                        "bookingStart": item.get("bookingStart"),
                        "bookingEnd": item.get("bookingEnd"),
                        "totalAmount": item.get("totalAmount"),
                    }
                    for item in trimmed
                ],
            },
            meta={"tool": "get_my_bookings", "returned": len(trimmed)},
        )

    return await _fail(run())


async def get_my_booking(ctx: ToolContext, payload: GetMyBookingInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        booking = await ctx.backend.request(
            "GET",
            f"/api/bookings/{payload.booking_code}",
            token=ctx.actor.token,
            correlation_id=ctx.correlation_id,
        )
        return ToolOutcome.success(
            {
                "bookingId": booking.get("id"),
                "bookingCode": booking.get("bookingCode"),
                "status": booking.get("status"),
                "bookingStart": booking.get("bookingStart"),
                "bookingEnd": booking.get("bookingEnd"),
                "totalDurationMinutes": booking.get("totalDurationMinutes"),
                "totalAmount": booking.get("totalAmount"),
                "holdExpiresAt": booking.get("holdExpiresAt"),
                "staffName": (booking.get("staff") or {}).get("displayName"),
                "items": [
                    {
                        "serviceName": item.get("serviceName"),
                        "durationMinutes": item.get("durationMinutes"),
                        "lineAmount": item.get("lineAmount"),
                    }
                    for item in (booking.get("items") or [])
                ],
            },
            meta={"tool": "get_my_booking", "bookingCode": payload.booking_code},
        )

    return await _fail(run())


async def search_bookings(ctx: ToolContext, payload: SearchBookingsInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        params = {
            "from": _local_iso(payload.from_dt, ctx.timezone),
            "to": _local_iso(payload.to_dt, ctx.timezone),
            "status": payload.status,
            "staffId": payload.staff_id,
            "unassigned": str(payload.unassigned).lower() if payload.unassigned is not None else None,
            "code": payload.code,
            "page": payload.page,
            "size": payload.size,
        }
        result = await ctx.backend.request(
            "GET", "/api/manager/bookings", token=ctx.actor.token, params=params, correlation_id=ctx.correlation_id
        )
        content = (result or {}).get("content") or []
        return ToolOutcome.success(
            {
                "totalElements": (result or {}).get("totalElements"),
                "totalPages": (result or {}).get("totalPages"),
                "pageNumber": (result or {}).get("pageNumber"),
                "bookings": [
                    {
                        "bookingId": item.get("id"),
                        "bookingCode": item.get("bookingCode"),
                        "status": item.get("status"),
                        "customerName": item.get("customerName"),
                        "staffName": item.get("staffName"),
                        "bookingStart": item.get("bookingStart"),
                        "bookingEnd": item.get("bookingEnd"),
                        "totalAmount": item.get("totalAmount"),
                    }
                    for item in content[: payload.size]
                ],
            },
            meta={"tool": "search_bookings", "returned": len(content)},
        )

    return await _fail(run())


async def get_staff_schedule(ctx: ToolContext, payload: GetStaffScheduleInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        params = {
            "from": _local_iso(payload.from_dt, ctx.timezone),
            "to": _local_iso(payload.to_dt, ctx.timezone),
        }
        result = await ctx.backend.request(
            "GET",
            f"/api/manager/staff/{payload.staff_id}/schedule",
            token=ctx.actor.token,
            params=params,
            correlation_id=ctx.correlation_id,
        )
        result = result or {}
        return ToolOutcome.success(
            {
                "staffId": result.get("staffId"),
                "workingHours": [
                    {
                        "dayOfWeek": item.get("dayOfWeek"),
                        "startTime": item.get("startTime"),
                        "endTime": item.get("endTime"),
                        "isActive": item.get("isActive"),
                    }
                    for item in (result.get("workingHours") or [])
                ],
                "timeOff": [
                    {"startAt": item.get("startAt"), "endAt": item.get("endAt"), "reason": _trim(item.get("reason"), 80)}
                    for item in (result.get("timeOff") or [])[:MAX_LIST_ITEMS]
                ],
                "bookingBlocks": [
                    {
                        "bookingCode": item.get("bookingCode"),
                        "status": item.get("status"),
                        "startAt": item.get("startAt"),
                        "endAt": item.get("endAt"),
                    }
                    for item in (result.get("bookingBlocks") or [])[:MAX_LIST_ITEMS]
                ],
            },
            meta={"tool": "get_staff_schedule", "staffId": payload.staff_id},
        )

    return await _fail(run())


async def get_payment_for_booking(ctx: ToolContext, payload: GetPaymentForBookingInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        payment = await ctx.backend.request(
            "GET",
            f"/api/payments/booking/{payload.booking_id}",
            token=ctx.actor.token,
            correlation_id=ctx.correlation_id,
        )
        payment = payment or {}
        return ToolOutcome.success(
            {
                "paymentId": payment.get("id"),
                "bookingId": payment.get("bookingId"),
                "status": payment.get("status"),
                "method": payment.get("method"),
                "amount": payment.get("amount"),
                "paidAt": payment.get("paidAt"),
                "refundedAt": payment.get("refundedAt"),
            },
            meta={"tool": "get_payment_for_booking", "bookingId": payload.booking_id},
        )

    return await _fail(run())


async def get_operations_overview(ctx: ToolContext, _payload) -> ToolOutcome:
    async def run() -> ToolOutcome:
        dashboard = await ctx.backend.request(
            "GET", "/api/manager/dashboard", token=ctx.actor.token, correlation_id=ctx.correlation_id
        )
        dashboard = dashboard or {}
        return ToolOutcome.success(
            {
                "totalBookings": dashboard.get("totalBookings"),
                "todayBookings": dashboard.get("todayBookings"),
                "completedBookings": dashboard.get("completedBookings"),
                "pendingPayments": dashboard.get("pendingPayments"),
                "todayRevenue": dashboard.get("todayRevenue"),
                "totalCustomers": dashboard.get("totalCustomers"),
                "totalStaff": dashboard.get("totalStaff"),
                "totalServices": dashboard.get("totalServices"),
                "averageRating": dashboard.get("averageRating"),
            },
            meta={"tool": "get_operations_overview"},
        )

    return await _fail(run())


async def get_business_summary(ctx: ToolContext, payload: GetBusinessSummaryInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        params = {"from": _day_iso(payload.from_date), "to": _day_iso(payload.to_date), "groupBy": payload.group_by}
        result = await ctx.backend.request(
            "GET", "/api/reports/summary", token=ctx.actor.token, params=params, correlation_id=ctx.correlation_id
        )
        result = result or {}
        return ToolOutcome.success(
            {
                "from": result.get("from"),
                "to": result.get("to"),
                "groupBy": result.get("groupBy"),
                "totalBookings": result.get("totalBookings"),
                "completedBookings": result.get("completedBookings"),
                "paidRevenue": result.get("paidRevenue"),
                "series": [
                    {
                        "period": item.get("period"),
                        "bookingCount": item.get("bookingCount"),
                        "completedCount": item.get("completedCount"),
                        "paidRevenue": item.get("paidRevenue"),
                    }
                    for item in (result.get("series") or [])[:MAX_LIST_ITEMS]
                ],
            },
            meta={"tool": "get_business_summary"},
        )

    return await _fail(run())


async def get_my_agenda(ctx: ToolContext, payload: GetMyAgendaInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        params = {"date": _day_iso(payload.date)}
        tasks = await ctx.backend.request(
            "GET", "/api/staff/tasks", token=ctx.actor.token, params=params, correlation_id=ctx.correlation_id
        )
        tasks = tasks or []
        return ToolOutcome.success(
            {
                "date": _day_iso(payload.date),
                "totalTasks": len(tasks),
                "tasks": [
                    {
                        "bookingId": task.get("bookingId"),
                        "bookingCode": task.get("bookingCode"),
                        "status": task.get("status"),
                        "bookingStart": task.get("bookingStart"),
                        "bookingEnd": task.get("bookingEnd"),
                        "customerName": task.get("customerName"),
                        "services": [
                            {"name": service.get("name"), "durationMinutes": service.get("durationMinutes")}
                            for service in (task.get("services") or [])
                        ],
                    }
                    for task in tasks[:MAX_LIST_ITEMS]
                ],
            },
            meta={"tool": "get_my_agenda", "returned": min(len(tasks), MAX_LIST_ITEMS)},
        )

    return await _fail(run())


async def search_knowledge(ctx: ToolContext, payload: SearchKnowledgeInput) -> ToolOutcome:
    async def run() -> ToolOutcome:
        limit = min(payload.k, ctx.settings.knowledge_max_results)
        hits = ctx.knowledge.search(payload.query, ctx.actor.audiences, limit=limit)
        if not hits:
            return ToolOutcome.success(
                {
                    "results": [],
                    "note": "Chua co tai lieu da duoc xac nhan cho chu de nay. Hay noi ro voi nguoi dung la chua co thong tin chinh thuc.",
                },
                meta={"tool": "search_knowledge", "returned": 0, "screened": False},
            )

        kept, screening = await ctx.judge.screen_passages(payload.query, hits)
        results = [{**screened.hit.as_dict(), "route": screened.route} for screened in kept]
        note = None
        if not results:
            note = (
                "Cac doan tai lieu tim duoc khong duoc xac nhan la phu hop hoac co dau hieu khong dang tin cay. "
                "Hay tra loi rang chua co thong tin da duoc xac nhan."
            )
        elif any(not screened.hit.approved for screened in kept):
            note = (
                "Mot so tai lieu la BAN NHAP noi bo chua duoc phe duyet. "
                "Khi tra loi phai noi ro day la thong tin nhap, chua duoc xac nhan chinh thuc."
            )
        elif any(screened.route == "conflicting_evidence" for screened in kept):
            note = (
                "Mot so doan tai lieu mau thuan voi tien de ma nguoi dung dang mac dinh. "
                "Hay neu ro mau thuan do thay vi tra loi theo tien de."
            )

        return ToolOutcome.success(
            {"results": results, "note": note},
            citations=[screened.hit.doc.citation() for screened in kept],
            meta={"tool": "search_knowledge", "returned": len(results), **screening},
        )

    return await _fail(run())

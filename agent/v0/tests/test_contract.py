"""ResponseContract: dung component bang code, gioi han so luong, gop citation."""

from __future__ import annotations

from app.core.contract import build_citations, build_components, fallback_text


def result(tool: str, data: dict, *, ok: bool = True, citations: list[dict] | None = None) -> dict:
    return {"tool": tool, "ok": ok, "data": data, "citations": citations or [], "meta": {}}


def test_maps_tool_results_to_components() -> None:
    components = build_components(
        [
            result("search_services", {"services": [{"id": 1, "name": "Massage"}]}),
            result("get_my_bookings", {"bookings": [{"bookingCode": "LNR-1"}]}),
        ]
    )
    assert [component.type for component in components] == ["service_list", "booking_list"]
    assert components[0].data["services"][0]["name"] == "Massage"


def test_failed_tool_produces_no_component() -> None:
    assert build_components([result("search_services", {}, ok=False)]) == []


def test_last_component_per_type_wins() -> None:
    components = build_components(
        [
            result("search_services", {"services": [{"id": 1}]}),
            result("search_services", {"services": [{"id": 2}]}),
        ]
    )
    assert len(components) == 1
    assert components[0].data["services"] == [{"id": 2}]


def test_list_components_are_capped() -> None:
    components = build_components(
        [result("get_my_bookings", {"bookings": [{"bookingCode": f"LNR-{index}"} for index in range(30)]})]
    )
    assert len(components[0].data["bookings"]) == 8


def test_business_summary_series_is_capped() -> None:
    components = build_components(
        [result("get_business_summary", {"series": [{"period": str(index)} for index in range(20)]})]
    )
    assert len(components[0].data["series"]) == 8


def test_payment_component_has_no_qr_payload() -> None:
    components = build_components(
        [
            result(
                "get_payment_for_booking",
                {"paymentId": 1, "status": "PAID", "amount": 100, "qrPayload": "secret"},
            )
        ]
    )
    assert "qrPayload" not in components[0].data


def test_citations_are_deduplicated() -> None:
    citation = {
        "docId": "booking-policy",
        "title": "Chinh sach dat lich",
        "audience": "PUBLIC",
        "version": "0.1",
        "approved": False,
        "sourceUrl": "internal://lunara/policy/booking-policy",
    }
    citations = build_citations([result("search_knowledge", {}, citations=[citation]), result("search_knowledge", {}, citations=[citation])])
    assert len(citations) == 1
    assert citations[0].approved is False


def test_fallback_text_uses_component_type() -> None:
    components = build_components([result("get_my_bookings", {"bookings": []})])
    assert "lich hen" in fallback_text(components)

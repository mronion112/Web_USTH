"""Allow-list tool theo role: khong bao gio rong hon backend cho phep."""

from __future__ import annotations

import pytest

from app.core.actor import ActorContext
from app.tools.catalog import REGISTRY
from app.tools.registry import select_specs


def actor(role: str, **overrides) -> ActorContext:
    from app.core.actor import permissions_for_role

    data = {
        "account_id": 1,
        "email": f"{role.lower()}@lunara-spa.demo",
        "display_name": role,
        "role": role,
        "token": "token",
        "conversation_id": "c1",
        "permissions": permissions_for_role(role),
    }
    data.update(overrides)
    return ActorContext(**data)


def tools_for(role: str) -> set[str]:
    return {spec.name for spec in select_specs(REGISTRY, actor(role))}


@pytest.mark.parametrize(
    ("role", "expected"),
    [
        ("CUSTOMER", {"search_services", "get_service_detail", "check_availability", "get_my_bookings", "get_my_booking", "search_knowledge"}),
        ("THERAPIST", {"search_services", "get_service_detail", "check_availability", "get_my_bookings", "get_my_booking", "search_knowledge", "get_my_agenda"}),
        # RECEPTIONIST khong co ADMIN_STAFF_SCHEDULE trong role_permissions.csv -> khong thay lich ky thuat vien.
        ("RECEPTIONIST", {"search_services", "get_service_detail", "check_availability", "get_my_bookings", "get_my_booking", "search_knowledge", "search_bookings", "get_payment_for_booking", "get_operations_overview"}),
        # ACCOUNTANT khong co BOOKINGS_VIEW -> khong co tool booking.
        ("ACCOUNTANT", {"search_services", "get_service_detail", "check_availability", "search_knowledge", "get_payment_for_booking", "get_business_summary"}),
        ("MANAGER", {"search_services", "get_service_detail", "check_availability", "get_my_bookings", "get_my_booking", "search_knowledge", "search_bookings", "get_staff_schedule", "get_payment_for_booking", "get_operations_overview", "get_business_summary"}),
    ],
)
def test_allowed_tools_per_role(role: str, expected: set[str]) -> None:
    assert tools_for(role) == expected


def test_owner_has_every_tool_except_staff_scoped_agenda() -> None:
    # get_my_agenda gan voi ho so ky thuat vien (StaffProfile), khong cap cho OWNER.
    assert tools_for("OWNER") == set(REGISTRY) - {"get_my_agenda"}


def test_unknown_role_has_no_tools() -> None:
    assert tools_for("CONTRACTOR") == set()
    assert actor("CONTRACTOR").is_known_role is False


def test_therapist_cannot_search_all_bookings_or_reports() -> None:
    tools = tools_for("THERAPIST")
    assert "search_bookings" not in tools
    assert "get_business_summary" not in tools
    assert "get_operations_overview" not in tools


def test_accountant_cannot_use_ops_booking_tools() -> None:
    tools = tools_for("ACCOUNTANT")
    assert "search_bookings" not in tools
    assert "get_staff_schedule" not in tools


def test_customer_has_no_ops_tools() -> None:
    tools = tools_for("CUSTOMER")
    assert not {"search_bookings", "get_staff_schedule", "get_payment_for_booking", "get_operations_overview", "get_business_summary"} & tools


def test_permission_map_covers_every_known_role() -> None:
    from app.core.actor import KNOWN_ROLES, ROLE_PERMISSIONS

    assert set(KNOWN_ROLES) == set(ROLE_PERMISSIONS)


def test_audiences_by_role() -> None:
    assert actor("CUSTOMER").audiences == frozenset({"PUBLIC"})
    assert actor("THERAPIST").audiences == frozenset({"PUBLIC", "STAFF"})
    assert actor("ACCOUNTANT").audiences == frozenset({"PUBLIC", "STAFF", "MANAGEMENT"})
    assert actor("MANAGER").audiences == frozenset({"PUBLIC", "STAFF", "MANAGEMENT"})

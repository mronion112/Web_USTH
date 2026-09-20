"""Actor context va map role -> permission.

Luu y: day la CAU TAM cho v0. `GET /api/auth/me` cua backend hien chi tra `role`,
khong tra danh sach permission, nen agent tu map theo dung
`database/Testing/role_permissions.csv`. Khi backend bo sung permission endpoint
thi thay the hang so nay bang du lieu tu backend.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

Role = Literal["OWNER", "MANAGER", "RECEPTIONIST", "THERAPIST", "ACCOUNTANT", "CUSTOMER"]

KNOWN_ROLES: tuple[str, ...] = ("OWNER", "MANAGER", "RECEPTIONIST", "THERAPIST", "ACCOUNTANT", "CUSTOMER")

# Permission codes theo database/permissions.csv
BOOKINGS_VIEW = "BOOKINGS_VIEW"
BOOKINGS_CREATE = "BOOKINGS_CREATE"
BOOKINGS_EDIT = "BOOKINGS_EDIT"
BOOKINGS_ASSIGN = "BOOKINGS_ASSIGN"
BOOKINGS_CHECKIN = "BOOKINGS_CHECKIN"
BOOKINGS_SERVICE_UPDATE = "BOOKINGS_SERVICE_UPDATE"
CUSTOMERS_VIEW = "CUSTOMERS_VIEW"
CUSTOMERS_EDIT = "CUSTOMERS_EDIT"
PAYMENTS_VIEW = "PAYMENTS_VIEW"
PAYMENTS_PROCESS = "PAYMENTS_PROCESS"
PAYMENTS_REFUND = "PAYMENTS_REFUND"
REPORTS_VIEW = "REPORTS_VIEW"
FEEDBACK_VIEW = "FEEDBACK_VIEW"
ADMIN_ACCOUNTS_VIEW = "ADMIN_ACCOUNTS_VIEW"
ADMIN_ACCOUNTS_MANAGE = "ADMIN_ACCOUNTS_MANAGE"
ADMIN_ROLES = "ADMIN_ROLES"
ADMIN_SERVICES = "ADMIN_SERVICES"
ADMIN_STAFF_SCHEDULE = "ADMIN_STAFF_SCHEDULE"

ALL_PERMISSIONS: frozenset[str] = frozenset(
    {
        BOOKINGS_VIEW,
        BOOKINGS_CREATE,
        BOOKINGS_EDIT,
        BOOKINGS_ASSIGN,
        BOOKINGS_CHECKIN,
        BOOKINGS_SERVICE_UPDATE,
        CUSTOMERS_VIEW,
        CUSTOMERS_EDIT,
        PAYMENTS_VIEW,
        PAYMENTS_PROCESS,
        PAYMENTS_REFUND,
        REPORTS_VIEW,
        FEEDBACK_VIEW,
        ADMIN_ACCOUNTS_VIEW,
        ADMIN_ACCOUNTS_MANAGE,
        ADMIN_ROLES,
        ADMIN_SERVICES,
        ADMIN_STAFF_SCHEDULE,
    }
)

ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "OWNER": ALL_PERMISSIONS,
    "MANAGER": ALL_PERMISSIONS,
    "RECEPTIONIST": frozenset(
        {
            BOOKINGS_VIEW,
            BOOKINGS_CREATE,
            BOOKINGS_EDIT,
            BOOKINGS_ASSIGN,
            BOOKINGS_CHECKIN,
            CUSTOMERS_VIEW,
            CUSTOMERS_EDIT,
            PAYMENTS_VIEW,
            PAYMENTS_PROCESS,
            FEEDBACK_VIEW,
            ADMIN_ACCOUNTS_VIEW,
        }
    ),
    "THERAPIST": frozenset(
        {
            BOOKINGS_VIEW,
            BOOKINGS_CHECKIN,
            BOOKINGS_SERVICE_UPDATE,
            CUSTOMERS_VIEW,
            FEEDBACK_VIEW,
        }
    ),
    "ACCOUNTANT": frozenset({PAYMENTS_VIEW, PAYMENTS_PROCESS, PAYMENTS_REFUND, REPORTS_VIEW}),
    "CUSTOMER": frozenset({BOOKINGS_VIEW, BOOKINGS_CREATE, CUSTOMERS_EDIT, PAYMENTS_VIEW, FEEDBACK_VIEW}),
}

STAFF_ROLES: frozenset[str] = frozenset({"OWNER", "MANAGER", "RECEPTIONIST", "THERAPIST", "ACCOUNTANT"})
MANAGEMENT_ROLES: frozenset[str] = frozenset({"OWNER", "MANAGER", "ACCOUNTANT"})

AUDIENCE_PUBLIC = "PUBLIC"
AUDIENCE_STAFF = "STAFF"
AUDIENCE_MANAGEMENT = "MANAGEMENT"


def permissions_for_role(role: str) -> frozenset[str]:
    """Fail-closed: role la thi khong co permission nao."""
    return ROLE_PERMISSIONS.get((role or "").upper(), frozenset())


def allowed_audiences(role: str) -> frozenset[str]:
    role = (role or "").upper()
    audiences = {AUDIENCE_PUBLIC}
    if role in STAFF_ROLES:
        audiences.add(AUDIENCE_STAFF)
    if role in MANAGEMENT_ROLES:
        audiences.add(AUDIENCE_MANAGEMENT)
    return frozenset(audiences)


@dataclass(frozen=True)
class ActorContext:
    account_id: int
    email: str
    display_name: str
    role: str
    token: str
    channel: str = "WEB"
    conversation_id: str = ""
    permissions: frozenset[str] = field(default_factory=frozenset)

    @classmethod
    def from_me(cls, payload: dict, token: str) -> ActorContext:
        role = str(payload.get("role") or "").upper()
        return cls(
            account_id=int(payload.get("id") or 0),
            email=str(payload.get("email") or ""),
            display_name=str(payload.get("displayName") or payload.get("email") or ""),
            role=role,
            token=token,
            permissions=permissions_for_role(role),
        )

    @property
    def audiences(self) -> frozenset[str]:
        return allowed_audiences(self.role)

    @property
    def is_known_role(self) -> bool:
        return self.role in KNOWN_ROLES

    def has(self, permission: str) -> bool:
        return permission in self.permissions

    def thread_id(self) -> str:
        return f"{self.account_id}:{self.channel}:{self.conversation_id}"

"""Kiem tra toan ven dataset mock theo database/v1/RULES.md (khong can database).

Dung:
    python3 database/v1/tools/check_dataset.py --csv-dir database/Testing
    python3 database/v1/tools/check_dataset.py --csv-dir database/Testing --expect-violations

`--expect-violations` dung de chung minh bo kiem bat duoc dataset loi (tra ve 0 khi CO vi pham).
"""

from __future__ import annotations

import argparse
import csv
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path

SNAPSHOT = datetime(2026, 9, 15, 15, 0, 0)
NULL = "\\N"
ROLES = {
    "1": "OWNER",
    "2": "MANAGER",
    "3": "RECEPTIONIST",
    "4": "THERAPIST",
    "5": "ACCOUNTANT",
    "6": "CUSTOMER",
}
BOOKING_STATUSES = {"PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED"}
STATUS_RANK = {"PENDING_PAYMENT": 0, "CONFIRMED": 1, "CHECKED_IN": 2, "IN_SERVICE": 3, "COMPLETED": 4}
PAYMENT_METHODS = {"QR", "CARD", "AT_SPA"}
PAYMENT_STATUSES = {"UNPAID", "PAID", "FAILED", "REFUNDED"}
ASSIGNMENT_SOURCES = {"SYSTEM", "CUSTOMER", "ADMIN"}
SERVICE_CATEGORIES = {"MASSAGE", "FACIAL", "BODY"}
BOOKING_CODE_PREFIX = "LNR-"
TRANSACTION_CODE_PREFIX = "PAY-"

TABLES = [
    "roles",
    "permissions",
    "role_permissions",
    "accounts",
    "customer_profiles",
    "staff_profiles",
    "services",
    "staff_services",
    "staff_working_hours",
    "staff_time_off",
    "bookings",
    "booking_items",
    "booking_events",
    "payments",
    "feedback",
]


@dataclass
class Problem:
    rule: str
    detail: str


@dataclass
class Dataset:
    root: Path
    tables: dict[str, list[dict]] = field(default_factory=dict)
    problems: list[Problem] = field(default_factory=list)

    def add(self, rule: str, detail: str) -> None:
        self.problems.append(Problem(rule, detail))

    def rows(self, table: str) -> list[dict]:
        return self.tables.get(table, [])

    def index(self, table: str, key: str) -> dict[str, dict]:
        return {row[key]: row for row in self.rows(table)}


def load(root: Path) -> Dataset:
    dataset = Dataset(root=root)
    for table in TABLES:
        path = root / f"{table}.csv"
        if not path.exists():
            dataset.add("0", f"thieu file {path.name}")
            continue
        with path.open(encoding="utf-8", newline="") as handle:
            dataset.tables[table] = list(csv.DictReader(handle))
    return dataset


# --------------------------------------------------------------------------- helpers
def text(row: dict, key: str) -> str | None:
    value = row.get(key)
    return None if value in (None, NULL, "") else value


def num(row: dict, key: str) -> int:
    value = text(row, key)
    return int(value) if value is not None else 0


def money(row: dict, key: str) -> float:
    value = text(row, key)
    return float(value) if value is not None else 0.0


def moment(row: dict, key: str) -> datetime | None:
    value = text(row, key)
    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S") if value else None


def day_index(value: datetime) -> int:
    return value.weekday() + 1  # 1 = Monday .. 7 = Sunday


def overlaps(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    return start_a < end_b and end_a > start_b


# --------------------------------------------------------------------------- checks
def check_references(data: Dataset) -> None:
    accounts = data.index("accounts", "id")
    services = data.index("services", "id")
    customer_profiles = {row["account_id"] for row in data.rows("customer_profiles")}
    staff_profiles = {row["account_id"] for row in data.rows("staff_profiles")}
    role_of = {row["id"]: row["code"] for row in data.rows("roles")}
    role_by_account = {row["id"]: role_of.get(row["role_id"], "?") for row in data.rows("accounts")}
    bookings = data.index("bookings", "id")

    for profile in data.rows("customer_profiles"):
        if role_by_account.get(profile["account_id"]) != "CUSTOMER":
            data.add("I2", f"customer_profile cho tai khoan khong phai CUSTOMER: {profile['account_id']}")
    for profile in data.rows("staff_profiles"):
        if role_by_account.get(profile["account_id"]) != "THERAPIST":
            data.add("I3", f"staff_profile cho tai khoan khong phai THERAPIST: {profile['account_id']}")
    for account_id, role in role_by_account.items():
        if role == "CUSTOMER" and account_id not in customer_profiles:
            data.add("I2", f"CUSTOMER thieu customer_profile: {account_id}")
        if role == "THERAPIST" and account_id not in staff_profiles:
            data.add("I3", f"THERAPIST thieu staff_profile: {account_id}")

    seen_payment_booking: set[str] = set()
    for payment in data.rows("payments"):
        if payment["booking_id"] not in bookings:
            data.add("I1", f"payment {payment['id']} tro toi booking khong ton tai: {payment['booking_id']}")
        if payment["booking_id"] in seen_payment_booking:
            data.add("I4", f"nhieu payment cho booking {payment['booking_id']}")
        seen_payment_booking.add(payment["booking_id"])

    seen_feedback_booking: set[str] = set()
    for item in data.rows("feedback"):
        if item["booking_id"] not in bookings:
            data.add("I1", f"feedback {item['id']} tro toi booking khong ton tai: {item['booking_id']}")
        if item["booking_id"] in seen_feedback_booking:
            data.add("I4", f"nhieu feedback cho booking {item['booking_id']}")
        seen_feedback_booking.add(item["booking_id"])

    seen_items: set[tuple[str, str]] = set()
    for item in data.rows("booking_items"):
        if item["booking_id"] not in bookings:
            data.add("I1", f"booking_item {item['id']} tro toi booking khong ton tai")
        if item["service_id"] not in services:
            data.add("I1", f"booking_item {item['id']} tro toi service khong ton tai: {item['service_id']}")
        key = (item["booking_id"], item["service_id"])
        if key in seen_items:
            data.add("I4", f"trung (booking, service) trong booking_items: {key}")
        seen_items.add(key)

    for booking in data.rows("bookings"):
        if booking["customer_account_id"] not in accounts:
            data.add("I1", f"booking {booking['id']} tro toi customer khong ton tai")
        staff = text(booking, "staff_account_id")
        if staff and staff not in staff_profiles:
            data.add("I1", f"booking {booking['id']} tro toi staff khong ton tai: {staff}")
        creator = text(booking, "created_by_account_id")
        if creator and creator not in accounts:
            data.add("I1", f"booking {booking['id']} tro toi nguoi tao khong ton tai: {creator}")

    for event in data.rows("booking_events"):
        if event["booking_id"] not in bookings:
            data.add("I1", f"event {event['id']} tro toi booking khong ton tai")
        actor = text(event, "actor_account_id")
        if actor and actor not in accounts:
            data.add("I1", f"event {event['id']} tro toi actor khong ton tai: {actor}")

    for row in data.rows("staff_services"):
        if row["staff_account_id"] not in staff_profiles:
            data.add("I1", f"staff_services tro toi staff khong ton tai: {row['staff_account_id']}")
        if row["service_id"] not in services:
            data.add("I1", f"staff_services tro toi service khong ton tai: {row['service_id']}")
    for row in data.rows("staff_working_hours"):
        if row["staff_account_id"] not in staff_profiles:
            data.add("I1", f"staff_working_hours tro toi staff khong ton tai: {row['staff_account_id']}")
    for row in data.rows("staff_time_off"):
        if row["staff_account_id"] not in staff_profiles:
            data.add("I1", f"staff_time_off tro toi staff khong ton tai: {row['staff_account_id']}")

    for account in data.rows("accounts"):
        provisioned_by = text(account, "provisioned_by_account_id")
        if provisioned_by and provisioned_by not in accounts:
            data.add("I1", f"provisioned_by tro toi tai khoan khong ton tai: {account['id']}")
        elif provisioned_by:
            if moment(accounts[provisioned_by], "created_at") >= moment(account, "created_at"):
                data.add("V4", f"tai khoan {account['id']} duoc tao boi tai khoan tao sau no")


def service_maps(data: Dataset) -> tuple[dict[str, dict], dict[str, dict]]:
    return data.index("services", "id"), data.index("bookings", "id")


def check_arithmetic(data: Dataset) -> None:
    services, bookings = service_maps(data)
    items_by_booking: dict[str, list[dict]] = defaultdict(list)
    for item in data.rows("booking_items"):
        items_by_booking[item["booking_id"]].append(item)

    for item in data.rows("booking_items"):
        service = services.get(item["service_id"])
        if service is None:
            continue
        steps = num(item, "additional_duration_steps")
        minimum = num(service, "minimum_duration_minutes")
        step = num(service, "duration_step_minutes")
        adjustable = text(service, "is_duration_adjustable") == "1"
        expected_duration = minimum + steps * step if adjustable else minimum
        if num(item, "duration_minutes") != expected_duration:
            data.add(
                "II1",
                f"item {item['id']}: duration {item['duration_minutes']} != {expected_duration}",
            )
        if not adjustable and steps != 0:
            data.add("II1", f"item {item['id']}: dich vu co dinh nhung co {steps} buoc tang")
        expected_amount = money(item, "base_price_snapshot") + steps * money(item, "price_per_step_snapshot")
        if abs(money(item, "line_amount") - expected_amount) > 0.005:
            data.add("II2", f"item {item['id']}: line_amount {item['line_amount']} != {expected_amount}")

        # II6 - snapshot gia/ten phai khop services hoac la ca doi gia co chu dich
        service_updated = moment(service, "updated_at")
        booking = bookings.get(item["booking_id"])
        booking_created = moment(booking, "created_at") if booking else None
        price_changed = money(item, "base_price_snapshot") != money(service, "base_price")
        name_changed = text(item, "service_name_snapshot") != text(service, "name")
        if price_changed or name_changed:
            if not (booking_created and service_updated and service_updated > booking_created):
                data.add(
                    "II6",
                    f"item {item['id']}: snapshot khac services nhung services.updated_at khong sau booking.created_at",
                )
            if price_changed and money(item, "base_price_snapshot") > money(service, "base_price"):
                data.add("II6", f"item {item['id']}: snapshot gia cao hon gia hien tai")

    for booking in data.rows("bookings"):
        items = items_by_booking.get(booking["id"], [])
        if not items:
            data.add("II3", f"booking {booking['id']} khong co item nao")
            continue
        total_amount = sum(money(item, "line_amount") for item in items)
        total_duration = sum(num(item, "duration_minutes") for item in items)
        if abs(money(booking, "total_amount") - total_amount) > 0.005:
            data.add("II3", f"booking {booking['id']}: total_amount {booking['total_amount']} != {total_amount}")
        if num(booking, "total_duration_minutes") != total_duration:
            data.add("II3", f"booking {booking['id']}: total_duration != {total_duration}")
        start, end = moment(booking, "booking_start"), moment(booking, "booking_end")
        if start and end and end != start + timedelta(minutes=num(booking, "total_duration_minutes")):
            data.add("II4", f"booking {booking['id']}: booking_end khong bang start + total_duration")

    for payment in data.rows("payments"):
        booking = bookings.get(payment["booking_id"])
        if booking and abs(money(payment, "amount") - money(booking, "total_amount")) > 0.005:
            data.add("II5", f"payment {payment['id']}: amount khac booking.total_amount")


def check_lifecycle(data: Dataset) -> None:
    payments = data.index("payments", "booking_id")
    feedback = data.index("feedback", "booking_id")

    for booking in data.rows("bookings"):
        booking_id = booking["id"]
        status = booking["status"]
        if status not in BOOKING_STATUSES:
            data.add("III1", f"booking {booking_id}: trang thai khong duoc phep: {status}")
        created = moment(booking, "created_at")
        paid = moment(booking, "updated_at")
        checked_in = moment(booking, "checked_in_at")
        started = moment(booking, "service_started_at")
        completed = moment(booking, "completed_at")
        payment = payments.get(booking_id)
        payment_status = payment["status"] if payment else None
        method = payment["method"] if payment else None
        paid_at = moment(payment, "paid_at") if payment else None
        start = moment(booking, "booking_start")

        chain = [value for value in (created, paid_at, checked_in, started, completed) if value]
        if chain != sorted(chain):
            data.add("III2", f"booking {booking_id}: thu tu moc thoi gian sai {[v.strftime('%m-%d %H:%M') for v in chain]}")
        for label, value in (("created_at", created), ("checked_in_at", checked_in), ("service_started_at", started), ("completed_at", completed)):
            if value and value > SNAPSHOT:
                data.add("VI1", f"booking {booking_id}: {label} sau snapshot")

        if status == "PENDING_PAYMENT":
            if payment_status not in {"UNPAID", "FAILED"}:
                data.add("III3", f"booking {booking_id}: PENDING_PAYMENT nhung payment {payment_status}")
            if any((checked_in, started, completed)):
                data.add("III3", f"booking {booking_id}: PENDING_PAYMENT nhung co moc check-in/start/complete")
        if status == "CONFIRMED":
            if payment_status != "PAID" and not (method == "AT_SPA" and payment_status == "UNPAID" and start and start >= SNAPSHOT):
                data.add("III4", f"booking {booking_id}: CONFIRMED nhung payment {payment_status}/{method}")
        if status == "CHECKED_IN":
            if not checked_in:
                data.add("III5", f"booking {booking_id}: CHECKED_IN thieu checked_in_at")
            if started or completed:
                data.add("III5", f"booking {booking_id}: CHECKED_IN nhung da co moc sau")
            if start and start.date() != SNAPSHOT.date():
                data.add("III5", f"booking {booking_id}: CHECKED_IN khong cung ngay snapshot")
        if status == "IN_SERVICE":
            if not started:
                data.add("III6", f"booking {booking_id}: IN_SERVICE thieu service_started_at")
            if completed:
                data.add("III6", f"booking {booking_id}: IN_SERVICE nhung da completed")
            if start and start.date() != SNAPSHOT.date():
                data.add("III6", f"booking {booking_id}: IN_SERVICE khong cung ngay snapshot")
        if status == "COMPLETED":
            if not completed:
                data.add("III7", f"booking {booking_id}: COMPLETED thieu completed_at")
            if start and start >= SNAPSHOT:
                data.add("III7", f"booking {booking_id}: COMPLETED nhung booking_start sau snapshot")
        if payment:
            if not payment["status"] in PAYMENT_STATUSES:
                data.add("III8", f"payment {payment['id']}: status la")
            if payment["method"] not in PAYMENT_METHODS:
                data.add("III9", f"payment {payment['id']}: method la")
            if payment["status"] == "PAID" and not paid_at:
                data.add("III8", f"payment {payment['id']}: PAID thieu paid_at")
            if payment["status"] in {"UNPAID", "FAILED"} and paid_at:
                data.add("III8", f"payment {payment['id']}: {payment['status']} nhung co paid_at")
            refunded_at = moment(payment, "refunded_at")
            if payment["status"] == "REFUNDED":
                if not paid_at or not refunded_at:
                    data.add("III8", f"payment {payment['id']}: REFUNDED thieu paid_at/refunded_at")
                elif refunded_at < paid_at:
                    data.add("III8", f"payment {payment['id']}: refunded_at truoc paid_at")
            if payment["method"] == "AT_SPA" and payment["status"] == "FAILED":
                data.add("III9", f"payment {payment['id']}: AT_SPA khong the FAILED")
            if payment["method"] == "QR" and not text(payment, "qr_payload"):
                data.add("III9", f"payment {payment['id']}: QR thieu qr_payload")
            if payment["method"] in {"CARD", "AT_SPA"} and text(payment, "qr_payload"):
                data.add("III9", f"payment {payment['id']}: {payment['method']} khong duoc co qr_payload")

    for item in data.rows("feedback"):
        booking = data.index("bookings", "id").get(item["booking_id"])
        if booking is None:
            continue
        if booking["status"] != "COMPLETED":
            data.add("III10", f"feedback {item['id']}: booking chua COMPLETED")
        rating = num(item, "rating")
        if not 1 <= rating <= 5:
            data.add("III10", f"feedback {item['id']}: rating {rating} ngoai 1..5")
        completed = moment(booking, "completed_at")
        created = moment(item, "created_at")
        if completed and created and created < completed:
            data.add("III10", f"feedback {item['id']}: tao truoc khi booking hoan thanh")


def check_schedule(data: Dataset) -> None:
    services, bookings = service_maps(data)
    staff_profile = data.index("staff_profiles", "account_id")
    skills: dict[str, set[str]] = defaultdict(set)
    for row in data.rows("staff_services"):
        skills[row["staff_account_id"]].add(row["service_id"])
    hours: dict[tuple[str, int], list[dict]] = defaultdict(list)
    for row in data.rows("staff_working_hours"):
        hours[(row["staff_account_id"], int(row["day_of_week"]))].append(row)
    time_off: dict[str, list[dict]] = defaultdict(list)
    for row in data.rows("staff_time_off"):
        time_off[row["staff_account_id"]].append(row)

    items_by_booking: dict[str, list[dict]] = defaultdict(list)
    for item in data.rows("booking_items"):
        items_by_booking[item["booking_id"]].append(item)

    intervals: dict[str, list[tuple[datetime, datetime, str]]] = defaultdict(list)
    customer_intervals: dict[str, list[tuple[datetime, datetime, str]]] = defaultdict(list)

    for booking in data.rows("bookings"):
        booking_id = booking["id"]
        staff = text(booking, "staff_account_id")
        start, end = moment(booking, "booking_start"), moment(booking, "booking_end")
        created = moment(booking, "created_at")
        creator = text(booking, "created_by_account_id")
        source = booking["assignment_source"]

        if start is None or end is None:
            data.add("II4", f"booking {booking_id}: thieu booking_start/end")
            continue
        if created and created > SNAPSHOT:
            data.add("VI1", f"booking {booking_id}: created_at sau snapshot")
        if source not in ASSIGNMENT_SOURCES:
            data.add("IV7", f"booking {booking_id}: assignment_source la {source}")
        if source == "CUSTOMER" and not staff:
            data.add("IV7", f"booking {booking_id}: CUSTOMER nhung khong co staff")
        if source in {"SYSTEM", "ADMIN"} and not staff and booking["status"] in {"CHECKED_IN", "IN_SERVICE", "COMPLETED"}:
            data.add("IV7", f"booking {booking_id}: da thuc hien nhung khong co staff")

        role_of_creator = None
        if creator:
            account = data.index("accounts", "id").get(creator)
            if account:
                role_of_creator = ROLES.get(account["role_id"])
        if creator == booking["customer_account_id"]:
            pass
        elif role_of_creator not in {"RECEPTIONIST", "MANAGER", "OWNER"}:
            data.add("IV8", f"booking {booking_id}: nguoi tao {creator} khong phai khach/le tan/quan ly")

        for item in items_by_booking.get(booking_id, []):
            service = services.get(item["service_id"])
            if service is None:
                continue
            if text(service, "is_active") == "0":
                data.add("IV6", f"booking {booking_id}: dung dich vu da ngung {item['service_id']}")

        if not staff:
            customer_intervals[booking["customer_account_id"]].append((start, end, booking_id))
            continue

        if staff not in staff_profile:
            continue
        if text(staff_profile[staff], "is_bookable") == "0":
            data.add("IV5", f"booking {booking_id}: staff {staff} khong nhan booking")
        for item in items_by_booking.get(booking_id, []):
            if item["service_id"] not in skills.get(staff, set()):
                data.add("IV5", f"booking {booking_id}: staff {staff} thieu skill cho service {item['service_id']}")

        allowed = hours.get((staff, day_index(start)), [])
        active = [row for row in allowed if text(row, "is_active") == "1"]
        if not active:
            data.add("IV1", f"booking {booking_id}: staff {staff} khong co gio lam viec ngay {day_index(start)}")
        else:
            if not any(
                datetime.combine(start.date(), datetime.strptime(row["start_time"], "%H:%M:%S").time()) <= start
                and datetime.combine(start.date(), datetime.strptime(row["end_time"], "%H:%M:%S").time()) >= end
                for row in active
            ):
                data.add("IV1", f"booking {booking_id}: ngoai khung gio lam viec cua staff {staff}")

        for row in time_off.get(staff, []):
            off_start, off_end = moment(row, "start_at"), moment(row, "end_at")
            if off_start and off_end and overlaps(start, end, off_start, off_end):
                data.add("IV2", f"booking {booking_id}: trung thoi gian nghi cua staff {staff}")

        prep = cleanup = 0
        for item in items_by_booking.get(booking_id, []):
            service = services.get(item["service_id"])
            if service:
                prep += num(service, "preparation_buffer_minutes")
                cleanup += num(service, "cleanup_buffer_minutes")
        intervals[staff].append((start - timedelta(minutes=prep), end + timedelta(minutes=cleanup), booking_id))
        customer_intervals[booking["customer_account_id"]].append((start, end, booking_id))

    for staff, spans in intervals.items():
        spans.sort()
        for index in range(len(spans) - 1):
            if overlaps(spans[index][0], spans[index][1], spans[index + 1][0], spans[index + 1][1]):
                data.add("IV3", f"staff {staff}: booking {spans[index][2]} giao booking {spans[index + 1][2]} (ke ca buffer)")

    for customer, spans in customer_intervals.items():
        spans.sort()
        for index in range(len(spans) - 1):
            if overlaps(spans[index][0], spans[index][1], spans[index + 1][0], spans[index + 1][1]):
                data.add("IV4", f"khach {customer}: booking {spans[index][2]} giao booking {spans[index + 1][2]}")


def check_identity(data: Dataset) -> None:
    accounts = data.rows("accounts")
    emails = Counter(row["email"] for row in accounts)
    names = Counter(row["display_name"] for row in accounts)
    subjects = Counter(text(row, "google_subject") for row in accounts if text(row, "google_subject"))
    expected_prefix = {
        "OWNER": "owner",
        "MANAGER": "manager",
        "RECEPTIONIST": "reception",
        "THERAPIST": "therapist",
        "ACCOUNTANT": "accountant",
        "CUSTOMER": "customer",
    }
    for row in accounts:
        role = ROLES.get(row["role_id"])
        email = row["email"]
        if emails[email] > 1:
            data.add("V1", f"email trung: {email}")
        if role and not email.startswith(expected_prefix.get(role, "\0")):
            data.add("V1", f"email {email} khong dung tien to cho role {role}")
        if names[row["display_name"]] > 1:
            data.add("V2", f"display_name trung: {row['display_name']}")
        subject = text(row, "google_subject")
        if subject and not subject.isdigit():
            data.add("V3", f"google_subject khong phai chuoi so: {subject}")
        if subject and subjects[subject] > 1:
            data.add("V3", f"google_subject trung: {subject}")
        if bool(subject) != bool(text(row, "last_login_at")):
            data.add("V3", f"tai khoan {row['id']}: google_subject va last_login_at khong di cung nhau")
        created = moment(row, "created_at")
        last_login = moment(row, "last_login_at")
        if created and last_login and last_login < created:
            data.add("VI1", f"tai khoan {row['id']}: last_login_at truoc created_at")

    services = data.index("services", "id")
    for row in data.rows("staff_profiles"):
        if not row["employee_code"].startswith("LNR-TH-"):
            data.add("V5", f"employee_code sai dinh dang: {row['employee_code']}")
        skill_categories = {text(services[service_id], "category") for service_id in {r["service_id"] for r in data.rows("staff_services") if r["staff_account_id"] == row["account_id"]} if service_id in services}
        if row["job_title"] == "Facial Specialist" and "FACIAL" not in skill_categories:
            data.add("V5", f"staff {row['account_id']}: Facial Specialist nhung khong co dich vu FACIAL")

    phones = Counter(row["phone"] for row in data.rows("customer_profiles") if text(row, "phone"))
    for row in data.rows("customer_profiles"):
        phone = text(row, "phone")
        if not phone:
            continue
        if not (phone.isdigit() and len(phone) == 10 and phone.startswith("0")):
            data.add("V6", f"phone sai dinh dang VN: {phone}")
        if phones[phone] > 1:
            data.add("V6", f"phone trung: {phone}")

    bookings_by_customer: dict[str, list[dict]] = defaultdict(list)
    for booking in data.rows("bookings"):
        bookings_by_customer[booking["customer_account_id"]].append(booking)
    for profile in data.rows("customer_profiles"):
        phone = text(profile, "phone")
        entries = sorted(bookings_by_customer.get(profile["account_id"], []), key=lambda row: text(row, "created_at") or "")
        if not entries or not phone:
            continue
        latest = entries[-1]
        if text(latest, "customer_phone_snapshot") != phone:
            data.add("V6", f"khach {profile['account_id']}: phone ho so khac customer_phone_snapshot moi nhat")


def check_time(data: Dataset) -> None:
    for table in TABLES:
        for row in data.rows(table):
            for key, value in row.items():
                if not (key.endswith("_at") or key.endswith("occurred_at")) or not text(row, key):
                    continue
                try:
                    parsed = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    continue
                if parsed > SNAPSHOT:
                    # Cho phep moc nam trong tuong lai: khung booking cua booking chua dien ra,
                    # va khung nghi phep da len ke hoach (start_at/end_at cua staff_time_off).
                    if table == "bookings" and key in {"booking_start", "booking_end"}:
                        continue
                    if table == "staff_time_off" and key in {"start_at", "end_at"}:
                        continue
                    data.add("VI1", f"{table}.{key} sau snapshot (id={row.get('id')}): {value}")
            created, updated = moment(row, "created_at"), moment(row, "updated_at")
            if created and updated and updated < created:
                data.add("VI2", f"{table} id={row.get('id')}: updated_at truoc created_at")

    staff_created = {row["account_id"]: moment(row, "created_at") for row in data.rows("staff_profiles")}
    for row in data.rows("staff_working_hours"):
        created = moment(row, "created_at")
        profile_created = staff_created.get(row["staff_account_id"])
        if created and profile_created and created < profile_created:
            data.add("VI3", f"gio lam viec id={row['id']} tao truoc ho so nhan vien {row['staff_account_id']}")


def check_events(data: Dataset) -> None:
    bookings = data.index("bookings", "id")
    payments = data.index("payments", "booking_id")
    accounts = data.index("accounts", "id")
    role_of = {row["id"]: row["code"] for row in data.rows("roles")}
    receptionists = {row["id"] for row in data.rows("accounts") if role_of.get(row["role_id"]) == "RECEPTIONIST"}

    by_booking: dict[str, list[dict]] = defaultdict(list)
    for event in data.rows("booking_events"):
        by_booking[event["booking_id"]].append(event)

    for event in data.rows("booking_events"):
        occurred = moment(event, "occurred_at")
        if occurred and occurred > SNAPSHOT:
            data.add("VI1", f"event {event['id']} sau snapshot")

    # VII1 - trong mot booking, id tang dan thi occurred_at khong duoc giam
    for booking_id, events in by_booking.items():
        ordered = sorted(events, key=lambda row: int(row["id"]))
        times = [moment(event, "occurred_at") for event in ordered]
        for index in range(len(times) - 1):
            if times[index] and times[index + 1] and times[index + 1] < times[index]:
                data.add(
                    "VII1",
                    f"booking {booking_id}: event id {ordered[index+1]['id']} xay ra truoc id {ordered[index]['id']}",
                )
                break

    for booking in data.rows("bookings"):
        events = sorted(by_booking.get(booking["id"], []), key=lambda row: text(row, "occurred_at") or "")
        types = [event["event_type"] for event in events]
        status = booking["status"]
        booking_id = booking["id"]
        if not events:
            data.add("VII2", f"booking {booking_id}: khong co event")
            continue
        if types[0] != "CREATED":
            data.add("VII2", f"booking {booking_id}: event dau tien la {types[0]}")
        elif moment(events[0], "occurred_at") != moment(booking, "created_at"):
            data.add("VII2", f"booking {booking_id}: occurred_at(CREATED) khac created_at")

        payment = payments.get(booking_id)
        paid_ever = bool(payment and payment["status"] in {"PAID", "REFUNDED"})
        if ("PAYMENT_RECEIVED" in types) != paid_ever:
            data.add(
                "VII3",
                f"booking {booking_id}: PAYMENT_RECEIVED={('PAYMENT_RECEIVED' in types)} nhung payment da thu={paid_ever}",
            )
        rank = STATUS_RANK.get(status, -1)
        for event_type, minimum in (("CHECKED_IN", 2), ("SERVICE_STARTED", 3), ("COMPLETED", 4)):
            present = event_type in types
            expected = rank >= minimum
            if present != expected:
                data.add("VII3", f"booking {booking_id}: event {event_type}={present} nhung status={status}")
        has_staff = text(booking, "staff_account_id") is not None
        if ("STAFF_ASSIGNED" in types) != has_staff:
            data.add("VII4", f"booking {booking_id}: STAFF_ASSIGNED={('STAFF_ASSIGNED' in types)} nhung co staff={has_staff}")

        for event in events:
            actor = text(event, "actor_account_id")
            if event["event_type"] == "CREATED" and actor != text(booking, "created_by_account_id"):
                data.add("VII5", f"booking {booking_id}: CREATED boi {actor} khac created_by")
            if event["event_type"] == "CHECKED_IN" and actor not in receptionists:
                data.add("VII5", f"booking {booking_id}: CHECKED_IN boi tai khoan khong phai le tan: {actor}")
            if event["event_type"] in {"SERVICE_STARTED", "COMPLETED"} and actor != text(booking, "staff_account_id"):
                data.add("VII5", f"booking {booking_id}: {event['event_type']} boi {actor} khac staff cua booking")


def check_schema_constraints(data: Dataset) -> None:
    """Phan anh dung cac CHECK constraint trong database/Web_DataBase_USTH.sql."""
    for row in data.rows("services"):
        if money(row, "base_price") < 0:
            data.add("I1", f"service {row['id']}: base_price am")
        if num(row, "minimum_duration_minutes") <= 0:
            data.add("I1", f"service {row['id']}: minimum_duration_minutes khong duong")
        if num(row, "preparation_buffer_minutes") < 0 or num(row, "cleanup_buffer_minutes") < 0:
            data.add("I1", f"service {row['id']}: buffer am")
        adjustable = text(row, "is_duration_adjustable") == "1"
        if adjustable and (not text(row, "duration_step_minutes") or not text(row, "price_per_duration_step")):
            data.add("I1", f"service {row['id']}: dich vu tang thoi luong thieu step/price")
        if not adjustable and (text(row, "duration_step_minutes") or text(row, "price_per_duration_step")):
            data.add("I1", f"service {row['id']}: dich vu co dinh lai co step/price")

    for row in data.rows("staff_working_hours"):
        day = num(row, "day_of_week")
        if not 1 <= day <= 7:
            data.add("I1", f"working_hours {row['id']}: day_of_week ngoai 1..7")
        if text(row, "start_time") >= text(row, "end_time"):
            data.add("I1", f"working_hours {row['id']}: start_time khong nho hon end_time")

    for row in data.rows("staff_time_off"):
        start, end = moment(row, "start_at"), moment(row, "end_at")
        if start and end and start >= end:
            data.add("I1", f"staff_time_off {row['id']}: start_at khong nho hon end_at")

    for row in data.rows("bookings"):
        start, end = moment(row, "booking_start"), moment(row, "booking_end")
        if start and end and start >= end:
            data.add("I1", f"booking {row['id']}: booking_start khong nho hon booking_end")
        if num(row, "total_duration_minutes") <= 0:
            data.add("I1", f"booking {row['id']}: total_duration_minutes khong duong")
        if money(row, "total_amount") < 0:
            data.add("I1", f"booking {row['id']}: total_amount am")

    for row in data.rows("booking_items"):
        if num(row, "duration_minutes") <= 0:
            data.add("I1", f"booking_item {row['id']}: duration_minutes khong duong")
        if num(row, "additional_duration_steps") < 0:
            data.add("I1", f"booking_item {row['id']}: additional_duration_steps am")
        if money(row, "line_amount") < 0 or money(row, "base_price_snapshot") < 0:
            data.add("I1", f"booking_item {row['id']}: gia am")

    for row in data.rows("payments"):
        if money(row, "amount") < 0:
            data.add("I1", f"payment {row['id']}: amount am")


def check_content(data: Dataset) -> None:
    services = data.rows("services")
    for row in services:
        if row["category"] not in SERVICE_CATEGORIES:
            data.add("VIII1", f"service {row['id']}: category {row['category']} khong nam trong {sorted(SERVICE_CATEGORIES)}")
        if text(row, "image_url") and not text(row, "image_url").startswith("http"):
            data.add("VIII2", f"service {row['id']}: image_url khong phai URL tuyet doi: {row['image_url']}")

    notes = [text(row, "customer_note") for row in data.rows("bookings") if text(row, "customer_note")]
    if notes and len(set(notes)) < min(12, len(notes)):
        data.add("VIII3", f"chi co {len(set(notes))} ghi chu khach khac nhau tren {len(notes)} booking co ghi chu")

    comments_by_rating: dict[str, list[str]] = defaultdict(list)
    for row in sorted(data.rows("feedback"), key=lambda item: int(item["id"])):
        comment = text(row, "comment")
        if comment:
            comments_by_rating[row["rating"]].append(comment)
    for rating, comments in comments_by_rating.items():
        if len(set(comments)) < min(4, len(comments)):
            data.add("VIII3", f"rating {rating}: chi co {len(set(comments))} comment khac nhau (<4)")
        repeated = [index for index in range(1, len(comments)) if comments[index] == comments[index - 1]]
        if repeated:
            data.add("VIII3", f"rating {rating}: comment lap lien tiep o {len(repeated)} vi tri")

    for row in data.rows("bookings"):
        code = row["booking_code"]
        if not code.startswith(BOOKING_CODE_PREFIX):
            data.add("VIII4", f"booking {row['id']}: booking_code sai tien to: {code}")
    for row in data.rows("payments"):
        if not row["transaction_code"].startswith(TRANSACTION_CODE_PREFIX):
            data.add("VIII4", f"payment {row['id']}: transaction_code sai tien to")

    items_per_booking: dict[str, int] = defaultdict(int)
    for item in data.rows("booking_items"):
        items_per_booking[item["booking_id"]] += 1
    if not any(count >= 3 for count in items_per_booking.values()):
        data.add("VIII5", "khong co booking nao >= 3 dich vu")
    rescheduled = {event["booking_id"] for event in data.rows("booking_events") if event["event_type"] == "RESCHEDULED"}
    if len(rescheduled) < 2:
        data.add("VIII5", f"chi co {len(rescheduled)} booking reschedule (<2)")
    price_changed = 0
    service_by_id = data.index("services", "id")
    bookings = data.index("bookings", "id")
    for item in data.rows("booking_items"):
        service = service_by_id.get(item["service_id"])
        booking = bookings.get(item["booking_id"])
        if service and booking and money(item, "base_price_snapshot") != money(service, "base_price"):
            if moment(service, "updated_at") and moment(booking, "created_at") and moment(service, "updated_at") > moment(booking, "created_at"):
                price_changed += 1
    if price_changed < 1:
        data.add("VIII5", "khong co ca snapshot gia cu < gia hien tai")
    refunds_with_bad_feedback = 0
    payment_by_booking = data.index("payments", "booking_id")
    feedback_by_booking = data.index("feedback", "booking_id")
    for booking_id, payment in payment_by_booking.items():
        if payment["status"] == "REFUNDED":
            item = feedback_by_booking.get(booking_id)
            if item and num(item, "rating") <= 2:
                refunds_with_bad_feedback += 1
    if refunds_with_bad_feedback < 1:
        data.add("VIII5", "khong co ca refund kem feedback 1-2 sao")
    if not any(p["method"] == "AT_SPA" and p["status"] == "UNPAID" for p in data.rows("payments")):
        data.add("VIII5", "khong co booking AT_SPA chua thanh toan")
    per_customer_day: dict[tuple[str, str], set[str]] = defaultdict(set)
    for booking in data.rows("bookings"):
        start = moment(booking, "booking_start")
        staff = text(booking, "staff_account_id")
        if start and staff:
            per_customer_day[(booking["customer_account_id"], start.date().isoformat())].add(staff)
    if not any(len(staffs) >= 2 for staffs in per_customer_day.values()):
        data.add("VIII5", "khong co khach dat 2 booking cung ngay voi 2 staff khac nhau")


CHECKS = (
    check_references,
    check_schema_constraints,
    check_arithmetic,
    check_lifecycle,
    check_schedule,
    check_identity,
    check_time,
    check_events,
    check_content,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Kiem tra toan ven dataset mock theo RULES.md")
    parser.add_argument("--csv-dir", required=True, help="Thu muc chua 15 file CSV")
    parser.add_argument("--expect-violations", action="store_true", help="Tra ve 0 khi CO vi pham (de test bo kiem)")
    parser.add_argument("--max-detail", type=int, default=12, help="So dong chi tiet toi da in ra moi rule")
    args = parser.parse_args()

    root = Path(args.csv_dir)
    if not root.is_dir():
        print(f"Khong tim thay thu muc: {root}", file=sys.stderr)
        return 2

    data = load(root)
    for check in CHECKS:
        check(data)

    grouped: dict[str, list[str]] = defaultdict(list)
    for problem in data.problems:
        grouped[problem.rule].append(problem.detail)

    print(f"Dataset: {root}")
    for table in TABLES:
        print(f"  {table:<22}{len(data.rows(table)):>6} dong")
    print()

    if not data.problems:
        print("Ket qua: 0 vi pham")
        return 1 if args.expect_violations else 0

    print(f"Ket qua: {len(data.problems)} vi pham")
    for rule in sorted(grouped):
        details = grouped[rule]
        print(f"\n[{rule}] {len(details)} vi pham")
        for detail in details[: args.max_detail]:
            print(f"  - {detail}")
        if len(details) > args.max_detail:
            print(f"  ... con {len(details) - args.max_detail} dong nua")
    return 0 if args.expect_violations else 1


if __name__ == "__main__":
    sys.exit(main())

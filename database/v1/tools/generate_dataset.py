"""Sinh dataset mock v1 theo database/v1/RULES.md.

    python3 database/v1/tools/generate_dataset.py --dataset Testing
    python3 database/v1/tools/generate_dataset.py --dataset Production --out-dir /tmp/v1

Dac diem:
- Deterministic: cung seed thi ra cung file, byte-for-byte.
- Bat bien duoc ap ngay khi sinh (scheduler khong bao gio tao lich trung), sau do
  chay lai check_dataset.py de bat hoi quy.
- Sinh kem VALIDATION_SUMMARY.json (dem + phan bo + sha256) de chong troi du lieu.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import sys
from collections import defaultdict
from datetime import datetime, time, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dataset_config import (  # noqa: E402
    CUSTOMER_NOTES,
    FEEDBACK_COMMENTS,
    GIVEN_FEMALE,
    GIVEN_MALE,
    JOB_TITLES,
    MIDDLE_FEMALE,
    MIDDLE_MALE,
    PAYMENT_METHOD_WEIGHTS,
    POSITIVE_RATING_WEIGHTS,
    PROFILES,
    SERVICES,
    SHIFTS,
    SNAPSHOT,
    SURNAMES,
    TIME_OFF_REASONS,
)

TOOLS_DIR = Path(__file__).resolve().parent
V1_DIR = TOOLS_DIR.parent
DB_DIR = V1_DIR.parent
STATIC_SOURCE = DB_DIR / "Testing"  # roles/permissions/role_permissions lay tu day
NULL = "\\N"
ROLE_ORDER = ("OWNER", "MANAGER", "RECEPTIONIST", "THERAPIST", "ACCOUNTANT", "CUSTOMER")
ROLE_ID = {"OWNER": 1, "MANAGER": 2, "RECEPTIONIST": 3, "THERAPIST": 4, "ACCOUNTANT": 5, "CUSTOMER": 6}
PROVISIONER_ROLE = {"MANAGER": "OWNER", "ACCOUNTANT": "OWNER", "RECEPTIONIST": "MANAGER", "THERAPIST": "MANAGER"}
STATIC_TABLES = ("roles", "permissions", "role_permissions")
TABLES = (
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
)


def fmt(value: datetime) -> str:
    return value.strftime("%Y-%m-%d %H:%M:%S")


def fmt_time(value: time) -> str:
    return value.strftime("%H:%M:%S")


class Generator:
    def __init__(self, dataset: str, out_dir: Path) -> None:
        self.dataset = dataset
        self.profile = PROFILES[dataset]
        self.rng = random.Random(self.profile["seed"])
        self.out_dir = out_dir
        self.tables: dict[str, list[dict[str, str]]] = {name: [] for name in TABLES}
        self.used_names: set[str] = set()
        self.used_subjects: set[str] = set()
        self.used_phones: set[str] = set()
        self.note_queue: list[str | None] = []
        self.service_by_id = {
            row[0]: {
                "id": row[0],
                "name": row[1],
                "category": row[2],
                "description": row[3],
                "base_price": row[4],
                "minimum_duration_minutes": row[5],
                "is_duration_adjustable": 1 if row[6] else 0,
                "duration_step_minutes": row[6],
                "price_per_duration_step": row[7],
                "preparation_buffer_minutes": row[8],
                "cleanup_buffer_minutes": row[9],
                "display_order": row[10],
                "is_active": row[11],
            }
            for row in SERVICES
        }
        self.active_service_ids = [
            service_id for service_id in self.profile["service_ids"] if self.service_by_id[service_id]["is_active"] == 1
        ]
        self.staff_ids: list[int] = []
        self.customer_ids: list[int] = []
        self.receptionist_ids: list[int] = []
        self.staff_shifts: dict[int, list[tuple[int, time, time]]] = defaultdict(list)
        self.staff_skills: dict[int, set[int]] = defaultdict(set)
        self.staff_time_off: dict[int, list[tuple[datetime, datetime]]] = defaultdict(list)
        self.staff_busy: dict[int, list[tuple[datetime, datetime]]] = defaultdict(list)
        self.customer_busy: dict[int, list[tuple[datetime, datetime]]] = defaultdict(list)

    # ------------------------------------------------------------------ tien ich
    def add(self, table: str, row: dict[str, str | int | None]) -> dict[str, str]:
        normalized = {key: (NULL if value is None else str(value)) for key, value in row.items()}
        self.tables[table].append(normalized)
        return normalized

    def full_name(self, gender: str) -> str:
        for _ in range(500):
            middle = self.rng.choice(MIDDLE_FEMALE if gender == "F" else MIDDLE_MALE)
            given = self.rng.choice(GIVEN_FEMALE if gender == "F" else GIVEN_MALE)
            name = f"{self.rng.choice(SURNAMES)} {middle} {given}"
            if name not in self.used_names:
                self.used_names.add(name)
                return name
        raise RuntimeError("khong sinh du ten khac nhau")

    def google_subject(self) -> str:
        while True:
            value = str(self.rng.randint(10**20, 10**21 - 1))
            if value not in self.used_subjects:
                self.used_subjects.add(value)
                return value

    def phone(self) -> str:
        while True:
            value = f"0{self.rng.choice(['9', '8', '7', '5'])}{self.rng.randint(10**7, 10**8 - 1)}"
            if value not in self.used_phones:
                self.used_phones.add(value)
                return value

    def note(self, previous: str | None) -> str | None:
        """Dung het pool ghi chu roi moi lap lai, va khong lap lien ke."""
        if not self.note_queue:
            queue: list[str | None] = list(CUSTOMER_NOTES)
            self.rng.shuffle(queue)
            if previous is not None and queue and queue[0] == previous:
                queue.append(queue.pop(0))
            self.note_queue = queue
        value = self.note_queue.pop(0)
        if value == previous and self.note_queue:
            value, self.note_queue[0] = self.note_queue[0], value
        return value

    # ------------------------------------------------------------------ bang tinh
    def build_static_tables(self) -> None:
        for table in STATIC_TABLES:
            source = STATIC_SOURCE / f"{table}.csv"
            with source.open(encoding="utf-8", newline="") as handle:
                for row in csv.DictReader(handle):
                    self.tables[table].append(dict(row))

    def build_accounts(self) -> None:
        created = {role: [] for role in ROLE_ORDER}
        next_id = 1
        for role in ROLE_ORDER:
            for index in range(self.profile["accounts"][role]):
                gender = "F" if role in {"RECEPTIONIST", "ACCOUNTANT"} else "M"
                if role in {"THERAPIST", "CUSTOMER", "MANAGER"}:
                    gender = self.rng.choice(["F", "M"])
                name = self.full_name(gender)
                account_created = SNAPSHOT - timedelta(days=self.rng.randint(30, 420), minutes=self.rng.randint(0, 600))
                if role == "CUSTOMER":
                    inactive = index >= self.profile["accounts"][role] - self.profile["inactive_customers"]
                else:
                    inactive = False
                provisioner = None
                if role in PROVISIONER_ROLE and created[PROVISIONER_ROLE[role]]:
                    pool = created[PROVISIONER_ROLE[role]]
                    provisioner = pool[index % len(pool)]
                    if provisioner is not None:
                        provisioner_created = datetime.strptime(
                            next(row["created_at"] for row in self.tables["accounts"] if row["id"] == str(provisioner)),
                            "%Y-%m-%d %H:%M:%S",
                        )
                        earliest = provisioner_created + timedelta(days=self.rng.randint(1, 30))
                        if account_created < earliest:
                            account_created = earliest
                        if account_created > SNAPSHOT - timedelta(days=1):
                            account_created = SNAPSHOT - timedelta(days=1)
                last_login = None if inactive else account_created + timedelta(days=self.rng.randint(1, 20), hours=self.rng.randint(0, 23))
                if last_login and last_login > SNAPSHOT:
                    last_login = SNAPSHOT - timedelta(hours=self.rng.randint(1, 48))
                if last_login and last_login < account_created:
                    last_login = account_created + timedelta(hours=1)
                email_prefix = {
                    "OWNER": "owner",
                    "MANAGER": "manager",
                    "RECEPTIONIST": "reception",
                    "THERAPIST": "therapist",
                    "ACCOUNTANT": "accountant",
                    "CUSTOMER": "customer",
                }[role]
                # Tai khoan duoc cap truoc chi co google_subject sau khi dang nhap lan dau.
                subject = None if inactive else self.google_subject()
                self.add(
                    "accounts",
                    {
                        "id": next_id,
                        "role_id": ROLE_ID[role],
                        "google_subject": subject,
                        "email": f"{email_prefix}{next_id}@lunara-spa.demo",
                        "display_name": name,
                        "avatar_url": f"https://ui-avatars.com/api/?name={'+'.join(name.split())}",
                        "is_active": 0 if inactive else 1,
                        "provisioned_by_account_id": provisioner,
                        "last_login_at": fmt(last_login) if (last_login and subject) else None,
                        "created_at": fmt(account_created),
                        "updated_at": fmt(min(max(account_created, (last_login or account_created) + timedelta(hours=1)), SNAPSHOT)),
                    },
                )
                created[role].append(next_id)
                next_id += 1

        self.staff_ids = created["THERAPIST"]
        self.customer_ids = created["CUSTOMER"]
        self.receptionist_ids = created["RECEPTIONIST"]

    def build_customer_profiles(self) -> None:
        notes_preferences = [
            "Da nhạy cảm",
            "Ưu tiên phòng yên tĩnh",
            "Massage lực vừa",
            "Không sử dụng tinh dầu mùi mạnh",
            "Thường đặt lịch cuối tuần",
            None,
            "Thích phòng có ánh sáng dịu",
            "Ưu tiên kỹ thuật viên nữ",
        ]
        internal_notes = [
            "Khách hàng thân thiết",
            "Cần xác nhận trước khi thay đổi lịch",
            "Đã từng phản hồi về nhiệt độ phòng",
            None,
            None,
            "Thường đến sớm 15 phút",
        ]
        accounts = {row["id"]: row for row in self.tables["accounts"]}
        for account_id in self.customer_ids:
            account = accounts[str(account_id)]
            created = account["created_at"]
            self.add(
                "customer_profiles",
                {
                    "account_id": account_id,
                    "phone": self.phone(),
                    "preferences": self.rng.choice(notes_preferences),
                    "internal_notes": self.rng.choice(internal_notes),
                    "created_at": created,
                    "updated_at": max_datetime(created, self.rng.randint(0, 90)),
                },
            )

    def build_services(self) -> None:
        for row in SERVICES:
            if row[0] not in self.profile["service_ids"]:
                continue
            created = SNAPSHOT - timedelta(days=self.rng.randint(200, 260), hours=self.rng.randint(0, 8))
            self.add(
                "services",
                {
                    "id": row[0],
                    "name": row[1],
                    "category": row[2],
                    "description": row[3],
                    "image_url": None,
                    "base_price": row[4],
                    "minimum_duration_minutes": row[5],
                    "is_duration_adjustable": 1 if row[6] else 0,
                    "duration_step_minutes": row[6],
                    "price_per_duration_step": row[7],
                    "preparation_buffer_minutes": row[8],
                    "cleanup_buffer_minutes": row[9],
                    "display_order": row[10],
                    "is_active": row[11],
                    "created_at": fmt(created),
                    "updated_at": fmt(created + timedelta(days=self.rng.randint(20, 120))),
                },
            )

    def build_staff_profiles(self) -> None:
        accounts = {row["id"]: row for row in self.tables["accounts"]}
        for index, account_id in enumerate(self.staff_ids):
            account = accounts[str(account_id)]
            has_facial = index % 4 == 2
            title = "Facial Specialist" if has_facial else JOB_TITLES[index % 3]
            created = datetime.strptime(account["created_at"], "%Y-%m-%d %H:%M:%S")
            bookable = 0 if (self.dataset == "Production" and index == len(self.staff_ids) - 1) else 1
            self.add(
                "staff_profiles",
                {
                    "account_id": account_id,
                    "employee_code": f"LNR-TH-{index + 1:03d}",
                    "job_title": title,
                    "is_bookable": bookable,
                    "created_at": fmt(created),
                    "updated_at": fmt(min(created + timedelta(days=self.rng.randint(10, 90)), SNAPSHOT)),
                },
            )
            self.assign_skills(account_id, title)
        self.bookable_staff_ids = [
            int(row["account_id"]) for row in self.tables["staff_profiles"] if row["is_bookable"] == "1"
        ]

    def assign_skills(self, account_id: int, title: str) -> None:
        facial = [sid for sid in self.active_service_ids if self.service_by_id[sid]["category"] == "FACIAL"]
        massage = [sid for sid in self.active_service_ids if self.service_by_id[sid]["category"] == "MASSAGE"]
        body = [sid for sid in self.active_service_ids if self.service_by_id[sid]["category"] == "BODY"]
        chosen: set[int] = set()
        if title == "Facial Specialist":
            chosen.update(facial)
            chosen.update(self.rng.sample(massage, k=min(1, len(massage))))
        elif title == "Massage Specialist":
            chosen.update(massage)
            chosen.update(self.rng.sample(body, k=min(2, len(body))))
        elif title == "Senior Therapist":
            chosen.update(self.rng.sample(facial, k=min(2, len(facial))))
            chosen.update(self.rng.sample(massage, k=min(2, len(massage))))
            chosen.update(self.rng.sample(body, k=min(1, len(body))))
        else:
            chosen.update(self.rng.sample(massage, k=min(2, len(massage))))
            chosen.update(self.rng.sample(body, k=min(1, len(body))))
            chosen.update(self.rng.sample(facial, k=min(1, len(facial))))
        if not chosen:
            chosen.update(self.active_service_ids[:1])
        for service_id in sorted(chosen):
            self.staff_skills[account_id].add(service_id)
            self.add("staff_services", {"staff_account_id": account_id, "service_id": service_id})

    def build_working_hours(self) -> None:
        accounts = {row["id"]: row for row in self.tables["accounts"]}
        profiles = {row["account_id"]: row for row in self.tables["staff_profiles"]}
        row_id = 1
        for index, account_id in enumerate(self.staff_ids):
            shift = SHIFTS[index % len(SHIFTS)]
            day_off = (index % 6) + 1
            profile_created = datetime.strptime(profiles[str(account_id)]["created_at"], "%Y-%m-%d %H:%M:%S")
            hours_created = profile_created + timedelta(days=self.rng.randint(1, 10))
            for day in range(1, 7):
                active = 0 if day == day_off else 1
                self.add(
                    "staff_working_hours",
                    {
                        "id": row_id,
                        "staff_account_id": account_id,
                        "day_of_week": day,
                        "start_time": shift[0],
                        "end_time": shift[1],
                        "is_active": active,
                        "created_at": fmt(hours_created),
                        "updated_at": fmt(min(hours_created + timedelta(days=self.rng.randint(1, 30)), SNAPSHOT)),
                    },
                )
                if active:
                    self.staff_shifts[account_id].append(
                        (day, datetime.strptime(shift[0], "%H:%M:%S").time(), datetime.strptime(shift[1], "%H:%M:%S").time())
                    )
                row_id += 1

    def build_time_off(self) -> None:
        row_id = 1
        entries = max(4, len(self.staff_ids) // 3)
        for _ in range(entries):
            account_id = self.rng.choice(self.staff_ids)
            if self.rng.random() < 0.6:
                base = SNAPSHOT + timedelta(days=self.rng.randint(2, 40))
            else:
                base = SNAPSHOT - timedelta(days=self.rng.randint(5, 90))
            start = base.replace(hour=9, minute=0, second=0, microsecond=0)
            end = start.replace(hour=18)
            created = start - timedelta(days=self.rng.randint(3, 21))
            if created > SNAPSHOT:
                created = SNAPSHOT - timedelta(days=self.rng.randint(1, 10))
            self.add(
                "staff_time_off",
                {
                    "id": row_id,
                    "staff_account_id": account_id,
                    "start_at": fmt(start),
                    "end_at": fmt(end),
                    "reason": self.rng.choice(TIME_OFF_REASONS),
                    "created_at": fmt(created),
                },
            )
            # Dua ca nghi phep tuong lai vao scheduler, neu khong booking se roi vao ngay da xin nghi.
            self.staff_time_off[account_id].append((start, end))
            row_id += 1

    # ------------------------------------------------------------------ lich
    def staff_free(self, account_id: int, start: datetime, end: datetime) -> bool:
        for busy_start, busy_end in self.staff_busy[account_id]:
            if start < busy_end and end > busy_start:
                return False
        for off_start, off_end in self.staff_time_off[account_id]:
            if start < off_end and end > off_start:
                return False
        return True

    def customer_free(self, account_id: int, start: datetime, end: datetime) -> bool:
        for busy_start, busy_end in self.customer_busy[account_id]:
            if start < busy_end and end > busy_start:
                return False
        return True

    def find_slot(
        self,
        account_id: int,
        days: list[datetime],
        duration: int,
        buffer_before: int,
        buffer_after: int,
        customer_id: int,
        earliest: datetime,
        latest: datetime | None = None,
    ) -> datetime | None:
        for day in days:
            weekday = day.weekday() + 1
            for shift_day, shift_start, shift_end in self.staff_shifts[account_id]:
                if shift_day != weekday:
                    continue
                window_start = datetime.combine(day.date(), shift_start)
                window_end = datetime.combine(day.date(), shift_end) - timedelta(minutes=duration)
                if window_start < earliest:
                    window_start = earliest
                if latest and window_end > latest:
                    window_end = latest
                if window_end < window_start:
                    continue
                candidates: list[datetime] = []
                cursor = window_start
                while cursor <= window_end:
                    candidates.append(cursor)
                    cursor += timedelta(minutes=15)
                self.rng.shuffle(candidates)
                for start in candidates[:40]:
                    end = start + timedelta(minutes=duration)
                    if not self.staff_free(account_id, start - timedelta(minutes=buffer_before), end + timedelta(minutes=buffer_after)):
                        continue
                    if not self.customer_free(customer_id, start, end):
                        continue
                    return start
        return None

    def pick_services(self, count: int, account_id: int) -> list[int] | None:
        pool = [sid for sid in self.staff_skills[account_id]]
        if len(pool) < count:
            return None
        return self.rng.sample(sorted(pool), k=count)

    def service_duration(self, service_id: int) -> int:
        service = self.service_by_id[service_id]
        if not service["is_duration_adjustable"]:
            return service["minimum_duration_minutes"]
        return service["minimum_duration_minutes"] + self.rng.choice([0, 1, 1, 2]) * service["duration_step_minutes"]

    def next_booking_id(self) -> int:
        return len(self.tables["bookings"]) + 1

    def create_booking(
        self,
        *,
        status: str,
        account_id: int,
        customer_id: int,
        services: list[int],
        durations: list[int],
        start: datetime,
        created: datetime,
        source: str,
    ) -> int:
        booking_id = self.next_booking_id()
        duration_total = sum(durations)
        end = start + timedelta(minutes=duration_total)
        total_amount = sum(
            self.line_amount(service_id, duration)
            for service_id, duration in zip(services, durations, strict=True)
        )
        created_by = customer_id if source == "CUSTOMER" else self.rng.choice(self.receptionist_ids)
        note = self.note(self.last_note)
        self.add(
            "bookings",
            {
                "id": booking_id,
                "booking_code": f"LNR-{start:%Y%m%d}-{booking_id:05d}",
                "customer_account_id": customer_id,
                "staff_account_id": account_id,
                "status": status,
                "assignment_source": source,
                "customer_name_snapshot": self.customer_name(customer_id),
                "customer_email_snapshot": f"customer{customer_id}@lunara-spa.demo",
                "customer_phone_snapshot": self.customer_phone(customer_id),
                "booking_start": fmt(start),
                "booking_end": fmt(end),
                "customer_note": note,
                "total_duration_minutes": duration_total,
                "total_amount": total_amount,
                "checked_in_at": None,
                "service_started_at": None,
                "completed_at": None,
                "created_by_account_id": created_by,
                "created_at": fmt(created),
                "updated_at": fmt(created),
            },
        )
        self.last_note = note
        for service_id, duration in zip(services, durations, strict=True):
            service = self.service_by_id[service_id]
            steps = (
                0
                if not service["is_duration_adjustable"]
                else (duration - service["minimum_duration_minutes"]) // service["duration_step_minutes"]
            )
            self.add(
                "booking_items",
                {
                    "id": len(self.tables["booking_items"]) + 1,
                    "booking_id": booking_id,
                    "service_id": service_id,
                    "service_name_snapshot": service["name"],
                    "duration_minutes": duration,
                    "base_price_snapshot": service["base_price"],
                    "additional_duration_steps": steps,
                    "price_per_step_snapshot": service["price_per_duration_step"] or 0,
                    "line_amount": self.line_amount(service_id, duration),
                    "created_at": fmt(created),
                },
            )
        buffer_before = sum(self.service_by_id[sid]["preparation_buffer_minutes"] for sid in services)
        buffer_after = sum(self.service_by_id[sid]["cleanup_buffer_minutes"] for sid in services)
        self.customer_busy[customer_id].append((start, end))
        self.staff_busy[account_id].append(
            (start - timedelta(minutes=buffer_before), end + timedelta(minutes=buffer_after))
        )
        return booking_id

    def build_bookings(self) -> None:
        plan: list[str] = []
        for status, count in self.profile["bookings"].items():
            plan.extend([status] * count)
        self.rng.shuffle(plan)

        paired_customer: int | None = None
        paired_staff: list[int] = []
        misses = 0

        for index, status in enumerate(plan):
            placed = False
            # Trang thai trong ngay snapshot co it khung gio hon nen can nhieu lan thu hon.
            attempts = 30 if status in {"CHECKED_IN", "IN_SERVICE"} else 8
            for attempt in range(attempts):
                account_id = self.rng.choice(self.bookable_staff_ids)
                force_three = index == 0 and attempt < 3
                count = 3 if force_three else self.rng.choices([1, 2], weights=[88, 12])[0]
                services = self.pick_services(count, account_id)
                if services is None:
                    continue
                customer_id = self.rng.choice(self.customer_ids)
                if status == "CHECKED_IN" and paired_customer is not None and len(paired_staff) < 2:
                    candidates = [
                        sid
                        for sid in self.bookable_staff_ids
                        if sid not in paired_staff and all(service in self.staff_skills[sid] for service in services)
                    ]
                    if not candidates:
                        continue
                    customer_id = paired_customer
                    account_id = self.rng.choice(candidates)

                durations = [self.service_duration(service_id) for service_id in services]
                total_duration = sum(durations)
                buffer_before = sum(self.service_by_id[sid]["preparation_buffer_minutes"] for sid in services)
                buffer_after = sum(self.service_by_id[sid]["cleanup_buffer_minutes"] for sid in services)

                if status == "COMPLETED":
                    days = [SNAPSHOT - timedelta(days=self.rng.randint(2, self.profile["history_days"])) for _ in range(8)]
                    earliest = SNAPSHOT - timedelta(days=self.profile["history_days"] + 30)
                    latest = SNAPSHOT - timedelta(days=2)
                elif status in {"CHECKED_IN", "IN_SERVICE"}:
                    days = [SNAPSHOT]
                    earliest = SNAPSHOT.replace(hour=9, minute=0)
                    latest = (
                        SNAPSHOT.replace(hour=13, minute=0)
                        if status == "IN_SERVICE"
                        else SNAPSHOT.replace(hour=14, minute=0)
                    )
                else:
                    days = [SNAPSHOT + timedelta(days=self.rng.randint(1, self.profile["future_days"])) for _ in range(8)]
                    earliest = SNAPSHOT + timedelta(hours=2)
                    latest = None

                start = self.find_slot(
                    account_id, days, total_duration, buffer_before, buffer_after, customer_id, earliest, latest
                )
                if start is None:
                    continue

                lead_days = {
                    "COMPLETED": self.rng.randint(2, 20),
                    "CHECKED_IN": self.rng.randint(1, 25),
                    "IN_SERVICE": self.rng.randint(1, 25),
                    "CONFIRMED": self.rng.randint(1, 25),
                    "PENDING_PAYMENT": self.rng.randint(0, 12),
                }[status]
                created = start - timedelta(
                    days=lead_days, hours=self.rng.randint(0, 6), minutes=self.rng.choice([0, 15, 30, 45])
                )
                if created > SNAPSHOT:
                    created = SNAPSHOT - timedelta(hours=self.rng.randint(2, 30))
                if created >= start:
                    created = start - timedelta(days=1)

                source = self.rng.choices(["SYSTEM", "CUSTOMER", "ADMIN"], weights=[41, 32, 27])[0]
                self.create_booking(
                    status=status,
                    account_id=account_id,
                    customer_id=customer_id,
                    services=services,
                    durations=durations,
                    start=start,
                    created=created,
                    source=source,
                )
                if status == "CHECKED_IN":
                    if paired_customer is None:
                        paired_customer = customer_id
                    paired_staff.append(account_id)
                placed = True
                break
            if not placed:
                misses += 1

        if misses:
            print(f"  [canh bao] {misses} booking khong xep duoc cho, da bo qua")
        if paired_customer is None or len(paired_staff) < 2:
            self.ensure_same_day_pair()

    def ensure_same_day_pair(self) -> None:
        """Dam bao co mot khach dat 2 booking cung ngay voi 2 ky thuat vien khac nhau."""
        customer_id = self.customer_ids[0]
        for offset in (4, 6, 8, 11, 14, 18, 22, 27):
            day = SNAPSHOT + timedelta(days=offset)
            staff_pool = [sid for sid in self.bookable_staff_ids if self.staff_skills[sid]]
            if len(staff_pool) < 2:
                return
            first, second = self.rng.sample(staff_pool, 2)
            ok = True
            for account_id in (first, second):
                service_id = self.rng.choice(sorted(self.staff_skills[account_id]))
                duration = self.service_duration(service_id)
                start = self.find_slot(
                    account_id,
                    [day],
                    duration,
                    self.service_by_id[service_id]["preparation_buffer_minutes"],
                    self.service_by_id[service_id]["cleanup_buffer_minutes"],
                    customer_id,
                    SNAPSHOT + timedelta(hours=2),
                )
                if start is None:
                    ok = False
                    break
                placed.append(start)
                self.create_booking(
                    status="CONFIRMED",
                    account_id=account_id,
                    customer_id=customer_id,
                    services=[service_id],
                    durations=[duration],
                    start=start,
                    created=min(start - timedelta(days=3), SNAPSHOT - timedelta(hours=2)),
                    source="CUSTOMER",
                )
            if ok:
                return

    # ------------------------------------------------------------------ du lieu phu
    def customer_name(self, account_id: int) -> str:
        for row in self.tables["accounts"]:
            if row["id"] == str(account_id):
                return row["display_name"]
        raise KeyError(account_id)

    def customer_phone(self, account_id: int) -> str:
        for row in self.tables["customer_profiles"]:
            if row["account_id"] == str(account_id):
                return row["phone"]
        raise KeyError(account_id)

    def line_amount(self, service_id: int, duration: int) -> int:
        service = self.service_by_id[service_id]
        if not service["is_duration_adjustable"]:
            return service["base_price"]
        steps = (duration - service["minimum_duration_minutes"]) // service["duration_step_minutes"]
        return service["base_price"] + steps * service["price_per_duration_step"]

    def timed_events(self, status: str, start: datetime, end: datetime, created: datetime) -> dict[str, datetime]:
        if status == "COMPLETED":
            checked_in = start - timedelta(minutes=self.rng.randint(5, 20))
            started = max(checked_in + timedelta(minutes=1), start + timedelta(minutes=self.rng.randint(0, 8)))
            completed = min(started + timedelta(minutes=max((end - start).seconds // 60 - self.rng.randint(0, 6), 5)), SNAPSHOT - timedelta(minutes=5))
            return {"checked_in": checked_in, "started": started, "completed": completed}
        if status == "CHECKED_IN":
            return {"checked_in": min(start - timedelta(minutes=self.rng.randint(5, 20)), SNAPSHOT - timedelta(minutes=2))}
        if status == "IN_SERVICE":
            started = min(start + timedelta(minutes=self.rng.randint(2, 10)), SNAPSHOT - timedelta(minutes=1))
            return {
                "checked_in": min(start - timedelta(minutes=self.rng.randint(5, 20)), SNAPSHOT - timedelta(minutes=5)),
                "started": started,
            }
        return {}

    def build_payments(self) -> None:
        bookings = list(self.tables["bookings"])
        methods = list(PAYMENT_METHOD_WEIGHTS)
        weights = [PAYMENT_METHOD_WEIGHTS[method] for method in methods]
        first_confirmed_done = False
        for index, booking in enumerate(bookings, start=1):
            status = booking["status"]
            start = datetime.strptime(booking["booking_start"], "%Y-%m-%d %H:%M:%S")
            created = datetime.strptime(booking["created_at"], "%Y-%m-%d %H:%M:%S")
            method = self.rng.choices(methods, weights=weights)[0]
            if status == "CONFIRMED" and not first_confirmed_done:
                method = "AT_SPA"
                first_confirmed_done = True
            if status == "COMPLETED" and index % 90 == 0:
                status_payment = "REFUNDED"
            elif status in {"COMPLETED", "CHECKED_IN", "IN_SERVICE"}:
                status_payment = "UNPAID" if method == "AT_SPA" else "PAID"
            elif status == "CONFIRMED":
                status_payment = "UNPAID" if method == "AT_SPA" else "PAID"
            else:  # PENDING_PAYMENT
                if method == "AT_SPA":
                    status_payment = "UNPAID"
                elif method == "CARD" and self.rng.random() < 0.25:
                    status_payment = "FAILED"
                else:
                    status_payment = "UNPAID"

            paid_at = None
            refunded_at = None
            if status_payment in {"PAID", "REFUNDED"}:
                paid_at = created + timedelta(hours=self.rng.choice([0, 1, 3, 7, 20]), minutes=self.rng.randint(1, 55))
                if paid_at > SNAPSHOT - timedelta(minutes=10):
                    paid_at = SNAPSHOT - timedelta(minutes=self.rng.randint(30, 300))
                paid_at = max(paid_at, created)
            if status_payment == "REFUNDED":
                refunded_at = min(paid_at + timedelta(days=self.rng.randint(1, 6), hours=self.rng.randint(0, 8)), SNAPSHOT - timedelta(hours=1))
                if refunded_at <= paid_at:
                    paid_at = max(created, SNAPSHOT - timedelta(days=self.rng.randint(3, 9)))
                    refunded_at = min(paid_at + timedelta(days=1), SNAPSHOT - timedelta(hours=1))

            qr_payload = None
            if method == "QR":
                qr_payload = f"000201010212LUNARAPAY-{int(booking['id']):05d}{int(float(booking['total_amount']))}"

            self.add(
                "payments",
                {
                    "id": index,
                    "transaction_code": f"PAY-{start:%Y%m%d}-{index:05d}",
                    "booking_id": booking["id"],
                    "status": status_payment,
                    "method": method,
                    "amount": booking["total_amount"],
                    "qr_payload": qr_payload,
                    "paid_at": fmt(paid_at) if paid_at else None,
                    "refunded_at": fmt(refunded_at) if refunded_at else None,
                    "created_at": fmt(created + timedelta(minutes=2)),
                    "updated_at": fmt(max(created + timedelta(minutes=2), paid_at or created, refunded_at or created)),
                },
            )

        self.apply_timeline()
        self.apply_price_change_scenario()
        self.ensure_refund_with_bad_feedback()

    def apply_timeline(self) -> None:
        payments = {row["booking_id"]: row for row in self.tables["payments"]}
        for booking in self.tables["bookings"]:
            status = booking["status"]
            start = datetime.strptime(booking["booking_start"], "%Y-%m-%d %H:%M:%S")
            end = datetime.strptime(booking["booking_end"], "%Y-%m-%d %H:%M:%S")
            created = datetime.strptime(booking["created_at"], "%Y-%m-%d %H:%M:%S")
            marks = self.timed_events(status, start, end, created)
            payment = payments[booking["id"]]
            paid_at = datetime.strptime(payment["paid_at"], "%Y-%m-%d %H:%M:%S") if payment["paid_at"] != NULL else None
            checked_in = marks.get("checked_in")
            started = marks.get("started")
            completed = marks.get("completed")
            if paid_at and checked_in and paid_at > checked_in:
                paid_at = max(created, checked_in - timedelta(minutes=self.rng.randint(5, 60)))
            if started and checked_in and started <= checked_in:
                started = checked_in + timedelta(minutes=self.rng.randint(1, 10))
            if completed and started and completed <= started:
                completed = started + timedelta(minutes=15)
            if completed and completed > SNAPSHOT:
                completed = SNAPSHOT - timedelta(minutes=self.rng.randint(5, 60))
            if checked_in and checked_in > SNAPSHOT:
                checked_in = SNAPSHOT - timedelta(minutes=self.rng.randint(2, 30))
            booking["checked_in_at"] = fmt(checked_in) if checked_in else NULL
            booking["service_started_at"] = fmt(started) if started else NULL
            booking["completed_at"] = fmt(completed) if completed else NULL
            booking["updated_at"] = fmt(max([value for value in (created, paid_at, checked_in, started, completed) if value]))
            if payment["paid_at"] != NULL and paid_at:
                payment["paid_at"] = fmt(paid_at)
                if payment["refunded_at"] != NULL:
                    existing = datetime.strptime(payment["refunded_at"], "%Y-%m-%d %H:%M:%S")
                    refunded = max(paid_at + timedelta(hours=1), min(existing, SNAPSHOT - timedelta(minutes=30)))
                    payment["refunded_at"] = fmt(refunded)
                payment["updated_at"] = max(payment["paid_at"], payment["created_at"], payment["refunded_at"] if payment["refunded_at"] != NULL else payment["paid_at"])

    def apply_price_change_scenario(self) -> None:
        """Vai booking hoan thanh duoc ghi nhan voi gia cu thap hon gia hien tai."""
        candidates = [row for row in self.tables["bookings"] if row["status"] == "COMPLETED"]
        self.rng.shuffle(candidates)
        changed_services: set[str] = set()
        applied = 0
        for booking in candidates:
            if applied >= 2 or booking["id"] in changed_services:
                continue
            items = [row for row in self.tables["booking_items"] if row["booking_id"] == booking["id"]]
            if len(items) != 1 or items[0]["service_id"] in changed_services:
                continue
            item = items[0]
            service = self.service_by_id[int(item["service_id"])]
            old_base = int(service["base_price"] * 0.9)
            old_step = int((service["price_per_duration_step"] or 0) * 0.9)
            steps = int(item["additional_duration_steps"])
            item["base_price_snapshot"] = str(old_base)
            item["price_per_step_snapshot"] = str(old_step)
            item["line_amount"] = str(old_base + steps * old_step)
            booking["total_amount"] = item["line_amount"]
            for payment in self.tables["payments"]:
                if payment["booking_id"] == booking["id"]:
                    payment["amount"] = booking["total_amount"]
            created = datetime.strptime(booking["created_at"], "%Y-%m-%d %H:%M:%S")
            for service_row in self.tables["services"]:
                if service_row["id"] == item["service_id"]:
                    service_row["updated_at"] = fmt(min(created + timedelta(days=1), SNAPSHOT - timedelta(days=1)))
            changed_services.add(item["service_id"])
            applied += 1

    def ensure_refund_with_bad_feedback(self) -> None:
        completed_ids = {row["id"] for row in self.tables["bookings"] if row["status"] == "COMPLETED"}
        refunded = [row for row in self.tables["payments"] if row["status"] == "REFUNDED"]
        if not refunded:
            candidates = [
                row for row in self.tables["payments"] if row["status"] == "PAID" and row["booking_id"] in completed_ids
            ]
            if not candidates:
                return
            payment = self.rng.choice(candidates)
            booking = next(row for row in self.tables["bookings"] if row["id"] == payment["booking_id"])
            payment["status"] = "REFUNDED"
            paid = datetime.strptime(payment["paid_at"], "%Y-%m-%d %H:%M:%S")
            refunded_at = min(paid + timedelta(days=2), SNAPSHOT - timedelta(hours=1))
            payment["refunded_at"] = fmt(refunded_at)
            payment["updated_at"] = fmt(refunded_at)
            refunded.append(payment)
            self.bad_feedback_bookings = {booking["id"]}
        else:
            self.bad_feedback_bookings = {row["booking_id"] for row in refunded}

    def build_feedback(self) -> None:
        completed = [row for row in self.tables["bookings"] if row["status"] == "COMPLETED"]
        ratings = list(POSITIVE_RATING_WEIGHTS)
        weights = [POSITIVE_RATING_WEIGHTS[rating] for rating in ratings]
        pools: dict[int, list[str]] = {rating: [] for rating in ratings}
        last_used: dict[int, str | None] = {rating: None for rating in ratings}
        feedback_id = 1
        bad = set(getattr(self, "bad_feedback_bookings", set()))
        for booking in completed:
            is_bad = booking["id"] in bad
            if not is_bad and self.rng.random() > self.profile["feedback_ratio"]:
                continue
            rating = self.rng.choice([1, 2]) if is_bad else self.rng.choices(ratings, weights=weights)[0]
            if not pools[rating]:
                pool = list(FEEDBACK_COMMENTS[rating])
                self.rng.shuffle(pool)
                if pool and pool[0] == last_used[rating]:
                    pool.append(pool.pop(0))
                pools[rating] = pool
            comment = pools[rating].pop(0)
            last_used[rating] = comment
            completed_at = datetime.strptime(booking["completed_at"], "%Y-%m-%d %H:%M:%S")
            created = completed_at + timedelta(hours=self.rng.randint(2, 40))
            if created > SNAPSHOT:
                created = SNAPSHOT - timedelta(hours=self.rng.randint(1, 12))
            updated = min(created + timedelta(hours=self.rng.randint(1, 60)), SNAPSHOT)
            self.add(
                "feedback",
                {
                    "id": feedback_id,
                    "booking_id": booking["id"],
                    "rating": rating,
                    "comment": comment,
                    "created_at": fmt(created),
                    "updated_at": fmt(updated),
                },
            )
            feedback_id += 1

    def build_booking_events(self) -> None:
        payments = {row["booking_id"]: row for row in self.tables["payments"]}
        events: list[tuple[datetime, int, int, str, str | None, str]] = []
        reschedule_targets = [
            row for row in self.tables["bookings"] if row["status"] in {"COMPLETED", "CONFIRMED"}
        ][:0]  # chon co chu dich ben duoi
        confirmed = [
            row
            for row in self.tables["bookings"]
            if row["status"] == "CONFIRMED"
            and datetime.strptime(row["created_at"], "%Y-%m-%d %H:%M:%S") <= SNAPSHOT - timedelta(days=2)
        ]
        reschedule_targets = confirmed[:2] if len(confirmed) >= 2 else []
        rescheduled_ids = {str(row["id"]) for row in reschedule_targets}

        for booking in self.tables["bookings"]:
            booking_id = int(booking["id"])
            created = datetime.strptime(booking["created_at"], "%Y-%m-%d %H:%M:%S")
            created_by = booking["created_by_account_id"]
            events.append((created, booking_id, 0, "CREATED", created_by, f"Booking {booking['booking_code']} được tạo."))
            if booking["staff_account_id"] != NULL:
                events.append(
                    (
                        created + timedelta(minutes=5),
                        booking_id,
                        1,
                        "STAFF_ASSIGNED",
                        created_by if self.rng.random() < 0.6 else None,
                        f"Đã phân công kỹ thuật viên #{booking['staff_account_id']}.",
                    )
                )
            if self.rng.random() < 0.4:
                events.append(
                    (created + timedelta(minutes=10), booking_id, 2, "EMAIL_SENT", None, "Đã gửi email xác nhận booking.")
                )
            if str(booking_id) in rescheduled_ids:
                moved = created + timedelta(days=self.rng.randint(1, 3), hours=self.rng.randint(1, 6))
                if moved > SNAPSHOT:
                    moved = SNAPSHOT - timedelta(hours=self.rng.randint(1, 12))
                events.append(
                    (
                        moved,
                        booking_id,
                        3,
                        "RESCHEDULED",
                        booking["created_by_account_id"],
                        f"Đổi lịch sang {booking['booking_start']}.",
                    )
                )

            payment = payments.get(booking["id"])
            if payment and payment["status"] in {"PAID", "REFUNDED"}:
                events.append(
                    (
                        datetime.strptime(payment["paid_at"], "%Y-%m-%d %H:%M:%S"),
                        booking_id,
                        4,
                        "PAYMENT_RECEIVED",
                        None,
                        f"Thanh toán {payment['transaction_code']} thành công.",
                    )
                )
            if booking["checked_in_at"] != NULL:
                events.append(
                    (
                        datetime.strptime(booking["checked_in_at"], "%Y-%m-%d %H:%M:%S"),
                        booking_id,
                        5,
                        "CHECKED_IN",
                        self.rng.choice(self.receptionist_ids),
                        "Khách đã check-in tại spa.",
                    )
                )
            if booking["service_started_at"] != NULL:
                events.append(
                    (
                        datetime.strptime(booking["service_started_at"], "%Y-%m-%d %H:%M:%S"),
                        booking_id,
                        6,
                        "SERVICE_STARTED",
                        booking["staff_account_id"],
                        "Kỹ thuật viên bắt đầu thực hiện dịch vụ.",
                    )
                )
            if booking["completed_at"] != NULL:
                events.append(
                    (
                        datetime.strptime(booking["completed_at"], "%Y-%m-%d %H:%M:%S"),
                        booking_id,
                        7,
                        "COMPLETED",
                        booking["staff_account_id"],
                        "Booking đã hoàn thành.",
                    )
                )

        events.sort(key=lambda item: (item[0], item[1], item[2]))
        for index, (occurred, booking_id, _, event_type, actor, message) in enumerate(events, start=1):
            self.add(
                "booking_events",
                {
                    "id": index,
                    "booking_id": booking_id,
                    "event_type": event_type,
                    "actor_account_id": actor,
                    "message": message,
                    "occurred_at": fmt(occurred),
                },
            )

    last_note: str | None = None

    # ------------------------------------------------------------------ xuat file
    def write(self) -> None:
        self.out_dir.mkdir(parents=True, exist_ok=True)
        for table in TABLES:
            rows = self.tables[table]
            path = self.out_dir / f"{table}.csv"
            with path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()), lineterminator="\r\n")
                writer.writeheader()
                writer.writerows(rows)
        self.write_summary()

    def write_summary(self) -> None:
        summary: dict = {"dataset": self.dataset, "snapshot": fmt(SNAPSHOT), "row_counts": {}, "checksums": {}}
        for table in TABLES:
            path = self.out_dir / f"{table}.csv"
            summary["row_counts"][table] = len(self.tables[table])
            summary["checksums"][table] = hashlib.sha256(path.read_bytes()).hexdigest()
        summary["booking_status_counts"] = dict(sorted(count_values(self.tables["bookings"], "status").items()))
        summary["payment_status_counts"] = dict(sorted(count_values(self.tables["payments"], "status").items()))
        summary["payment_method_counts"] = dict(sorted(count_values(self.tables["payments"], "method").items()))
        summary["feedback_rating_counts"] = dict(sorted(count_values(self.tables["feedback"], "rating").items(), key=lambda item: int(item[0])))
        summary["assignment_source_counts"] = dict(sorted(count_values(self.tables["bookings"], "assignment_source").items()))
        path = self.out_dir / "VALIDATION_SUMMARY.json"
        path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def max_datetime(value: str, days: int) -> str:
    parsed = datetime.strptime(value, "%Y-%m-%d %H:%M:%S") + timedelta(days=days)
    return fmt(min(parsed, SNAPSHOT))


def count_values(rows: list[dict[str, str]], key: str) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for row in rows:
        counts[row[key]] += 1
    return dict(counts)


def main() -> int:
    parser = argparse.ArgumentParser(description="Sinh dataset mock v1")
    parser.add_argument("--dataset", required=True, choices=sorted(PROFILES))
    parser.add_argument("--out-dir", default=None, help="Mac dinh database/v1/<Dataset>")
    parser.add_argument("--no-check", action="store_true", help="Bo qua buoc tu kiem sau khi sinh")
    args = parser.parse_args()

    out_dir = Path(args.out_dir) if args.out_dir else V1_DIR / args.dataset
    generator = Generator(args.dataset, out_dir)
    generator.build_static_tables()
    generator.build_services()
    generator.build_accounts()
    generator.build_customer_profiles()
    generator.build_staff_profiles()
    generator.build_working_hours()
    generator.build_time_off()
    generator.build_bookings()
    generator.build_payments()
    generator.build_feedback()
    generator.build_booking_events()
    generator.write()

    print(f"Da sinh {args.dataset} vao {out_dir}")
    for table in TABLES:
        print(f"  {table:<22}{len(generator.tables[table]):>6} dong")

    if args.no_check:
        return 0

    from check_dataset import CHECKS, load

    dataset = load(out_dir)
    for check in CHECKS:
        check(dataset)
    if dataset.problems:
        print(f"\nCANH BAO: {len(dataset.problems)} vi pham sau khi sinh")
        for problem in dataset.problems[:20]:
            print(f"  [{problem.rule}] {problem.detail}")
        return 1
    print("\nTu kiem: 0 vi pham")
    return 0


if __name__ == "__main__":
    sys.exit(main())

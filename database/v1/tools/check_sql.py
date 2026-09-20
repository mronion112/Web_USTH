"""Nạp dataset v1 vào mot schema tam va kiem tra o tang database.

    python3 database/v1/tools/check_sql.py --dataset Testing
    python3 database/v1/tools/check_sql.py --dataset Production --keep

Viec kiem tra gom:
- nap DDL that (database/Web_DataBase_USTH.sql) vao schema tam, KHONG dung vao lunara_spa;
- LOAD DATA LOCAL INFILE dung dinh dang ma Makefile dang dung, voi FOREIGN_KEY_CHECKS=1
  (khoa ngoai sai se lam lenh nap that bai ngay);
- chay cac truy van bat bien o tang SQL;
- xoa schema tam sau khi xong (tru khi --keep).

Khi can nap v1 vao DB dang chay (thay vi --keep de xac nhan):
    python3 database/v1/tools/check_sql.py --dataset Production --schema lunara_spa --keep
Lenh nay DROP lunara_spa roi nap lai tu CSV v1.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
V1_DIR = TOOLS_DIR.parent
DB_DIR = V1_DIR.parent
ROOT = DB_DIR.parent
DDL = DB_DIR / "Web_DataBase_USTH.sql"
IMPORT_ORDER = DB_DIR / "IMPORT_ORDER.txt"
ENV_FILE = ROOT / "templates" / ".env"
TEMP_SCHEMA = "lunara_spa_v1_check"

SNAPSHOT = "2026-09-15 15:00:00"


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            key, _, value = line.partition("=")
            values[key.strip()] = value.strip()
    return values


def mysql(args: list[str], env: dict[str, str], *, input_sql: str | None = None, local_infile: bool = False, check: bool = True):
    command = ["mysql", "-h", "127.0.0.1", "-P", env["DB_PORT"], "-u", "root"]
    if local_infile or input_sql is not None and "LOAD DATA" in (input_sql or ""):
        command.append("--local-infile=1")
    result = subprocess.run(
        command + args,
        input=input_sql,
        text=True,
        capture_output=True,
        env={"MYSQL_PWD": env["MYSQL_ROOT_PASSWORD"], "PATH": "/opt/homebrew/bin:/usr/bin:/bin"},
    )
    if check and result.returncode != 0:
        print(result.stderr.strip()[:2000], file=sys.stderr)
        raise SystemExit(f"lenh mysql that bai: {' '.join(args)}")
    return result.stdout


CHECKS: list[tuple[str, str]] = [
    (
        "II3 tong tien/thoi luong cua items khong khop booking",
        f"""
        SELECT CONCAT('booking ', b.id) FROM bookings b
        JOIN (SELECT booking_id, SUM(line_amount) amount, SUM(duration_minutes) duration
              FROM booking_items GROUP BY booking_id) i ON i.booking_id = b.id
        WHERE ABS(b.total_amount - i.amount) > 0.005 OR b.total_duration_minutes <> i.duration
        """,
    ),
    (
        "II2 line_amount sai cong thuc",
        """
        SELECT CONCAT('item ', id) FROM booking_items
        WHERE ABS(line_amount - (base_price_snapshot + additional_duration_steps * price_per_step_snapshot)) > 0.005
        """,
    ),
    (
        "II4 booking_end khong bang start + total_duration",
        """
        SELECT CONCAT('booking ', id) FROM bookings
        WHERE booking_end <> DATE_ADD(booking_start, INTERVAL total_duration_minutes MINUTE)
        """,
    ),
    (
        "III9 AT_SPA bi danh dau FAILED hoac QR thieu payload",
        """
        SELECT CONCAT('payment ', id) FROM payments
        WHERE (method = 'AT_SPA' AND status = 'FAILED')
           OR (method = 'QR' AND qr_payload IS NULL)
           OR (method IN ('CARD', 'AT_SPA') AND qr_payload IS NOT NULL)
        """,
    ),
    (
        "III3/III4 trang thai booking khong khop trang thai thanh toan",
        f"""
        SELECT CONCAT('booking ', b.id, ' status=', b.status, ' payment=', p.status) FROM bookings b
        JOIN payments p ON p.booking_id = b.id
        WHERE (b.status = 'PENDING_PAYMENT' AND p.status NOT IN ('UNPAID', 'FAILED'))
           OR (b.status = 'CONFIRMED' AND p.status <> 'PAID'
               AND NOT (p.method = 'AT_SPA' AND p.status = 'UNPAID' AND b.booking_start >= '{SNAPSHOT}'))
        """,
    ),
    (
        "III5/III6/III7 moc thoi gian khong khop trang thai",
        """
        SELECT CONCAT('booking ', id) FROM bookings
        WHERE (status = 'COMPLETED' AND completed_at IS NULL)
           OR (status = 'CHECKED_IN' AND (checked_in_at IS NULL OR service_started_at IS NOT NULL))
           OR (status = 'IN_SERVICE' AND (service_started_at IS NULL OR completed_at IS NOT NULL))
           OR (status = 'PENDING_PAYMENT' AND checked_in_at IS NOT NULL)
        """,
    ),
    (
        "III2 thu tu moc thoi gian sai",
        """
        SELECT CONCAT('booking ', b.id) FROM bookings b
        LEFT JOIN payments p ON p.booking_id = b.id
        WHERE (p.paid_at IS NOT NULL AND p.paid_at < b.created_at)
           OR (p.paid_at IS NOT NULL AND b.checked_in_at IS NOT NULL AND p.paid_at > b.checked_in_at)
           OR (b.checked_in_at IS NOT NULL AND b.checked_in_at < b.created_at)
           OR (b.service_started_at IS NOT NULL AND b.checked_in_at IS NOT NULL AND b.service_started_at < b.checked_in_at)
           OR (b.completed_at IS NOT NULL AND b.service_started_at IS NOT NULL AND b.completed_at < b.service_started_at)
        """,
    ),
    (
        "VI1 moc thoi gian sau snapshot",
        f"""
        SELECT CONCAT('bookings ', id) FROM bookings WHERE created_at > '{SNAPSHOT}' OR updated_at > '{SNAPSHOT}'
        UNION ALL SELECT CONCAT('payments ', id) FROM payments WHERE created_at > '{SNAPSHOT}' OR updated_at > '{SNAPSHOT}'
        UNION ALL SELECT CONCAT('feedback ', id) FROM feedback WHERE created_at > '{SNAPSHOT}' OR updated_at > '{SNAPSHOT}'
        UNION ALL SELECT CONCAT('booking_events ', id) FROM booking_events WHERE occurred_at > '{SNAPSHOT}'
        UNION ALL SELECT CONCAT('accounts ', id) FROM accounts WHERE created_at > '{SNAPSHOT}' OR updated_at > '{SNAPSHOT}'
        """,
    ),
    (
        "VI2 updated_at truoc created_at",
        """
        SELECT CONCAT('bookings ', id) FROM bookings WHERE updated_at < created_at
        UNION ALL SELECT CONCAT('payments ', id) FROM payments WHERE updated_at < created_at
        UNION ALL SELECT CONCAT('feedback ', id) FROM feedback WHERE updated_at < created_at
        UNION ALL SELECT CONCAT('accounts ', id) FROM accounts WHERE updated_at < created_at
        """,
    ),
    (
        "IV5 ky thuat vien thieu ky nang cho dich vu trong booking",
        """
        SELECT CONCAT('booking ', b.id, ' thieu skill cho service ', bi.service_id)
        FROM booking_items bi
        JOIN bookings b ON b.id = bi.booking_id
        WHERE b.staff_account_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM staff_services ss
                          WHERE ss.staff_account_id = b.staff_account_id AND ss.service_id = bi.service_id)
        """,
    ),
    (
        "IV3 hai booking cung ky thuat vien giao nhau (ke ca buffer)",
        """
        SELECT CONCAT('booking ', a.id, ' giao booking ', b.id)
        FROM bookings a
        JOIN bookings b ON b.staff_account_id = a.staff_account_id AND b.id > a.id
        WHERE a.booking_start < b.booking_end AND a.booking_end > b.booking_start
        """,
    ),
    (
        "IV4 mot khach co hai booking giao nhau",
        """
        SELECT CONCAT('booking ', a.id, ' giao booking ', b.id)
        FROM bookings a
        JOIN bookings b ON b.customer_account_id = a.customer_account_id AND b.id > a.id
        WHERE a.booking_start < b.booking_end AND a.booking_end > b.booking_start
        """,
    ),
    (
        "VII2 booking thieu event CREATED",
        """
        SELECT CONCAT('booking ', b.id) FROM bookings b
        WHERE NOT EXISTS (SELECT 1 FROM booking_events e WHERE e.booking_id = b.id AND e.event_type = 'CREATED')
        """,
    ),
]


def main() -> int:
    parser = argparse.ArgumentParser(description="Kiem tra dataset v1 o tang SQL")
    parser.add_argument("--dataset", required=True, choices=["Production", "Testing"])
    parser.add_argument("--keep", action="store_true", help="Giu lai schema tam de soi tay")
    parser.add_argument("--schema", default=TEMP_SCHEMA)
    args = parser.parse_args()

    if args.schema == "lunara_spa" and not args.keep:
        print(
            "Tu choi: --schema lunara_spa se DROP va nap lai database dang chay.\n"
            "Neu thuc su muon, them --keep de xac nhan.",
            file=sys.stderr,
        )
        return 2

    env = load_env()
    for key in ("DB_PORT", "MYSQL_ROOT_PASSWORD"):
        if key not in env:
            print(f"Thieu {key} trong {ENV_FILE}", file=sys.stderr)
            return 2

    dataset_dir = V1_DIR / args.dataset
    if not dataset_dir.is_dir():
        print(f"Chua co dataset: {dataset_dir}. Chay generate_dataset.py truoc.", file=sys.stderr)
        return 2

    schema = args.schema
    print(f"Schema tam: {schema}")

    ddl = DDL.read_text(encoding="utf-8")
    ddl = re.sub(r"\blunara_spa\b", schema, ddl)
    mysql([], env, input_sql=ddl)
    mysql(["-e", "SET GLOBAL local_infile = 1;"], env)

    order = [
        line.split(". ", 1)[1].removesuffix(".csv")
        for line in IMPORT_ORDER.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    for table in order:
        path = (dataset_dir / f"{table}.csv").resolve()
        statement = (
            f"LOAD DATA LOCAL INFILE '{path}' INTO TABLE `{table}` "
            "FIELDS TERMINATED BY ',' ENCLOSED BY '\"' "
            "LINES TERMINATED BY '\\r\\n' IGNORE 1 LINES;"
        )
        mysql([schema, "-e", statement], env, local_infile=True)
        count = mysql(["-N", "-e", f"SELECT COUNT(*) FROM `{schema}`.`{table}`;"], env).strip()
        print(f"  {table:<22}{count:>7} dong")

    print("\nKiem tra bat bien o tang SQL:")
    violations = 0
    for rule, query in CHECKS:
        output = mysql([schema, "-N", "-e", query], env).strip()
        rows = [line for line in output.splitlines() if line.strip()]
        if rows:
            violations += len(rows)
            print(f"  [FAIL] {rule}: {len(rows)} dong")
            for row in rows[:5]:
                print(f"         {row}")
        else:
            print(f"  [ OK ] {rule}")

    if not args.keep:
        mysql(["-e", f"DROP DATABASE IF EXISTS `{schema}`;"], env)
        print(f"\nDa xoa schema tam {schema}")

    print(f"\nKet qua: {'0 vi pham' if violations == 0 else f'{violations} vi pham'}")
    return 0 if violations == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

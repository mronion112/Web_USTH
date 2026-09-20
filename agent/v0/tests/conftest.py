"""Fixture dung chung cho test: settings toi thieu + corpus tam."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.config import Settings

CORPUS = {
    "public/booking-policy.md": """---
doc_id: booking-policy
title: Chinh sach dat lich Lunara
audience: PUBLIC
locale: vi-VN
version: 0.1
status: draft
effective_from: null
approved_by: null
source_url: internal://lunara/policy/booking-policy
---
# Chinh sach dat lich

## 1. Thoi gian huy lich
Khach huy truoc 6 gio thi mien phi.

## 2. Dat coc
Booking PENDING_PAYMENT phai thanh toan de chuyen sang CONFIRMED.
""",
    "public/faq.md": """---
doc_id: faq
title: FAQ Lunara
audience: PUBLIC
version: 0.1
status: approved
approved_by: product-owner
source_url: internal://lunara/public/faq
---
# FAQ

## 1. Gio mo cua
Lunara mo cua tu 09:00 den 21:00.
""",
    "staff/service-sop.md": """---
doc_id: service-sop
title: SOP thuc hien dich vu
audience: STAFF
version: 0.1
status: draft
source_url: internal://lunara/staff/service-sop
---
# SOP

## 1. Chuan bi phong
Chuan bi phong truoc 10 phut theo preparation buffer.
""",
    "management/reporting-kpi.md": """---
doc_id: reporting-kpi
title: KPI van hanh
audience: MANAGEMENT
version: 0.1
status: draft
source_url: internal://lunara/management/reporting-kpi
---
# KPI

## 1. Chi so theo doi
Theo doi ty le lap day lich va doanh thu da thu.
""",
}


def write_corpus(root: Path, documents: dict[str, str] | None = None) -> Path:
    for relative, content in (documents or CORPUS).items():
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    return root


@pytest.fixture
def knowledge_dir(tmp_path: Path) -> Path:
    return write_corpus(tmp_path / "knowledge")


def make_settings(**overrides) -> Settings:
    base = {
        "llm_api_key": "test-key",
        "llm_model": "test-model",
        "backend_base_url": "http://backend.test",
        "typesafe_enabled": False,
        "typesafe_api_key": "",
        "knowledge_include_draft": True,
    }
    base.update(overrides)
    return Settings(**base)

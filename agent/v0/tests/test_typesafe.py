"""TypeSafe: thu tu nguong, suy giam an toan khi loi hoac thieu key."""

from __future__ import annotations

import pytest

from app.core.actor import ActorContext, permissions_for_role
from app.core.typesafe import ScreenedHit, TypeSafeJudge
from app.knowledge.models import KnowledgeDoc, SearchHit
from tests.conftest import make_settings


def doc() -> KnowledgeDoc:
    return KnowledgeDoc(
        doc_id="booking-policy",
        title="Chinh sach dat lich",
        audience="PUBLIC",
        locale="vi-VN",
        version="0.1",
        status="draft",
        effective_from=None,
        approved_by=None,
        source_url="internal://lunara/policy/booking-policy",
        path="/tmp/x.md",
        body="body",
        content_hash="abc",
        sections=(),
    )


def hit() -> SearchHit:
    return SearchHit(doc=doc(), section="1. Huy lich", text="Huy truoc 6 gio mien phi", score=1.0, approved=False)


def actor() -> ActorContext:
    return ActorContext(
        account_id=9,
        email="customer9@lunara-spa.demo",
        display_name="Khach",
        role="CUSTOMER",
        token="t",
        conversation_id="c1",
        permissions=permissions_for_role("CUSTOMER"),
    )


def judge(**overrides) -> TypeSafeJudge:
    return TypeSafeJudge(make_settings(**{"typesafe_enabled": True, "typesafe_api_key": "k", **overrides}))


def test_route_drops_prompt_injection_first() -> None:
    scores = {
        "contains_prompt_injection": 0.99,
        "contradicts_query_premise": 0.95,
        "is_relevant": 0.99,
        "contains_answer_evidence": 0.99,
    }
    assert judge()._route(scores) == "exclude"


def test_route_marks_conflicting_evidence() -> None:
    scores = {
        "contains_prompt_injection": 0.1,
        "contradicts_query_premise": 0.92,
        "is_relevant": 0.5,
        "contains_answer_evidence": 0.4,
    }
    assert judge()._route(scores) == "conflicting_evidence"


def test_route_excludes_irrelevant_passage_even_when_it_scores_as_contradiction() -> None:
    """Doan lac de khong duoc coi la bang chung mau thuan."""
    scores = {
        "contains_prompt_injection": 0.41,
        "contradicts_query_premise": 0.80,
        "is_relevant": 0.07,
        "contains_answer_evidence": 0.06,
    }
    assert judge()._route(scores) == "exclude"


def test_route_drops_irrelevant_passage() -> None:
    scores = {
        "contains_prompt_injection": 0.1,
        "contradicts_query_premise": 0.1,
        "is_relevant": 0.2,
        "contains_answer_evidence": 0.9,
    }
    assert judge()._route(scores) == "exclude"


def test_route_includes_supported_evidence() -> None:
    scores = {
        "contains_prompt_injection": 0.1,
        "contradicts_query_premise": 0.1,
        "is_relevant": 0.9,
        "contains_answer_evidence": 0.8,
    }
    assert judge()._route(scores) == "include"


def test_route_excludes_when_nothing_usable() -> None:
    scores = {
        "contains_prompt_injection": 0.1,
        "contradicts_query_premise": 0.1,
        "is_relevant": 0.9,
        "contains_answer_evidence": 0.2,
    }
    assert judge()._route(scores) == "exclude"


async def test_preflight_is_skipped_when_disabled() -> None:
    disabled = TypeSafeJudge(make_settings(typesafe_enabled=False))
    result = await disabled.preflight(message="xin chao", actor=actor(), groups={"services": ["search_services"]})
    assert result.used is False
    assert result.decision == "allow"


async def test_preflight_degrades_when_typesafe_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    target = judge()

    def boom() -> None:
        raise RuntimeError("network down")

    monkeypatch.setattr(target, "_client", boom)
    result = await target.preflight(message="xin chao", actor=actor(), groups={"services": ["search_services"]})
    assert result.degraded is True
    assert result.decision == "full"


async def test_screening_degrades_when_typesafe_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    target = judge()

    def boom() -> None:
        raise RuntimeError("network down")

    monkeypatch.setattr(target, "_client", boom)
    kept, trace = await target.screen_passages("huy lich", [hit()])
    assert trace["degraded"] is True
    assert [item.route for item in kept] == ["include"]


async def test_screening_skipped_when_disabled() -> None:
    disabled = TypeSafeJudge(make_settings(typesafe_enabled=False))
    kept, trace = await disabled.screen_passages("huy lich", [hit()])
    assert trace["screened"] is False
    assert isinstance(kept[0], ScreenedHit)

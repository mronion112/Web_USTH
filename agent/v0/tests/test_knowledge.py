"""Knowledge: loc audience, bo qua draft khi duoc yeu cau, search tieng Viet co dau."""

from __future__ import annotations

from pathlib import Path

from app.knowledge.search import KnowledgeIndex, normalize, tokenize
from tests.conftest import write_corpus


def index(knowledge_dir: Path, *, include_draft: bool = True) -> KnowledgeIndex:
    return KnowledgeIndex.from_path(knowledge_dir, include_draft=include_draft)


def test_normalize_strips_vietnamese_diacritics() -> None:
    assert normalize("Dịch vụ Massage đá nóng") == "dich vu massage da nong"
    assert "dich" in tokenize("Dịch vụ")


def test_customer_never_sees_staff_or_management_documents(knowledge_dir: Path) -> None:
    hits = index(knowledge_dir).search("chuan bi phong", {"PUBLIC"}, limit=5)
    assert hits == []


def test_staff_can_see_staff_documents(knowledge_dir: Path) -> None:
    hits = index(knowledge_dir).search("chuan bi phong", {"PUBLIC", "STAFF"}, limit=5)
    assert [hit.doc.doc_id for hit in hits] == ["service-sop"]


def test_management_only_for_management_audience(knowledge_dir: Path) -> None:
    assert index(knowledge_dir).search("doanh thu da thu", {"PUBLIC", "STAFF"}) == []
    hits = index(knowledge_dir).search("doanh thu da thu", {"PUBLIC", "STAFF", "MANAGEMENT"})
    assert [hit.doc.doc_id for hit in hits] == ["reporting-kpi"]


def test_diacritic_insensitive_search_finds_policy(knowledge_dir: Path) -> None:
    hits = index(knowledge_dir).search("huy lich truoc 6 gio", {"PUBLIC"})
    assert hits and hits[0].doc.doc_id == "booking-policy"


def test_draft_can_be_excluded(knowledge_dir: Path) -> None:
    with_draft = index(knowledge_dir, include_draft=True)
    without_draft = index(knowledge_dir, include_draft=False)
    assert any(document.doc_id == "booking-policy" for document in with_draft.documents)
    assert not any(document.doc_id == "booking-policy" for document in without_draft.documents)
    assert any(document.doc_id == "faq" for document in without_draft.documents)


def test_approved_flag_comes_from_frontmatter(knowledge_dir: Path) -> None:
    documents = {document.doc_id: document for document in index(knowledge_dir).documents}
    assert documents["faq"].approved is True
    assert documents["booking-policy"].approved is False
    assert documents["booking-policy"].content_hash


def test_no_hits_for_unrelated_query(knowledge_dir: Path) -> None:
    assert index(knowledge_dir).search("xyz khong lien quan", {"PUBLIC"}) == []


def test_readme_at_corpus_root_is_ignored(tmp_path: Path) -> None:
    root = write_corpus(tmp_path / "knowledge")
    (root / "README.md").write_text("# ghi chu corpus", encoding="utf-8")
    assert all(document.doc_id != "README" for document in KnowledgeIndex.from_path(root).documents)

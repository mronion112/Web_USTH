"""Model cho knowledge corpus."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class KnowledgeSection:
    heading: str
    text: str


@dataclass(frozen=True)
class KnowledgeDoc:
    doc_id: str
    title: str
    audience: str
    locale: str
    version: str
    status: str
    effective_from: str | None
    approved_by: str | None
    source_url: str
    path: str
    body: str
    content_hash: str
    sections: tuple[KnowledgeSection, ...] = field(default_factory=tuple)

    @property
    def approved(self) -> bool:
        return self.status.lower() == "approved"

    def citation(self) -> dict:
        return {
            "docId": self.doc_id,
            "title": self.title,
            "audience": self.audience,
            "version": self.version,
            "approved": self.approved,
            "sourceUrl": self.source_url,
        }


@dataclass(frozen=True)
class SearchHit:
    doc: KnowledgeDoc
    section: str
    text: str
    score: float
    approved: bool

    def as_dict(self) -> dict:
        return {
            "docId": self.doc.doc_id,
            "title": self.doc.title,
            "section": self.section,
            "text": self.text,
            "audience": self.doc.audience,
            "version": self.doc.version,
            "approved": self.approved,
            "sourceUrl": self.doc.source_url,
            "score": round(self.score, 4),
        }

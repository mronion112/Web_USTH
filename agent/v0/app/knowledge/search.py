"""Full-text search tieng Viet (chua dung vector DB, theo agent/NOTE.md muc 11).

Chuan hoa dau, tach tu, cham diem theo tan suat + IDF tren tung section.
Audience duoc loc TRUOC khi search de khong bao gio lo noi dung STAFF/MANAGEMENT.
"""

from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from pathlib import Path

from app.knowledge.loader import load_documents
from app.knowledge.models import KnowledgeDoc, SearchHit

_WORD_RE = re.compile(r"[a-z0-9]+")

_STOPWORDS = frozenset(
    {
        "la", "cua", "va", "co", "khong", "toi", "cho", "gi", "the", "nao", "thi", "mot", "cac",
        "nhung", "duoc", "voi", "khi", "hay", "nhu", "tai", "trong", "ra", "vao", "den", "tu",
        "ban", "minh", "nay", "do", "bang", "ve", "de", "hoac", "ma", "nen", "se", "da", "dang",
    }
)


def normalize(text: str) -> str:
    """Bo dau tieng Viet: 'Dịch vụ' -> 'dich vu'."""
    lowered = text.lower().replace("đ", "d")
    decomposed = unicodedata.normalize("NFD", lowered)
    without_marks = "".join(char for char in decomposed if unicodedata.category(char) != "Mn")
    return without_marks


def tokenize(text: str) -> list[str]:
    return [token for token in _WORD_RE.findall(normalize(text)) if len(token) > 1 and token not in _STOPWORDS]


class KnowledgeIndex:
    def __init__(self, documents: list[KnowledgeDoc]):
        self._documents = documents
        self._doc_freq: Counter[str] = Counter()
        self._vocabulary: set[str] = set()
        for document in documents:
            tokens = set(tokenize(f"{document.title} {document.body}"))
            self._vocabulary |= tokens
            self._doc_freq.update(tokens)

    @classmethod
    def from_path(cls, root: Path, *, include_draft: bool = True) -> KnowledgeIndex:
        return cls(load_documents(root, include_draft=include_draft))

    @property
    def documents(self) -> list[KnowledgeDoc]:
        return list(self._documents)

    def _idf(self, token: str) -> float:
        total = max(len(self._documents), 1)
        return math.log((total + 1) / (self._doc_freq.get(token, 0) + 1)) + 1.0

    def search(self, query: str, audiences: frozenset[str] | set[str], limit: int = 5) -> list[SearchHit]:
        terms = [term for term in tokenize(query) if term in self._vocabulary]
        if not terms:
            return []

        hits: list[SearchHit] = []
        for document in self._documents:
            if document.audience.upper() not in {audience.upper() for audience in audiences}:
                continue

            title_tokens = set(tokenize(document.title))
            subject_tokens = set(tokenize(document.doc_id.replace("-", " ")))
            best: SearchHit | None = None

            for section in document.sections:
                section_tokens = set(tokenize(f"{section.heading} {section.text}"))
                score = 0.0
                for term in terms:
                    weight = self._idf(term)
                    if term in section_tokens or term in title_tokens:
                        score += weight * 2.0
                    if term in subject_tokens:
                        score += weight * 0.5
                if score > 0 and (best is None or score > best.score):
                    best = SearchHit(
                        doc=document,
                        section=section.heading or document.title,
                        text=section.text,
                        score=score,
                        approved=document.approved,
                    )

            if best is not None:
                hits.append(best)

        hits.sort(key=lambda hit: (-hit.score, hit.doc.doc_id, hit.section))
        return hits[:limit]

    def by_audience(self, audiences: frozenset[str] | set[str]) -> list[KnowledgeDoc]:
        allowed = {audience.upper() for audience in audiences}
        return [document for document in self._documents if document.audience.upper() in allowed]

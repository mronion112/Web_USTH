"""Doc corpus markdown: parse frontmatter don gian, tach section, tinh content hash."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path

from app.knowledge.models import KnowledgeDoc, KnowledgeSection

logger = logging.getLogger(__name__)

_AUDIENCE_BY_DIR = {"public": "PUBLIC", "staff": "STAFF", "management": "MANAGEMENT"}


def _parse_frontmatter(raw: str) -> tuple[dict[str, str | None], str]:
    if not raw.startswith("---"):
        return {}, raw
    parts = raw.split("\n")
    end = None
    for index in range(1, len(parts)):
        if parts[index].strip() == "---":
            end = index
            break
    if end is None:
        return {}, raw

    meta: dict[str, str | None] = {}
    for line in parts[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        value = value.strip().strip("'\"")
        meta[key.strip()] = None if value in ("", "null", "~") else value
    body = "\n".join(parts[end + 1 :]).lstrip("\n")
    return meta, body


def _split_sections(body: str) -> tuple[KnowledgeSection, ...]:
    sections: list[KnowledgeSection] = []
    heading = ""
    buffer: list[str] = []

    for line in body.splitlines():
        if line.startswith("## "):
            if heading or buffer:
                sections.append(KnowledgeSection(heading=heading, text="\n".join(buffer).strip()))
            heading = line[3:].strip()
            buffer = []
        elif line.startswith("# ") and not heading and not buffer:
            heading = line[2:].strip()
        else:
            buffer.append(line)

    if heading or buffer:
        sections.append(KnowledgeSection(heading=heading, text="\n".join(buffer).strip()))

    return tuple(section for section in sections if section.text)


def load_documents(root: Path, *, include_draft: bool = True) -> list[KnowledgeDoc]:
    documents: list[KnowledgeDoc] = []
    if not root.exists():
        logger.warning("knowledge dir khong ton tai", extra={"context": {"path": str(root)}})
        return documents

    for path in sorted(root.rglob("*.md")):
        if path.parent == root:
            continue  # README.md cua corpus
        meta, body = _parse_frontmatter(path.read_text(encoding="utf-8"))
        doc_id = str(meta.get("doc_id") or path.stem)
        audience = str(meta.get("audience") or _AUDIENCE_BY_DIR.get(path.parent.name, "PUBLIC")).upper()
        status = str(meta.get("status") or "draft").lower()

        if status != "approved" and not include_draft:
            logger.info("bo qua tai lieu chua duyet", extra={"context": {"docId": doc_id}})
            continue

        documents.append(
            KnowledgeDoc(
                doc_id=doc_id,
                title=str(meta.get("title") or doc_id),
                audience=audience,
                locale=str(meta.get("locale") or "vi-VN"),
                version=str(meta.get("version") or "0.0"),
                status=status,
                effective_from=meta.get("effective_from"),
                approved_by=meta.get("approved_by"),
                source_url=str(meta.get("source_url") or f"internal://lunara/{doc_id}"),
                path=str(path),
                body=body,
                content_hash=hashlib.sha256(body.encode("utf-8")).hexdigest()[:12],
                sections=_split_sections(body),
            )
        )

    return documents

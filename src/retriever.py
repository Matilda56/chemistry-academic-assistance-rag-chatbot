#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
retriever.py — Weighted Hybrid retriever with keyword/course-code boosting
Connect Chroma for dense retrieval
Local BM25 for keyword retrieval
Normalize and weighted merge BM25 strong Dense support with keyword or course code boosting
Provide pack() and join_evidence() for output
"""

from __future__ import annotations
import re, json
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional

import numpy as np
from tqdm import tqdm
from rank_bm25 import BM25Okapi
import chromadb
from chromadb.utils import embedding_functions

# Fixed params
CHROMA_DIR       = "/workspace/rag-bot/stores/chroma_v2"
COLLECTION_NAME  = "chemistry"
EMBED_MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"

TOP_K            = 5           # how many results from each retriever
SNIPPET_MAX      = 480         # max snippet length for display

# Weight BM25 more for keyword BM25 strong Dense for semantic
W_BM25           = 0.7
W_DENSE          = 0.3

# Keyword or course code boosting in normalized score
KEYWORDS         = ["chem", "handbook", "timetable", "lyreco"]
REGEX_KEYWORDS   = [r"\bchem\d{3,4}\b", r"\bg\d{1}t\d{3}\b"]  # like CHEM1078 G5T509
BM25_KW_BOOST    = 0.20
DENSE_KW_BOOST   = 0.05

# small tools
def load_json_list(path: str) -> List[Dict[str, Any]]:
    p = Path(path)
    data = json.loads(p.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("data", data.get("items", []))
    if not isinstance(data, list):
        raise ValueError(f"{path} must be a JSON array.")
    return data

def save_json_list(path: str, arr: List[Dict[str, Any]]):
    p = Path(path); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(arr, ensure_ascii=False, indent=2), encoding="utf-8")

def make_snippet(text: str, n: int = SNIPPET_MAX) -> str:
    return " ".join((text or "").split())[:n].rstrip()

def join_evidence(res_list: List[Dict[str, Any]], max_n: int = 5, use_snippet: bool = True) -> str:
    """Join evidence blocks use_snippet=False means use full_text"""
    parts = []
    for r in res_list[:max_n]:
        header = f"[{r.get('rank','')}] {r.get('title') or 'Untitled'}"
        url = r.get("url") or ""
        if url: header += f"\n{url}"
        body = r.get("snippet") if use_snippet else (r.get("full_text") or r.get("snippet") or "")
        parts.append(f"{header}\n{body}")
    return "\n\n".join(parts).strip()

# main retriever
@dataclass
class Doc:
    doc_id: str
    text: str
    title: str = ""
    url: str = ""

_SPLIT = re.compile(r"[^\w]+", re.U)
def _simple_tokenize(s: str) -> List[str]:
    if not s: return []
    return [t for t in _SPLIT.split(s.lower()) if t]

def _keyword_hit(text: str, kws: List[str], regexps: List[str]) -> bool:
    if not text: return False
    t = text.lower()
    if any(k.lower() in t for k in kws): return True
    for pat in regexps:
        if re.search(pat, t, re.I): return True
    return False

def _doc_hits_keyword(doc: Doc, kws: List[str], regexps: List[str]) -> bool:
    return _keyword_hit(doc.text, kws, regexps) or _keyword_hit(doc.title, kws, regexps) or _keyword_hit(doc.url, kws, regexps)

def _minmax_norm(scores: Dict[int, float]) -> Dict[int, float]:
    if not scores: return {}
    vals = np.array(list(scores.values()), dtype=float)
    lo, hi = float(vals.min()), float(vals.max())
    if hi - lo < 1e-12:
        return {k: 0.5 for k in scores}
    return {k: (v - lo) / (hi - lo) for k, v in scores.items()}

class RAGRetriever:
    def __init__(self):
        # connect to Chroma
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBED_MODEL_NAME)
        self.col = client.get_collection(COLLECTION_NAME, embedding_function=ef)

        # load all docs
        total = self.col.count()
        self.docs: List[Doc] = []
        offset, step = 0, 1000
        with tqdm(total=total, desc="Loading corpus from Chroma", unit="doc") as bar:
            while offset < total:
                n = min(step, total - offset)
                batch = self.col.get(include=["documents", "metadatas"], limit=n, offset=offset)
                ids   = batch.get("ids", [])
                texts = batch.get("documents", [])
                metas = batch.get("metadatas", [])
                for i, t, m in zip(ids, texts, metas):
                    m = m or {}
                    self.docs.append(Doc(
                        doc_id=str(i),
                        text=str(t or ""),
                        title=str(m.get("title") or m.get("source_id") or m.get("file_name") or ""),
                        url=str(m.get("url") or "")
                    ))
                offset += n
                bar.update(n)
        if not self.docs:
            raise RuntimeError("No documents loaded from Chroma collection.")

        # BM25 prepare
        toks = [_simple_tokenize(d.text) for d in self.docs]
        self.bm25 = BM25Okapi(toks)

        # id map for dense result
        self.id2idx = {str(d.doc_id): j for j, d in enumerate(self.docs)}

    # retrieval
    def search_bm25(self, query: str, k: int = TOP_K) -> List[Tuple[int, float]]:
        qs = _simple_tokenize(query)
        scores = self.bm25.get_scores(qs)
        idx = np.argsort(-scores)[:k]
        return [(int(i), float(scores[i])) for i in idx]

    def search_dense(self, query: str, k: int = TOP_K) -> List[Tuple[int, float]]:
        res = self.col.query(query_texts=[query], n_results=min(k, len(self.docs)), include=["distances"])
        ids_list = res.get("ids", [[]])[0]
        dists = res.get("distances", [[]])[0] if "distances" in res else [0.0]*len(ids_list)
        pairs = []
        for doc_id, dist in zip(ids_list, dists):
            key = str(doc_id)
            if key in self.id2idx:
                pairs.append((self.id2idx[key], -float(dist)))  # similarity use negative distance
        pairs.sort(key=lambda x: x[1], reverse=True)
        return pairs[:k]

    def search_hybrid(self, query: str, k: int = TOP_K) -> List[Tuple[int, float]]:
        bm = {i: s for i, s in self.search_bm25(query, k)}
        de = {i: s for i, s in self.search_dense(query, k)}
        nb = _minmax_norm(bm)
        nd = _minmax_norm(de)
        ids = set(nb) | set(nd)
        fused: Dict[int, float] = {}
        for idx in ids:
            kw = _doc_hits_keyword(self.docs[idx], KEYWORDS, REGEX_KEYWORDS)
            s_b = nb.get(idx, 0.0) + (BM25_KW_BOOST if kw else 0.0)
            s_d = nd.get(idx, 0.0) + (DENSE_KW_BOOST if kw else 0.0)
            fused[idx] = W_BM25 * s_b + W_DENSE * s_d
        return sorted(fused.items(), key=lambda x: x[1], reverse=True)[:k]

    # pack output
    def pack(self, pairs: List[Tuple[int, float]], with_full_text: bool = False) -> List[Dict[str, Any]]:
        out = []
        for rank, (idx, score) in enumerate(pairs, 1):
            d = self.docs[idx]
            item = {
                "rank": rank,
                "doc_id": d.doc_id,
                "score": round(float(score), 6),
                "title": d.title or "",
                "url": d.url or "",
                "snippet": make_snippet(d.text)
            }
            if with_full_text:
                item["full_text"] = d.text
            out.append(item)
        return out

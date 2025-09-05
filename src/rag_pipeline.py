#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# One-pass RAG API: retrieval + context join + LLM (base + LoRA)
# Run: python rag_pipeline.py

import re
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, GenerationConfig
from peft import PeftModel

from retriever import RAGRetriever, join_evidence

# Fixed params (align offline gen_answers.py)
BASE_MODEL       = "/workspace/models/llama-3.1-8b-instruct"
LORA_PATH        = "/workspace/rag-bot/LLaMA-Factory/saves/llama3-8b/lora/sft"

MAX_NEW_TOKENS   = 400
TEMPERATURE      = 0.2
TOP_P            = 0.9
REPETITION_PEN   = 1.15
NO_REPEAT_NGRAM  = 4

EVIDENCE_MAX_N   = 3
USE_SNIPPET      = False
TOP_K_EACH_QUERY = 6

SYSTEM_PROMPT = """You are a Chemistry Department academic services assistant.

Answer ONLY using the provided Context. Do not use outside knowledge.

Output protocol (follow exactly):
1) First line: the final answer in one concise sentence.
2) If any details are necessary, add 1–3 short bullet points.
3) If you could not find a direct answer in the Context, reply exactly:
   No reliable sources found.
   Then propose next steps in one short sentence.

Mandatory rules:
A. Evidence extraction: before answering, locate the minimal exact span(s) in the Context that contain the answer. Copy exact numbers, names, URLs, dates/times from those spans without reformatting.
B. Conflict handling: if the Context contains conflicting statements, resolve them in this order:
   (1) Prefer content that explicitly matches the question’s module/exam code, term, and year.
   (2) Prefer documents with higher retrieval score or that are exam/instructions pages over general pages.
   (3) Prefer the most recent date in the Context.
   If the conflict cannot be resolved, state the most likely answer and add one bullet noting the alternative with its wording in quotes.
C. Scope check: if the question is unrelated to Durham University Chemistry academic administration, state that it is out of scope.
D. Links: if reliable URLs appear in the Context, append up to 2 of them at the very end separated by spaces (no labels).
E. Style constraints:
   - Do NOT start with “Answer:”, “According to…”, or similar.
   - Do NOT include a “References” section or any meta comments.
   - Keep the answer factual and concise; no speculation.
"""

# Simple cleaners/builders
_PREFIX_EN = re.compile(r"""^\s*((answer|response)\s*[:\-–]\s*)""", re.I)

def clean_answer_text(text: str) -> str:
    t = (text or "").strip().strip('"').strip("'")
    return _PREFIX_EN.sub("", t).lstrip()

def build_prompt(question: str, context: str) -> str:
    return (
        "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n"
        f"{SYSTEM_PROMPT.strip()}\n"
        "<|eot_id|><|start_header_id|>user<|end_header_id|>\n"
        f"{question.strip()}\n\n{context.strip()}\n"
        "<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n"
    )

# Load retriever and model once
retriever = RAGRetriever()

tok = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
base = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL, device_map="auto", torch_dtype=torch.float16
)
model = PeftModel.from_pretrained(base, LORA_PATH).eval()

gcfg = GenerationConfig(
    max_new_tokens=MAX_NEW_TOKENS,
    do_sample=(TEMPERATURE > 0),
    temperature=TEMPERATURE,
    top_p=TOP_P,
    repetition_penalty=REPETITION_PEN,
    no_repeat_ngram_size=NO_REPEAT_NGRAM,
    eos_token_id=tok.eos_token_id,
    pad_token_id=tok.eos_token_id,
)

# FastAPI app
app = FastAPI(title="RAG Pipeline")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryReq(BaseModel):
    instruction: str

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/ask")
def ask(req: QueryReq):
    pairs = retriever.search_hybrid(req.instruction, k=TOP_K_EACH_QUERY)
    packed = retriever.pack(pairs, with_full_text=(not USE_SNIPPET))
    context = join_evidence(packed, max_n=EVIDENCE_MAX_N, use_snippet=USE_SNIPPET)

    prompt = build_prompt(req.instruction, context)
    inputs = tok(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        out_ids = model.generate(**inputs, generation_config=gcfg)

    gen_only = out_ids[0, inputs["input_ids"].shape[-1]:]
    eot = tok.convert_tokens_to_ids("<|eot_id|>")
    if eot is not None:
        pos = (gen_only == eot).nonzero(as_tuple=True)[0]
        if len(pos) > 0:
            gen_only = gen_only[:pos[0]]

    decoded = tok.decode(gen_only, skip_special_tokens=True).strip()
    answer = clean_answer_text(decoded)

    return {
        "instruction": req.instruction,
        "context": context,
        "retrieval": packed,
        "output": answer,
        "answer": answer
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_pipeline:app", host="0.0.0.0", port=8000, reload=False)

# RAGAS Controlled Experiment — Context Alignment + Top-K 10

## Purpose

Test whether the previous RAGAS faithfulness score was depressed by an evaluation-context mismatch rather than by a change in the RAG system itself.

## Changes under test

- RAGAS `retrieved_contexts` uses the exact per-document context serialization used by the generator.
- RAGAS export defaults to `TOP_K=10`, matching the retrieval benchmark.
- Candidate top-k defaults to 40 as `max(TOP_K * 4, TOP_K)`.

## Frozen variables

- Generation model: `gemma4:cloud`
- RAG system prompt: unchanged
- Embedding model: `bge-m3`
- Canonical corpus and chunking: unchanged
- Vector retrieval: unchanged
- Existing reranking behavior: unchanged
- RAGAS package/configuration: unchanged except for the dataset context and retrieval depth above

## Baseline

Previous baseline artifacts remain under `data/evaluation/labour-law-v2/`.

## Primary comparison

Compare aggregate and per-record `faithfulness`, then inspect claim-level diagnostics for labour-032, labour-055, and labour-065. Do not introduce a hard pass/fail delta threshold until the before/after result is observed.

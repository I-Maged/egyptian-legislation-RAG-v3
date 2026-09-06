# Law-Agnostic Evaluation Pipeline

This evaluation layer evaluates the same RAG implementation against Labour,
Financial, and Personal Affairs Law without changing production retrieval,
embeddings, chunking, or generation prompts.

## Gold data

The benchmark always uses the corrected gold overlays:

- `labour-law-gold-corrections.ts`
- `financial-law-gold-corrections.ts`
- `personal-affairs-law-gold-corrections.ts`

The original draft files remain the source drafts and are not modified.

## Internal benchmark

`packages/evaluation/src/benchmarks/law-generation-benchmark.test.ts` runs:

1. DB pgvector semantic retrieval at `topK=10`.
2. Retrieval metrics: Recall@1/3/5/10, Precision@5/10, HitRate@1/3/5/10, MRR, nDCG@5/10.
3. Generation with the configured Ollama model.
4. Internal LLM judging for correctness, faithfulness, and citation correctness.
5. Pass rate at threshold `0.70`.

The benchmark is intentionally vector-only because semantic vector retrieval
is the selected primary runtime strategy. It does not introduce BM25,
hybrid retrieval, or reranking into this evaluation path.

For Personal Affairs, each gold item is scoped to the source instrument
identified by its corrected gold chunk IDs. The current RAG request contract
supports one `lawDocumentId` per request; multi-document gold items therefore
fail explicitly rather than silently evaluating an unscoped query.

## RAGAS

`packages/evaluation/src/ragas/export.ts` is the shared exporter. It uses:

- corrected gold data;
- RAG `topK=10` and candidate `topK=40` by default;
- the metadata-rich context serialization used by the RAG service;
- the same law-level scoping used by the internal benchmark.

Python then evaluates:

- Faithfulness
- AnswerRelevancy
- ContextPrecisionWithoutReference
- ContextRelevance

The claim-level diagnostic mirrors RAGAS 0.4.3 Faithfulness statement and
verdict generation. The inspector reports only records below the selected
threshold.

## Commands

Financial:

```powershell
npm run evaluation:financial
npm run ragas:dataset:financial
npm run ragas:evaluate:financial
npm run ragas:diagnose:financial
npm run ragas:inspect:financial
```

Personal Affairs:

```powershell
npm run evaluation:personal
npm run ragas:dataset:personal
npm run ragas:evaluate:personal
npm run ragas:diagnose:personal
npm run ragas:inspect:personal
```

Generic:

```powershell
$env:EVALUATION_LAW="financial"
npm run evaluation:benchmark
npm run ragas:dataset
npm run ragas:evaluate
npm run ragas:diagnose-faithfulness
npm run ragas:inspect-faithfulness
```

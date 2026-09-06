# RAGAS evaluation

This directory contains the Python side of the Egyptian Law RAG evaluation.

The application itself remains TypeScript. The TypeScript evaluator exports
real RAG responses into a small, stable JSON contract; Python then runs the
official `ragas` package over that contract.

## Metrics

The current Labour Law benchmark has gold **chunk IDs** but does not yet have
human-written reference answers. Therefore the first implementation uses:

- `Faithfulness` — LLM-based
- `AnswerRelevancy` — LLM + embeddings
- `IDBasedContextPrecision` — exact comparison against gold chunk IDs
- `IDBasedContextRecall` — exact comparison against gold chunk IDs

The ID-based context metrics are intentional. We must not fabricate reference
answers by concatenating the retrieved legal articles. If human-written
reference answers are added later, the standard LLM `ContextPrecision` and
`ContextRecall` metrics can be enabled as a second experiment.

## Install

Python 3.9+ is required.

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r evaluation/ragas/requirements.txt
```

## Ollama / OpenAI-compatible configuration

Default:

```text
RAGAS_BASE_URL=http://localhost:11434/v1
RAGAS_API_KEY=ollama
RAGAS_LLM_MODEL=gemma4:cloud
RAGAS_EMBEDDING_MODEL=bge-m3
```

For another OpenAI-compatible endpoint, set `RAGAS_BASE_URL` and
`RAGAS_API_KEY`.

## Run

First export real Labour Law RAG responses:

```bash
npm run ragas:dataset
```

Then run RAGAS:

```bash
python evaluation/ragas/run.py
```

Or:

```bash
python evaluation/ragas/run.py --concurrency 3
```

Results are written to:

```text
data/evaluation/labour-law-v3/ragas-results.json
```

Claim-level faithfulness diagnostics can be generated with:

```bash
npm run ragas:diagnose-faithfulness
```

They are written to:

```text
data/evaluation/labour-law-v3/ragas-faithfulness-diagnostics.json
```

## Law-agnostic evaluation pipeline (v3)

The evaluation pipeline now accepts `labour`, `financial`, or `personal-affairs` as a law selector. Financial and Personal Affairs use the **corrected gold overlays** from `packages/evaluation/src/datasets/*-corrections.ts`; the original draft files remain unchanged.

The pipeline is intentionally split into reproducible stages:

1. Internal DB-vector retrieval + generation benchmark
2. RAGAS dataset export
3. RAGAS metrics
4. Claim-level Faithfulness diagnostics
5. Faithfulness inspector

The RAGAS exporter uses the same metadata-rich context serialization as the RAG service and evaluates with `topK=10` by default, matching the controlled Labour v3 experiment.

### Financial Law

```powershell
npm run evaluation:financial
npm run ragas:dataset:financial
npm run ragas:evaluate:financial
npm run ragas:diagnose:financial
npm run ragas:inspect:financial
```

### Personal Affairs Law

```powershell
npm run evaluation:personal
npm run ragas:dataset:personal
npm run ragas:evaluate:personal
npm run ragas:diagnose:personal
npm run ragas:inspect:personal
```

### Generic forms

```powershell
$env:EVALUATION_LAW="financial"
npm run evaluation:benchmark
npm run ragas:dataset
npm run ragas:evaluate
npm run ragas:diagnose-faithfulness
npm run ragas:inspect-faithfulness
```

The Personal Affairs gold set contains multiple source instruments. For each benchmark item the runner derives its source `lawDocumentId` from the corrected gold chunk IDs, so retrieval remains scoped to the relevant instrument rather than leaking across the full legal corpus. Items that span multiple source documents fail explicitly because the current RAG request contract supports one `lawDocumentId` per request.

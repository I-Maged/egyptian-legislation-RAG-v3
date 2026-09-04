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
data/evaluation/labour-law/ragas-results.json
```

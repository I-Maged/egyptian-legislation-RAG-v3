from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path
from statistics import mean
from typing import Any

from openai import AsyncOpenAI

from ragas.llms import llm_factory
from ragas.embeddings.base import embedding_factory
from ragas.metrics.collections import (
    AnswerRelevancy,
    ContextPrecisionWithoutReference,
    ContextRelevance,
    Faithfulness,
)


def metric_value(result: Any) -> float:
    """Extract a numeric score from a RAGAS MetricResult."""

    value = getattr(result, "value", result)

    if not isinstance(value, (int, float)):
        raise TypeError(
            f"RAGAS metric returned a non-numeric value: {value!r}"
        )

    value = float(value)

    if not 0.0 <= value <= 1.0:
        raise ValueError(
            f"RAGAS metric returned an invalid score: {value}"
        )

    return value


def metric_reason(result: Any) -> str | None:
    """Extract the optional explanation from a RAGAS MetricResult."""

    reason = getattr(result, "reason", None)

    return reason if isinstance(reason, str) else None


def load_dataset(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        dataset = json.load(file)

    if dataset.get("schema_version") != "1.0":
        raise ValueError(
            f"Unsupported RAGAS dataset schema: "
            f"{dataset.get('schema_version')}"
        )

    if dataset.get("language") != "ar":
        raise ValueError(
            "This evaluator expects an Arabic dataset."
        )

    if dataset.get("jurisdiction") != "EG":
        raise ValueError(
            "This evaluator expects an Egyptian-law dataset."
        )

    records = dataset.get("records")

    if not isinstance(records, list) or not records:
        raise ValueError(
            "RAGAS dataset contains no records."
        )

    return dataset


def create_models() -> tuple[Any, Any]:
    """
    Configure RAGAS to use the project's OpenAI-compatible Ollama endpoint.

    Defaults:

        RAGAS_BASE_URL=http://localhost:11434/v1
        RAGAS_API_KEY=ollama
        RAGAS_LLM_MODEL=gemma4:cloud
        RAGAS_EMBEDDING_MODEL=bge-m3
    """

    base_url = os.getenv(
        "RAGAS_BASE_URL",
        "http://localhost:11434/v1",
    )

    api_key = os.getenv(
        "RAGAS_API_KEY",
        "ollama",
    )

    llm_model = os.getenv(
        "RAGAS_LLM_MODEL",
        "gemma4:cloud",
    )

    embedding_model = os.getenv(
        "RAGAS_EMBEDDING_MODEL",
        "bge-m3",
    )

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
    )

    llm = llm_factory(
        llm_model,
        provider="openai",
        client=client,
        max_tokens=16384,
    )

    embeddings = embedding_factory(
        "openai",
        model=embedding_model,
        client=client,
    )

    return llm, embeddings


async def evaluate_record(
    record: dict[str, Any],
    *,
    faithfulness: Faithfulness,
    answer_relevancy: AnswerRelevancy,
    context_precision: ContextPrecisionWithoutReference,
    context_relevance: ContextRelevance,
) -> dict[str, Any]:

    faithfulness_result = await faithfulness.ascore(
        user_input=record["user_input"],
        response=record["response"],
        retrieved_contexts=record["retrieved_contexts"],
    )

    answer_relevancy_result = await answer_relevancy.ascore(
        user_input=record["user_input"],
        response=record["response"],
    )

    context_precision_result = (
        await context_precision.ascore(
            user_input=record["user_input"],
            response=record["response"],
            retrieved_contexts=record["retrieved_contexts"],
        )
    )

    context_relevance_result = (
        await context_relevance.ascore(
            user_input=record["user_input"],
            retrieved_contexts=record["retrieved_contexts"],
        )
    )

    return {
        "id": record["id"],

        "faithfulness": metric_value(
            faithfulness_result
        ),
        "faithfulness_reason": metric_reason(
            faithfulness_result
        ),

        "answer_relevancy": metric_value(
            answer_relevancy_result
        ),
        "answer_relevancy_reason": metric_reason(
            answer_relevancy_result
        ),

        "context_precision": metric_value(
            context_precision_result
        ),
        "context_precision_reason": metric_reason(
            context_precision_result
        ),

        "context_relevance": metric_value(
            context_relevance_result
        ),
        "context_relevance_reason": metric_reason(
            context_relevance_result
        ),
    }


async def run(
    dataset_path: Path,
    output_path: Path,
    concurrency: int,
) -> None:

    dataset = load_dataset(dataset_path)

    llm, embeddings = create_models()

    faithfulness = Faithfulness(
        llm=llm,
    )

    answer_relevancy = AnswerRelevancy(
        llm=llm,
        embeddings=embeddings,
    )

    context_precision = ContextPrecisionWithoutReference(
        llm=llm,
    )

    context_relevance = ContextRelevance(
        llm=llm,
    )

    semaphore = asyncio.Semaphore(
        max(1, concurrency)
    )

    async def worker(
        record: dict[str, Any],
    ) -> dict[str, Any]:

        async with semaphore:

            print(
                f"[RAGAS] {record['id']} starting"
            )

            try:

                result = await evaluate_record(
                    record,
                    faithfulness=faithfulness,
                    answer_relevancy=answer_relevancy,
                    context_precision=context_precision,
                    context_relevance=context_relevance,
                )

                print(
                    f"[RAGAS] {record['id']} completed"
                )

                return result

            except Exception as error:

                print(
                    f"[RAGAS] {record['id']} FAILED: "
                    f"{type(error).__name__}: {error}"
                )

                raise

    per_query = await asyncio.gather(
        *(
            worker(record)
            for record in dataset["records"]
        )
    )

    def average(key: str) -> float:

        values = [
            float(result[key])
            for result in per_query
        ]

        return mean(values) if values else 0.0

    output = {
        "schema_version": "1.0",
        "evaluator": "ragas",
        "ragas_version": "0.4.3",

        "dataset_name": dataset["dataset_name"],

        "query_count": len(per_query),

        "metrics": {
            "faithfulness": average(
                "faithfulness"
            ),
            "answer_relevancy": average(
                "answer_relevancy"
            ),
            "context_precision": average(
                "context_precision"
            ),
            "context_relevance": average(
                "context_relevance"
            ),
        },

        "metric_definitions": {
            "faithfulness": (
                "RAGAS Faithfulness: "
                "whether claims in the generated answer "
                "are supported by retrieved context."
            ),

            "answer_relevancy": (
                "RAGAS AnswerRelevancy: "
                "whether the generated answer addresses "
                "the user's question."
            ),

            "context_precision": (
                "RAGAS ContextPrecisionWithoutReference: "
                "whether retrieved contexts are relevant "
                "to the generated response."
            ),

            "context_relevance": (
                "RAGAS ContextRelevance: "
                "whether the retrieved contexts are relevant "
                "to the user's question."
            ),
        },

        "model": {
            "llm": os.getenv(
                "RAGAS_LLM_MODEL",
                "gemma4:cloud",
            ),

            "embedding": os.getenv(
                "RAGAS_EMBEDDING_MODEL",
                "bge-m3",
            ),

            "base_url": os.getenv(
                "RAGAS_BASE_URL",
                "http://localhost:11434/v1",
            ),
        },

        "per_query": per_query,
    }

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with output_path.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            output,
            file,
            ensure_ascii=False,
            indent=2,
        )

        file.write("\n")

    print()
    print("=" * 60)
    print("EGYPTIAN LAW RAGAS EVALUATION")
    print("=" * 60)

    print(
        f"Queries:              "
        f"{len(per_query)}"
    )

    print(
        f"Faithfulness:         "
        f"{output['metrics']['faithfulness']:.4f}"
    )

    print(
        f"Answer Relevancy:     "
        f"{output['metrics']['answer_relevancy']:.4f}"
    )

    print(
        f"Context Precision:    "
        f"{output['metrics']['context_precision']:.4f}"
    )

    print(
        f"Context Relevance:    "
        f"{output['metrics']['context_relevance']:.4f}"
    )

    print("=" * 60)

    print(
        f"Results: {output_path}"
    )


def parse_args() -> argparse.Namespace:

    parser = argparse.ArgumentParser(
        description=(
            "Run RAGAS evaluation "
            "for Egyptian Law RAG."
        )
    )

    parser.add_argument(
        "--dataset",
        default=(
            "data/evaluation/"
            "labour-law/ragas-dataset.json"
        ),
    )

    parser.add_argument(
        "--output",
        default=(
            "data/evaluation/"
            "labour-law/ragas-results.json"
        ),
    )

    parser.add_argument(
        "--concurrency",
        type=int,
        default=3,
    )

    return parser.parse_args()


if __name__ == "__main__":

    args = parse_args()

    if args.concurrency <= 0:
        raise SystemExit(
            "--concurrency must be greater than zero."
        )

    asyncio.run(
        run(
            Path(args.dataset),
            Path(args.output),
            args.concurrency,
        )
    )
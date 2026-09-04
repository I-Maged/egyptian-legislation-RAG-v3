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
from ragas.metrics.collections import Faithfulness


def create_llm() -> Any:
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

    max_tokens = int(
        os.getenv(
            "RAGAS_MAX_TOKENS",
            "8192",
        )
    )

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
    )

    return llm_factory(
        llm_model,
        provider="openai",
        client=client,
        max_tokens=max_tokens,
    )


def load_dataset(path: Path) -> dict[str, Any]:
    with path.open(
        "r",
        encoding="utf-8",
    ) as file:
        dataset = json.load(file)

    records = dataset.get("records")

    if not isinstance(records, list):
        raise ValueError(
            "Dataset must contain a 'records' array."
        )

    if not records:
        raise ValueError(
            "Dataset contains no records."
        )

    return dataset


def get_verdict_value(verdict: Any) -> int | None:
    """
    Extract the integer verdict from a RAGAS NLI statement verdict.

    RAGAS 0.4.3 normally returns NLIStatementOutput containing
    statements with a verdict field.
    """

    value = getattr(
        verdict,
        "verdict",
        None,
    )

    if isinstance(value, bool):
        return int(value)

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        return int(value)

    if isinstance(value, str):
        normalized = value.strip().lower()

        if normalized in {
            "1",
            "true",
            "yes",
            "supported",
        }:
            return 1

        if normalized in {
            "0",
            "false",
            "no",
            "unsupported",
        }:
            return 0

    return None


def get_reason(verdict: Any) -> str | None:
    reason = getattr(
        verdict,
        "reason",
        None,
    )

    if reason is None:
        return None

    return str(reason)


def get_statement(verdict: Any) -> str | None:
    statement = getattr(
        verdict,
        "statement",
        None,
    )

    if statement is None:
        return None

    return str(statement)


async def trace_faithfulness(
    metric: Faithfulness,
    record: dict[str, Any],
) -> dict[str, Any]:

    question = str(
        record["user_input"]
    )

    response = str(
        record["response"]
    )

    contexts = record.get(
        "retrieved_contexts",
        [],
    )

    if not isinstance(contexts, list):
        raise ValueError(
            f"{record['id']}: "
            "'retrieved_contexts' must be a list."
        )

    # This mirrors RAGAS Faithfulness:
    #
    # retrieved_contexts -> one combined context string
    #
    # before NLI verdict generation.
    context = "\n".join(
        str(item)
        for item in contexts
    )

    # ---------------------------------------------------------
    # STEP 1
    # Generate atomic statements from the answer.
    #
    # RAGAS 0.4.3:
    #
    #   _create_statements(
    #       question: str,
    #       response: str
    #   ) -> List[str]
    # ---------------------------------------------------------

    statements = await metric._create_statements(
        question,
        response,
    )

    if not statements:
        return {
            "faithfulness": 0.0,
            "claim_count": 0,
            "supported_claim_count": 0,
            "unsupported_claim_count": 0,
            "unscored_claim_count": 0,
            "claims": [],
        }

    # ---------------------------------------------------------
    # STEP 2
    # Evaluate each statement against the combined context.
    #
    # RAGAS 0.4.3:
    #
    #   _create_verdicts(
    #       statements: List[str],
    #       context: str
    #   ) -> NLIStatementOutput
    # ---------------------------------------------------------

    verdict_output = await metric._create_verdicts(
        statements,
        context,
    )

    verdicts = getattr(
        verdict_output,
        "statements",
        None,
    )

    # Some RAGAS versions expose the list directly through
    # a different attribute. Keep the diagnostic defensive.
    if verdicts is None:
        verdicts = getattr(
            verdict_output,
            "verdicts",
            [],
        )

    if not isinstance(
        verdicts,
        list,
    ):
        verdicts = list(verdicts)

    claims: list[dict[str, Any]] = []

    supported = 0
    unsupported = 0
    unscored = 0

    for index, statement in enumerate(
        statements
    ):

        verdict_object = (
            verdicts[index]
            if index < len(verdicts)
            else None
        )

        verdict = (
            get_verdict_value(
                verdict_object
            )
            if verdict_object is not None
            else None
        )

        reason = (
            get_reason(
                verdict_object
            )
            if verdict_object is not None
            else None
        )

        returned_statement = (
            get_statement(
                verdict_object
            )
            if verdict_object is not None
            else None
        )

        if returned_statement:
            statement_text = (
                returned_statement
            )
        else:
            statement_text = str(
                statement
            )

        if verdict == 1:
            supported += 1
            classification = "SUPPORTED"

        elif verdict == 0:
            unsupported += 1
            classification = "UNSUPPORTED"

        else:
            unscored += 1
            classification = "UNSCORED"

        claims.append(
            {
                "claim_index": index + 1,
                "statement": statement_text,
                "verdict": verdict,
                "supported": verdict == 1,
                "classification": classification,
                "reason": reason,
            }
        )

    scored = supported + unsupported

    faithfulness = (
        supported / scored
        if scored > 0
        else 0.0
    )

    return {
        "faithfulness": faithfulness,
        "claim_count": len(statements),
        "supported_claim_count": supported,
        "unsupported_claim_count": unsupported,
        "unscored_claim_count": unscored,
        "claims": claims,
    }


async def run(
    dataset_path: Path,
    output_path: Path,
    concurrency: int,
    threshold: float,
) -> None:

    dataset = load_dataset(
        dataset_path
    )

    llm = create_llm()

    metric = Faithfulness(
        llm=llm
    )

    semaphore = asyncio.Semaphore(
        max(1, concurrency)
    )

    async def worker(
        record: dict[str, Any],
    ) -> dict[str, Any]:

        async with semaphore:

            record_id = str(
                record["id"]
            )

            print(
                f"[RAGAS DIAGNOSTIC] "
                f"{record_id} starting"
            )

            trace = await trace_faithfulness(
                metric,
                record,
            )

            print(
                f"[RAGAS DIAGNOSTIC] "
                f"{record_id} completed "
                f"(faithfulness="
                f"{trace['faithfulness']:.4f})"
            )

            return {
                "id": record_id,
                "user_input": record[
                    "user_input"
                ],
                "response": record[
                    "response"
                ],
                "retrieved_contexts": record[
                    "retrieved_contexts"
                ],
                "retrieved_context_ids": record.get(
                    "retrieved_context_ids",
                    [],
                ),
                "reference_context_ids": record.get(
                    "reference_context_ids",
                    [],
                ),
                "citations": record.get(
                    "citations",
                    [],
                ),
                **trace,
            }

    records = await asyncio.gather(
        *(
            worker(record)
            for record in dataset["records"]
        )
    )

    scores = [
        record["faithfulness"]
        for record in records
    ]

    output = {
        "schema_version": "1.0",
        "evaluator": "ragas-faithfulness-diagnostic",
        "ragas_version": "0.4.3",

        "dataset_name": dataset.get(
            "dataset_name"
        ),

        "query_count": len(records),

        "threshold": threshold,

        "aggregate": {
            "faithfulness": (
                mean(scores)
                if scores
                else 0.0
            ),

            "low_faithfulness_count": sum(
                1
                for score in scores
                if score < threshold
            ),
        },

        "model": {
            "llm": os.getenv(
                "RAGAS_LLM_MODEL",
                "gemma4:cloud",
            ),

            "max_tokens": int(
                os.getenv(
                    "RAGAS_MAX_TOKENS",
                    "8192",
                )
            ),

            "base_url": os.getenv(
                "RAGAS_BASE_URL",
                "http://localhost:11434/v1",
            ),
        },

        "records": records,
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
    print(
        "RAGAS FAITHFULNESS CLAIM-LEVEL DIAGNOSTIC"
    )
    print("=" * 60)

    print(
        f"Queries:              {len(records)}"
    )

    print(
        f"Faithfulness:         "
        f"{output['aggregate']['faithfulness']:.4f}"
    )

    print(
        f"Low-faithfulness:     "
        f"{output['aggregate']['low_faithfulness_count']}"
    )

    print(
        f"Threshold:            "
        f"{threshold:.2f}"
    )

    print("=" * 60)

    print(
        f"Results: {output_path}"
    )


def main() -> None:

    parser = argparse.ArgumentParser(
        description=(
            "Claim-level RAGAS Faithfulness "
            "diagnostic for Egyptian Law RAG."
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
            "labour-law/"
            "ragas-faithfulness-diagnostics.json"
        ),
    )

    parser.add_argument(
        "--concurrency",
        type=int,
        default=3,
    )

    parser.add_argument(
        "--threshold",
        type=float,
        default=0.60,
    )

    args = parser.parse_args()

    if not 0.0 <= args.threshold <= 1.0:
        raise SystemExit(
            "--threshold must be between 0 and 1."
        )

    if args.concurrency <= 0:
        raise SystemExit(
            "--concurrency must be greater than zero."
        )

    asyncio.run(
        run(
            Path(args.dataset),
            Path(args.output),
            args.concurrency,
            args.threshold,
        )
    )


if __name__ == "__main__":
    main()
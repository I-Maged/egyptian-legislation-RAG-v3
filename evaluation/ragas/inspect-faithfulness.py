from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect low-faithfulness RAGAS claims.")
    parser.add_argument("--input", default="data/evaluation/labour-law/ragas-faithfulness-diagnostics.json")
    parser.add_argument("--threshold", type=float, default=None)
    args = parser.parse_args()

    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    threshold = data["threshold"] if args.threshold is None else args.threshold

    records = [
        r for r in data["records"]
        if r["faithfulness"] is not None and r["faithfulness"] < threshold
    ]
    records.sort(key=lambda r: r["faithfulness"])

    print("=" * 100)
    print("RAGAS FAITHFULNESS CLAIM-LEVEL INSPECTOR")
    print("=" * 100)
    print(f"Threshold: {threshold:.2f} | Cases: {len(records)}")

    for record in records:
        print("\n" + "-" * 100)
        print(
            f"{record['id']} | faithfulness={record['faithfulness']:.4f} | "
            f"claims={record['claim_count']} | "
            f"supported={record['supported_claim_count']} | "
            f"unsupported={record['unsupported_claim_count']}"
        )
        print(f"Question: {record['user_input']}")
        print(f"Answer:   {record['response']}")

        for claim in record["claims"]:
            label = "SUPPORTED" if claim["supported"] is True else "UNSUPPORTED" if claim["supported"] is False else "UNSCORED"
            print(f"\n  Claim {claim['claim_index']} [{label}]")
            print(f"    Statement: {claim['statement']}")
            print(f"    Reason:    {claim['reason']}")

    print("\n" + "=" * 100)


if __name__ == "__main__":
    main()

import { describe, expect, it } from "vitest";

import { validateEmbeddingArtifact } from "./embedding";

describe("validateEmbeddingArtifact", () => {
  const validArtifact = {
    schema_version: "1.0" as const,
    model: "bge-m3",
    dimensions: 3,
    records: [
      {
        chunk_id: "chunk-1",
        embedding: [0.1, 0.2, 0.3],
        model: "bge-m3",
        dimensions: 3,
      },
    ],
  };

  it("accepts a valid embedding artifact", () => {
    expect(validateEmbeddingArtifact(validArtifact)).toEqual(validArtifact);
  });

  it("rejects records with mismatched embedding length", () => {
    expect(() =>
      validateEmbeddingArtifact({
        ...validArtifact,
        records: [
          {
            ...validArtifact.records[0],
            embedding: [0.1, 0.2],
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects duplicate chunk IDs", () => {
    expect(() =>
      validateEmbeddingArtifact({
        ...validArtifact,
        records: [validArtifact.records[0], validArtifact.records[0]],
      }),
    ).toThrow(/Duplicate embedding chunk ID/);
  });
});
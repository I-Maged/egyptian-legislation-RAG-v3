import type { EmbeddingProvider } from "@egyptian-law/core";

interface OllamaEmbedResponse {
  embeddings?: unknown;
}

export interface OllamaEmbeddingProviderOptions {
  base_url?: string;
  model?: string;
  dimensions?: number;
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;

  private readonly baseUrl: string;

  constructor(options: OllamaEmbeddingProviderOptions = {}) {
    this.baseUrl = (options.base_url ?? "http://localhost:11434").replace(
      /\/+$/,
      "",
    );

    this.model = options.model ?? "bge-m3";
    this.dimensions = options.dimensions ?? 1024;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Ollama embedding request failed (${response.status}): ${body}`,
      );
    }

    const json = (await response.json()) as OllamaEmbedResponse;

    if (!Array.isArray(json.embeddings)) {
      throw new Error(
        "Ollama embedding response does not contain an embeddings array.",
      );
    }

    if (json.embeddings.length !== texts.length) {
      throw new Error(
        `Ollama returned ${json.embeddings.length} embeddings for ${texts.length} inputs.`,
      );
    }

    const embeddings: number[][] = [];

    for (const embedding of json.embeddings) {
      if (!Array.isArray(embedding)) {
        throw new Error("Ollama returned an invalid embedding vector.");
      }

      const vector = embedding.map((value) => {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error(
            "Ollama returned an embedding containing a non-finite value.",
          );
        }

        return value;
      });

      if (vector.length !== this.dimensions) {
        throw new Error(
          `Ollama returned an embedding with ${vector.length} dimensions; expected ${this.dimensions}.`,
        );
      }

      embeddings.push(vector);
    }

    return embeddings;
  }
}

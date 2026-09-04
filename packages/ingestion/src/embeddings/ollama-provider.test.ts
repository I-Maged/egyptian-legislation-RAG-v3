import { afterEach, describe, expect, it, vi } from "vitest";

import { OllamaEmbeddingProvider } from "./ollama-provider";

describe("OllamaEmbeddingProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses bge-m3 and 1024 dimensions by default", () => {
    const provider = new OllamaEmbeddingProvider();

    expect(provider.model).toBe("bge-m3");
    expect(provider.dimensions).toBe(1024);
  });

  it("supports custom configuration", () => {
    const provider = new OllamaEmbeddingProvider({
      base_url: "http://example.test/",
      model: "custom-model",
      dimensions: 768,
    });

    expect(provider.model).toBe("custom-model");
    expect(provider.dimensions).toBe(768);
  });

  it("returns embeddings from Ollama", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            embeddings: [
              [0.1, 0.2, 0.3, 0.4],
              [0.5, 0.6, 0.7, 0.8],
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    const provider = new OllamaEmbeddingProvider({
      dimensions: 4,
    });

    const result = await provider.embed(["النص الأول", "النص الثاني"]);

    expect(result).toEqual([
      [0.1, 0.2, 0.3, 0.4],
      [0.5, 0.6, 0.7, 0.8],
    ]);

    expect(fetch).toHaveBeenCalledTimes(1);

    const [url, init] = vi.mocked(fetch).mock.calls[0]!;

    expect(url).toBe("http://localhost:11434/api/embed");

    expect(init?.method).toBe("POST");

    expect(JSON.parse(String(init?.body))).toEqual({
      model: "bge-m3",
      input: ["النص الأول", "النص الثاني"],
    });
  });

  it("returns an empty array for empty input", async () => {
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    const provider = new OllamaEmbeddingProvider();

    const result = await provider.embed([]);

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a failed Ollama request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("model not found", {
          status: 404,
        }),
      ),
    );

    const provider = new OllamaEmbeddingProvider();

    await expect(provider.embed(["النص"])).rejects.toThrow(/404/);
  });

  it("rejects a malformed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            something_else: [],
          }),
          {
            status: 200,
          },
        ),
      ),
    );

    const provider = new OllamaEmbeddingProvider();

    await expect(provider.embed(["النص"])).rejects.toThrow(/embeddings array/);
  });

  it("rejects the wrong number of embeddings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            embeddings: [[0.1, 0.2]],
          }),
          {
            status: 200,
          },
        ),
      ),
    );

    const provider = new OllamaEmbeddingProvider({
      dimensions: 2,
    });

    await expect(provider.embed(["النص الأول", "النص الثاني"])).rejects.toThrow(
      /2 inputs/,
    );
  });

  it("rejects an incorrect vector dimension", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            embeddings: [[0.1, 0.2]],
          }),
          {
            status: 200,
          },
        ),
      ),
    );

    const provider = new OllamaEmbeddingProvider({
      dimensions: 4,
    });

    await expect(provider.embed(["النص"])).rejects.toThrow(/expected 4/);
  });

  it("rejects non-finite values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            embeddings: [[0.1, null, 0.3, 0.4]],
          }),
          {
            status: 200,
          },
        ),
      ),
    );

    const provider = new OllamaEmbeddingProvider({
      dimensions: 4,
    });

    await expect(provider.embed(["النص"])).rejects.toThrow(/non-finite/);
  });
});

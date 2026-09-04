import { describe, expect, it, vi } from "vitest";

const { mockedChat } = vi.hoisted(() => ({
  mockedChat: vi.fn(),
}));

vi.mock("ollama", () => ({
  default: {
    chat: mockedChat,
  },
}));

import { OllamaGenerationProvider } from "./ollama-provider";

describe("OllamaGenerationProvider", () => {
  it("sends system and user messages to Ollama", async () => {
    mockedChat.mockResolvedValue({
      message: {
        content: "الإجابة القانونية [1]",
      },
    });

    const provider = new OllamaGenerationProvider({
      model: "gemma4:cloud",
    });

    const result = await provider.generate({
      system: "أنت مساعد قانوني.",
      prompt: "ما هو قانون العمل؟",
    });

    expect(result.answer).toBe("الإجابة القانونية [1]");
    expect(result.metadata.model).toBe("gemma4:cloud");
    expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);

    expect(mockedChat).toHaveBeenCalledWith({
      model: "gemma4:cloud",
      messages: [
        {
          role: "system",
          content: "أنت مساعد قانوني.",
        },
        {
          role: "user",
          content: "ما هو قانون العمل؟",
        },
      ],
      stream: false,
      options: {},
    });
  });

  it("passes generation options", async () => {
    mockedChat.mockResolvedValue({
      message: {
        content: "الإجابة",
      },
    });

    const provider = new OllamaGenerationProvider({
      model: "gemma4:cloud",
    });

    await provider.generate({
      system: "system",
      prompt: "prompt",
      temperature: 0.2,
      maxTokens: 400,
    });

    expect(mockedChat).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          temperature: 0.2,
          num_predict: 400,
        },
      }),
    );
  });

  it("rejects an empty Ollama response", async () => {
    mockedChat.mockResolvedValue({
      message: {
        content: "   ",
      },
    });

    const provider = new OllamaGenerationProvider({
      model: "gemma4:cloud",
    });

    await expect(
      provider.generate({
        system: "system",
        prompt: "prompt",
      }),
    ).rejects.toThrow("Ollama generation returned an empty response.");
  });

  it("rejects an empty model", () => {
    expect(
      () =>
        new OllamaGenerationProvider({
          model: "   ",
        }),
    ).toThrow("Ollama generation model cannot be empty.");
  });
});

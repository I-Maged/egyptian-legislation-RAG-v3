import ollama from "ollama";

import type {
  GenerationProvider,
  GenerationProviderRequest,
  GenerationProviderResponse,
} from "./provider";

export interface OllamaProviderOptions {
  model: string;
}

export class OllamaGenerationProvider implements GenerationProvider {
  readonly model: string;

  constructor(options: OllamaProviderOptions) {
    const model = options.model.trim();

    if (!model) {
      throw new Error("Ollama generation model cannot be empty.");
    }

    this.model = model;
  }

  async generate(
    request: GenerationProviderRequest,
  ): Promise<GenerationProviderResponse> {
    const startedAt = Date.now();

    const response = await ollama.chat({
      model: this.model,

      messages: [
        ...(request.system
          ? [
              {
                role: "system" as const,
                content: request.system,
              },
            ]
          : []),

        {
          role: "user" as const,
          content: request.prompt,
        },
      ],

      stream: false,

      options: {
        ...(request.temperature !== undefined
          ? {
              temperature: request.temperature,
            }
          : {}),

        ...(request.maxTokens !== undefined
          ? {
              num_predict: request.maxTokens,
            }
          : {}),
      },
    });

    const answer = response.message?.content?.trim();

    if (!answer) {
      throw new Error("Ollama generation returned an empty response.");
    }

    return {
      answer,
      metadata: {
        model: response.model ?? this.model,
        durationMs: Date.now() - startedAt,
      },
    };
  }
}

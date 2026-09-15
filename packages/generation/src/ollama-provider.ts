import ollama, { Ollama } from "ollama";

import type {
  GenerationProvider,
  GenerationProviderRequest,
  GenerationProviderResponse,
} from "./provider";

export interface OllamaProviderOptions {
  model: string;
  /**
   * Ollama server base URL (e.g. http://ollama:11434).
   * Falls back to the `OLLAMA_HOST` env var, then to the `ollama`
   * package default (http://127.0.0.1:11434).
   * Must be configurable: inside Docker `localhost`/`127.0.0.1`
   * points at the web container, not the Ollama host.
   */
  host?: string;
}

function resolveHost(explicitHost?: string): string | undefined {
  const host = explicitHost ?? process.env.OLLAMA_HOST;

  return host?.trim() ? host.trim() : undefined;
}

export class OllamaGenerationProvider implements GenerationProvider {
  readonly model: string;

  private readonly client: Pick<typeof ollama, "chat">;

  constructor(options: OllamaProviderOptions) {
    const model = options.model.trim();

    if (!model) {
      throw new Error("Ollama generation model cannot be empty.");
    }

    this.model = model;

    const host = resolveHost(options.host);

    // Use the default singleton when no host is configured so existing
    // call sites and unit-test mocks keep working unchanged.
    this.client = host ? new Ollama({ host }) : ollama;
  }

  async generate(
    request: GenerationProviderRequest,
  ): Promise<GenerationProviderResponse> {
    const startedAt = Date.now();

    const response = await this.client.chat({
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
        model: this.model,
        durationMs: Date.now() - startedAt,
      },
    };
  }
}

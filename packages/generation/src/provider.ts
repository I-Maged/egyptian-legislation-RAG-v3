export interface GenerationProviderRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerationProviderMetadata {
  model: string;
  durationMs: number;
}

export interface GenerationProviderResponse {
  answer: string;
  metadata: GenerationProviderMetadata;
}

export interface GenerationProvider {
  readonly model: string;

  generate(
    request: GenerationProviderRequest,
  ): Promise<GenerationProviderResponse>;
}

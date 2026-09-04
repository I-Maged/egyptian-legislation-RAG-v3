import {
  getRagService as createRagService,
  type RagService,
} from "@egyptian-law/rag";

let service: RagService | undefined;

export function getRagService(): RagService {
  if (service) {
    return service;
  }

  service = createRagService();

  return service;
}

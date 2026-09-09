export type SuggestionFormState = {
  ok: boolean;
  error?: string;
  created?: boolean;
};

export const initialSuggestionFormState: SuggestionFormState = { ok: true, created: false };

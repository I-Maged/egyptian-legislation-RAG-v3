import { canonicalizeLabourLaw } from "./labour-law";
import { canonicalizeFinancialLaw } from "./financial-law";

import { canonicalizePersonalAffairsLaw } from "./personal-affairs";

export type SupportedLaw =
  | "labour_law"
  | "personal_affair_law"
  | "financial_law";

export const canonicalizers = {
  labour_law: canonicalizeLabourLaw,
  personal_affair_law: canonicalizePersonalAffairsLaw,
  financial_law: canonicalizeFinancialLaw,
} as const;

export function isSupportedLaw(law: string): law is SupportedLaw {
  return law in canonicalizers;
}

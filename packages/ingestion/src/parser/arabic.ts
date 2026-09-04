const EASTERN = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const DIGITS = "0123456789";

export function normalizeDigits(value: string): string {
  return [...value]
    .map((c) => {
      const e = EASTERN.indexOf(c);
      if (e >= 0) return DIGITS[e]!;
      const p = PERSIAN.indexOf(c);
      if (p >= 0) return DIGITS[p]!;
      return c;
    })
    .join("");
}

export function normalizeArabicText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[۰-۹٠-٩]/g, (c) => normalizeDigits(c))
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeForEmbedding(value: string): string {
  return normalizeArabicText(value);
}

export function firstInteger(value: string): number | null {
  const m = normalizeDigits(value).match(/\d+/);
  return m ? Number(m[0]) : null;
}

export function parseArticleNumber(raw: string): {
  number: number | null;
  suffix: string | null;
} {
  const cleaned = normalizeArabicText(raw);
  const m = cleaned.match(/^(?:مادة|المادة)\s*[:.)\-\s]*([0-9]+)(.*)$/i);
  if (!m) return { number: firstInteger(cleaned), suffix: null };
  const suffix = (m[2] ?? "")
    .replace(/[():،,.;\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { number: Number(m[1]), suffix: suffix || null };
}

export function canonicalArticleNumber(raw: string): string {
  const parsed = parseArticleNumber(raw);
  return parsed.number === null
    ? normalizeArabicText(raw)
    : String(parsed.number);
}

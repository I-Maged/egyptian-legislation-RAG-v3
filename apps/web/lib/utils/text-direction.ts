export function textDirection(value: string): "ltr" | "rtl" {
  for (const char of value) {
    if (/[\u0600-\u06FF]/.test(char)) return "rtl"; // Arabic
    if (/[A-Za-z]/.test(char)) return "ltr"; // English/Latin
  }
  return "rtl"; // empty / ambiguous keeps the current default
}

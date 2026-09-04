export function formatCitation(citation: Citation) {
  const law =
    citation.lawNumber && citation.year
      ? `${citation.lawName} رقم ${citation.lawNumber} لسنة ${citation.year}`
      : citation.lawName;
  const article = `المادة ${citation.articleNumber}`;
  const pages =
    citation.pageStart === null
      ? ""
      : citation.pageEnd === null || citation.pageEnd === citation.pageStart
        ? ` · صفحة ${citation.pageStart}`
        : ` · الصفحات ${citation.pageStart}-${citation.pageEnd}`;

  return `${law} · ${article}${pages}`;
}

export function formatLawName(citation: Pick<Citation, "lawName" | "lawNumber" | "year">) {
  return citation.lawNumber && citation.year
    ? `${citation.lawName} رقم ${citation.lawNumber} لسنة ${citation.year}`
    : citation.lawName;
}

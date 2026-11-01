"use client";

import { formatCitation } from "@/lib/utils/format-citation";
import { textDirection } from "@/lib/utils/text-direction";

export function MessageContent({
  content,
  citations,
  onCitationClick,
}: {
  content: string;
  citations?: Citation[];
  onCitationClick: (citation: Citation) => void;
}) {
  const direction = textDirection(content);

  const citationMap = new Map(
    (citations ?? []).map((citation) => [citation.id, citation]),
  );

  return (
    <div
      className="message-content"
      dir={direction}
      style={{ direction }}
    >
      {content.split(/(\[\d+\])/g).map((part, index) => {
        const citation = /^\[\d+\]$/.test(part)
          ? citationMap.get(part)
          : undefined;

        if (!citation) return part;

        return (
          <button
            type="button"
            key={index}
            className="citation-badge"
            title={formatCitation(citation)}
            onClick={() => onCitationClick(citation)}
          >
            {part}
          </button>
        );
      })}
    </div>
  );
}
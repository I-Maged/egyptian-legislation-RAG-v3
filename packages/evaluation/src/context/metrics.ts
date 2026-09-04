export function contextRecall(
  contextChunkIds: string[],
  relevantChunkIds: string[],
): number {
  if (relevantChunkIds.length === 0) {
    return 0;
  }

  const context = new Set(contextChunkIds);

  const relevantRetrieved = relevantChunkIds.filter((id) => context.has(id));

  return relevantRetrieved.length / relevantChunkIds.length;
}

export function contextPrecision(
  contextChunkIds: string[],
  relevantChunkIds: string[],
): number {
  if (contextChunkIds.length === 0) {
    return 0;
  }

  const relevant = new Set(relevantChunkIds);

  const relevantRetrieved = contextChunkIds.filter((id) => relevant.has(id));

  return relevantRetrieved.length / contextChunkIds.length;
}

export function contextHit(
  contextChunkIds: string[],
  relevantChunkIds: string[],
): boolean {
  const context = new Set(contextChunkIds);

  return relevantChunkIds.some((id) => context.has(id));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function averageContextRecall(
  values: Array<{
    contextChunkIds: string[];
    relevantChunkIds: string[];
  }>,
): number {
  return average(
    values.map((value) =>
      contextRecall(value.contextChunkIds, value.relevantChunkIds),
    ),
  );
}

export function averageContextPrecision(
  values: Array<{
    contextChunkIds: string[];
    relevantChunkIds: string[];
  }>,
): number {
  return average(
    values.map((value) =>
      contextPrecision(value.contextChunkIds, value.relevantChunkIds),
    ),
  );
}

export function contextHitRate(
  values: Array<{
    contextChunkIds: string[];
    relevantChunkIds: string[];
  }>,
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.filter((value) =>
      contextHit(value.contextChunkIds, value.relevantChunkIds),
    ).length / values.length
  );
}

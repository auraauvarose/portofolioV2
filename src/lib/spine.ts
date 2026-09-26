export function nodeFractions(
  railTop: number,
  railHeight: number,
  centres: number[],
): number[] {
  if (!Number.isFinite(railTop) || !(railHeight > 0)) {
    return centres.map(() => Number.NaN);
  }
  return centres.map((centre) => {
    if (!Number.isFinite(centre)) return Number.NaN;
    return Math.min(1, Math.max(0, (centre - railTop) / railHeight));
  });
}

export function litMask(progress: number, fractions: number[]): boolean[] {
  const p = Number.isFinite(progress) ? progress : 0;
  return fractions.map((fraction) => Number.isFinite(fraction) && p >= fraction);
}

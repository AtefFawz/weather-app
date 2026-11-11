/**
 * Tiny subsequence matcher for the command palette. Returns a score (higher is better) or null when
 * the query does not match. Rewards prefix and word-start matches and consecutive characters.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = normalize(query);
  const t = normalize(text);
  if (q.length === 0) return 0;

  let score = 0;
  let ti = 0;
  let streak = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;
    const atWordStart = found === 0 || t[found - 1] === " ";
    streak = found === ti ? streak + 1 : 0;
    score += 1 + streak * 2 + (atWordStart ? 4 : 0) - Math.min(3, (found - ti) * 0.25);
    ti = found + 1;
  }
  if (t.startsWith(q)) score += 6;
  return score - t.length * 0.02;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").trim();
}

export function fuzzyFilter<T>(items: readonly T[], query: string, getText: (item: T) => string): T[] {
  if (query.trim() === "") return [...items];
  return items
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter((entry): entry is { item: T; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

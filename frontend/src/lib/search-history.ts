export const SEARCH_HISTORY_KEY = 'local-search-history';
export const MAX_SEARCH_HISTORY = 6;

export function normalizeSearchHistoryText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function readSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, MAX_SEARCH_HISTORY);
  } catch {
    return [];
  }
}

export function writeSearchHistory(history: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_SEARCH_HISTORY)));
  } catch {}
}

export function rememberSearchQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return readSearchHistory();

  const normalized = normalizeSearchHistoryText(trimmed);
  const next = [
    trimmed,
    ...readSearchHistory().filter((item) => normalizeSearchHistoryText(item) !== normalized),
  ].slice(0, MAX_SEARCH_HISTORY);

  writeSearchHistory(next);
  return next;
}

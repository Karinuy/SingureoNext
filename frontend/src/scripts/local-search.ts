import { renderPostList } from '@/scripts/render-post-list';
import { showToast } from '@/scripts/feedback';
import { searchPosts } from '@/api/search';

const SEARCH_HISTORY_KEY = 'local-search-history';
const MAX_SEARCH_HISTORY = 6;

function readSearchHistory() {
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

function writeSearchHistory(history: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_SEARCH_HISTORY)));
  } catch {}
}

function replaceSearchQuery(value: string) {
  const url = new URL(window.location.href);
  if (value.trim()) url.searchParams.set('q', value);
  else url.searchParams.delete('q');
  window.history.replaceState({}, '', url.toString());
}

export function initLocalSearch() {
  const mount = document.querySelector('[data-local-search]');
  if (!(mount instanceof HTMLElement) || mount.dataset.bound === 'true') return;
  mount.dataset.bound = 'true';

  const form = mount.querySelector('[data-local-search-form]');
  const input = mount.querySelector('[data-local-search-input]');
  const clearButton = mount.querySelector('[data-local-search-clear]');
  const historySection = mount.querySelector('[data-local-search-history-section]');
  const historyContainer = mount.querySelector('[data-local-search-history]');
  const historyClear = mount.querySelector('[data-local-search-history-clear]');
  const resultsContainer = mount.querySelector('[data-local-search-results]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(input instanceof HTMLInputElement) ||
    !(clearButton instanceof HTMLButtonElement) ||
    !(historySection instanceof HTMLElement) ||
    !(historyContainer instanceof HTMLElement) ||
    !(historyClear instanceof HTMLButtonElement) ||
    !(resultsContainer instanceof HTMLElement)
  ) {
    return;
  }

  let searchToken = 0;
  let lastResultQuery: string | undefined;

  const syncClear = () => {
    clearButton.classList.toggle('hidden', !input.value.trim());
  };

  const renderHistory = (history: string[]) => {
    historySection.classList.toggle('hidden', history.length === 0);
    historyContainer.innerHTML = history
      .map(
        (item) => `
          <button
            type="button"
            class="inline-flex items-center rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3 py-1 text-sm text-[rgb(var(--color-text-muted))]"
            data-history-item="${item.replaceAll('"', '&quot;')}"
          >
            ${item}
          </button>`
      )
      .join('');
  };

  const rememberQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
    const next = [trimmed, ...readSearchHistory().filter((item) => item.toLowerCase().replace(/\s+/g, ' ') !== normalized)].slice(
      0,
      MAX_SEARCH_HISTORY
    );
    writeSearchHistory(next);
    renderHistory(next);
  };

  const runSearch = async (value: string) => {
    const token = ++searchToken;
    const query = value.trim();
    if (!query) {
      renderPostList(resultsContainer, [], { emptyMessage: '' });
      lastResultQuery = undefined;
      return;
    }

    try {
      const result = await searchPosts(query);
      if (token !== searchToken) return;
      renderPostList(resultsContainer, result.items);
      if (lastResultQuery !== query) {
        showToast(result.total ? `找到 ${result.total} 条结果` : '没有匹配结果，换个关键词试试。', result.total ? 'success' : 'info');
        lastResultQuery = query;
      }
    } catch {
      if (token === searchToken) showToast('搜索请求失败', 'error');
    }
  };

  const submit = (value: string, remember = true) => {
    const query = value.trim();
    replaceSearchQuery(query);
    if (!query) {
      renderPostList(resultsContainer, [], { emptyMessage: '' });
      lastResultQuery = undefined;
      return;
    }
    if (remember) rememberQuery(query);
    void runSearch(query);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit(input.value);
  });

  input.addEventListener('input', () => {
    syncClear();
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    syncClear();
    replaceSearchQuery('');
    renderPostList(resultsContainer, [], { emptyMessage: '' });
  });

  historyClear.addEventListener('click', () => {
    writeSearchHistory([]);
    renderHistory([]);
  });

  historyContainer.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-history-item]') : null;
    if (!(button instanceof HTMLButtonElement)) return;
    const query = button.dataset.historyItem || '';
    input.value = query;
    syncClear();
    submit(query, false);
  });

  const urlQuery = new URLSearchParams(window.location.search).get('q');
  if (urlQuery) input.value = urlQuery;
  syncClear();
  renderHistory(readSearchHistory());
  if (urlQuery) submit(urlQuery, false);
}

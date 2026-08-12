import { searchPosts } from '@/lib/search-client';
import { renderPostList } from '@/scripts/render-post-list';
import type { AdConfig } from '@/lib/post-list-ads';

let searchToken = 0;

function currentQuery() {
  return new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
}

function readAdConfig(root: HTMLElement): AdConfig | undefined {
  const raw = root.dataset.searchResultsAds;
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    return parsed as AdConfig;
  } catch {
    return undefined;
  }
}

export function initSearchResultsPage() {
  document.querySelectorAll('[data-search-results-page]').forEach((root) => {
    if (!(root instanceof HTMLElement)) return;

    const title = root.querySelector('[data-search-results-title]');
    const status = root.querySelector('[data-search-results-status]');
    const list = root.querySelector('[data-search-results-list]');
    if (!(title instanceof HTMLElement) || !(status instanceof HTMLElement) || !(list instanceof HTMLElement)) return;

    const ads = readAdConfig(root);
    const query = currentQuery();
    const token = ++searchToken;
    list.innerHTML = '';

    if (!query) {
      title.textContent = '搜索结果';
      status.textContent = '';
      return;
    }

    title.textContent = `搜索：${query}`;
    status.textContent = '';

    void searchPosts(query)
      .then((result) => {
        if (token !== searchToken) return;

        renderPostList(list, result.items, { ads });
        if (!result.total) {
          status.textContent = '0 个结果';
          return;
        }

        status.textContent = `${result.total} 个结果`;
      })
      .catch(() => {
        if (token !== searchToken) return;
        renderPostList(list, []);
        status.textContent = '0 个结果';
      });
  });
}

import { readSearchHistory, rememberSearchQuery, writeSearchHistory } from '@/lib/search-history';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function currentQuery() {
  return new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
}

function searchUrl(query: string) {
  const url = new URL('/search', window.location.origin);
  if (query.trim()) url.searchParams.set('q', query.trim());
  return `${url.pathname}${url.search}`;
}

function setPanelOpen(root: HTMLElement, open: boolean) {
  const panel = root.querySelector('[data-nav-search-panel]');
  if (!(panel instanceof HTMLElement)) return;

  if (!open) {
    panel.classList.add('hidden');
    return;
  }

  const hasHistory = renderHistory(root);
  panel.classList.toggle('hidden', !hasHistory);
}

function syncClearButton(root: HTMLElement) {
  const input = root.querySelector('[data-nav-search-input]');
  const clearButton = root.querySelector('[data-nav-search-clear]');
  if (!(input instanceof HTMLInputElement) || !(clearButton instanceof HTMLButtonElement)) return;

  clearButton.classList.toggle('hidden', !input.value.trim());
  clearButton.classList.toggle('flex', Boolean(input.value.trim()));
}

function renderHistory(root: HTMLElement) {
  const historyContainer = root.querySelector('[data-nav-search-history]');
  const clearButton = root.querySelector('[data-nav-search-history-clear]');
  if (!(historyContainer instanceof HTMLElement)) return false;

  const history = readSearchHistory();
  historyContainer.innerHTML = history
    .map(
      (item) => `
        <button
          type="button"
          class="flex min-w-0 items-center rounded-lg px-2 py-1.5 text-left text-sm text-[rgb(var(--color-text)_/_0.78)] hover:bg-[rgb(var(--color-surface-muted))]"
          data-nav-search-history-item="${escapeHtml(item)}"
        >
          <span class="truncate">${escapeHtml(item)}</span>
        </button>`
    )
    .join('');

  if (clearButton instanceof HTMLButtonElement) {
    clearButton.classList.toggle('hidden', history.length === 0);
  }

  return history.length > 0;
}

function submitSearch(root: HTMLElement, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  rememberSearchQuery(trimmed);
  window.location.href = searchUrl(trimmed);
}

function closeMobileSearch(panel: HTMLElement) {
  const shell = panel.closest('[data-mobile-nav-shell]');
  if (!(shell instanceof HTMLElement)) return;

  shell.querySelectorAll('[data-mobile-nav-default]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.classList.remove('opacity-0', 'pointer-events-none');
  });

  panel.classList.add('hidden');
  panel.classList.remove('opacity-100', 'pointer-events-auto');
  panel.classList.add('opacity-0', 'pointer-events-none');
  const root = panel.querySelector('[data-nav-search]');
  if (root instanceof HTMLElement) setPanelOpen(root, false);
}

function openMobileSearch(button: HTMLButtonElement) {
  const shell = button.closest('[data-mobile-nav-shell]');
  if (!(shell instanceof HTMLElement)) return;

  const panel = shell.querySelector('[data-mobile-search-panel]');
  if (!(panel instanceof HTMLElement)) return;

  shell.querySelectorAll('[data-mobile-nav-default]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.classList.add('opacity-0', 'pointer-events-none');
  });

  panel.classList.remove('hidden');
  panel.classList.remove('opacity-0', 'pointer-events-none');
  panel.classList.add('opacity-100', 'pointer-events-auto');

  const input = panel.querySelector('[data-nav-search-input]');
  if (input instanceof HTMLInputElement) {
    input.value = currentQuery();
    syncClearButton(panel);
    window.requestAnimationFrame(() => {
      input.focus();
      const root = input.closest('[data-nav-search]');
      if (root instanceof HTMLElement) setPanelOpen(root, true);
    });
  }
}

function bindSearchRoot(root: HTMLElement) {
  if (root.dataset.bound === 'true') return;
  root.dataset.bound = 'true';

  const form = root instanceof HTMLFormElement ? root : root.querySelector('form');
  const input = root.querySelector('[data-nav-search-input]');
  const clearButton = root.querySelector('[data-nav-search-clear]');
  const historyContainer = root.querySelector('[data-nav-search-history]');
  const historyClear = root.querySelector('[data-nav-search-history-clear]');
  const closeButton = root.querySelector('[data-nav-search-mobile-close]');

  if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement)) return;

  input.value = currentQuery();
  syncClearButton(root);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitSearch(root, input.value);
  });

  input.addEventListener('focus', () => setPanelOpen(root, true));
  input.addEventListener('input', () => syncClearButton(root));

  clearButton?.addEventListener('click', () => {
    input.value = '';
    syncClearButton(root);
    input.focus();
  });

  historyContainer?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-nav-search-history-item]') : null;
    if (!(target instanceof HTMLButtonElement)) return;
    const query = target.dataset.navSearchHistoryItem ?? '';
    input.value = query;
    syncClearButton(root);
    submitSearch(root, query);
  });

  historyClear?.addEventListener('click', () => {
    writeSearchHistory([]);
    setPanelOpen(root, false);
  });

  closeButton?.addEventListener('click', () => {
    const panel = closeButton.closest('[data-mobile-search-panel]');
    if (panel instanceof HTMLElement) closeMobileSearch(panel);
  });
}

function syncAllInputs() {
  const query = currentQuery();
  document.querySelectorAll('[data-nav-search]').forEach((root) => {
    const input = root.querySelector('[data-nav-search-input]');
    if (root instanceof HTMLElement && input instanceof HTMLInputElement) {
      input.value = query;
      syncClearButton(root);
    }
  });
}

export function initNavSearch() {
  document.querySelectorAll('[data-nav-search]').forEach((root) => {
    if (root instanceof HTMLElement) bindSearchRoot(root);
  });

  syncAllInputs();

  const windowWithKey = window as Window & { __navSearchBound?: boolean };
  if (windowWithKey.__navSearchBound) return;
  windowWithKey.__navSearchBound = true;

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const openButton = target.closest('[data-nav-search-mobile-open]');
    if (openButton instanceof HTMLButtonElement) {
      openMobileSearch(openButton);
      return;
    }

    document.querySelectorAll('[data-nav-search]').forEach((root) => {
      if (!(root instanceof HTMLElement) || root.contains(target)) return;
      setPanelOpen(root, false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    document.querySelectorAll('[data-nav-search]').forEach((root) => {
      if (root instanceof HTMLElement) setPanelOpen(root, false);
    });

    document.querySelectorAll('[data-mobile-search-panel]').forEach((panel) => {
      if (panel instanceof HTMLElement && !panel.classList.contains('hidden')) closeMobileSearch(panel);
    });
  });

  document.addEventListener('astro:page-load', syncAllInputs);
}

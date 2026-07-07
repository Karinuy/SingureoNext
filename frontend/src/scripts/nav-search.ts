const SEARCH_DIALOG_ID = 'nav-search-dialog';

function currentQuery() {
  return new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
}

function searchUrl(query: string) {
  const url = new URL('/search', window.location.origin);
  const trimmed = query.trim();
  if (trimmed) url.searchParams.set('q', trimmed);
  return `${url.pathname}${url.search}`;
}

function getToggle() {
  const toggle = document.getElementById(SEARCH_DIALOG_ID);
  return toggle instanceof HTMLInputElement ? toggle : null;
}

function getForm() {
  const form = document.querySelector('[data-nav-search-form]');
  return form instanceof HTMLFormElement ? form : null;
}

function getInput() {
  const input = document.querySelector('[data-nav-search-input]');
  return input instanceof HTMLInputElement ? input : null;
}

function getClearButton() {
  const button = document.querySelector('[data-nav-search-clear]');
  return button instanceof HTMLButtonElement ? button : null;
}

function syncClearButton() {
  const input = getInput();
  const clearButton = getClearButton();
  if (!input || !clearButton) return;

  const hasValue = Boolean(input.value.trim());
  clearButton.hidden = !hasValue;
}

function syncInputValue() {
  const input = getInput();
  if (!input) return;
  input.value = currentQuery();
  syncClearButton();
}

function focusSearchInput() {
  const input = getInput();
  if (!input) return;

  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

function openSearchDialog() {
  const toggle = getToggle();
  if (!toggle) return;

  syncInputValue();
  toggle.checked = true;
  focusSearchInput();
}

function closeSearchDialog() {
  const toggle = getToggle();
  if (toggle) toggle.checked = false;
}

function submitSearch() {
  const input = getInput();
  const query = input?.value.trim() ?? '';
  if (!query) {
    input?.focus();
    return;
  }
  window.location.href = searchUrl(query);
}

function bindSearchForm() {
  const form = getForm();
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const input = getInput();
  const clearButton = getClearButton();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitSearch();
  });

  input?.addEventListener('input', syncClearButton);

  clearButton?.addEventListener('click', () => {
    const nextInput = getInput();
    if (!nextInput) return;
    nextInput.value = '';
    syncClearButton();
    nextInput.focus();
  });

  syncInputValue();
}

export function initNavSearch() {
  bindSearchForm();

  const toggle = getToggle();
  if (toggle && toggle.dataset.bound !== 'true') {
    toggle.dataset.bound = 'true';
    toggle.addEventListener('change', () => {
      if (!toggle.checked) return;
      syncInputValue();
      focusSearchInput();
    });
  }

  const windowWithKey = window as Window & { __navSearchDialogBound?: boolean };
  if (windowWithKey.__navSearchDialogBound) {
    syncInputValue();
    return;
  }
  windowWithKey.__navSearchDialogBound = true;

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const openButton = target?.closest('[data-nav-search-open]');
    if (openButton instanceof HTMLButtonElement) openSearchDialog();
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearchDialog();
      return;
    }

    if (event.key === 'Escape' && getToggle()?.checked) {
      closeSearchDialog();
    }
  });

  document.addEventListener('astro:page-load', () => {
    bindSearchForm();
    syncInputValue();
  });
}

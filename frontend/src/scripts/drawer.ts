const DRAWER_KEY = '__siteDrawerController';
const DRAWER_ANIMATION_MS = 430;

function hasActiveOverlay() {
  return Array.from(document.querySelectorAll('[data-overlay-shell]')).some((node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (node instanceof HTMLDialogElement) {
      return node.open || node.dataset.state === 'opening' || node.dataset.state === 'closing';
    }
    return !node.classList.contains('hidden') && node.dataset.state !== 'closed';
  });
}

function syncOverlayState() {
  const active = hasActiveOverlay();
  document.documentElement.classList.toggle('overflow-hidden', active);
}

export function initDrawers() {
  const windowWithState = window as Window & {
    [DRAWER_KEY]?: {
      bound: boolean;
      timers: WeakMap<HTMLDialogElement, number>;
    };
  };

  if (windowWithState[DRAWER_KEY]?.bound) {
    syncOverlayState();
    return;
  }

  const state = {
    bound: true,
    timers: new WeakMap<HTMLDialogElement, number>(),
  };

  const openDrawer = (drawer: HTMLDialogElement) => {
    const timer = state.timers.get(drawer);
    if (typeof timer === 'number') {
      window.clearTimeout(timer);
    }

    drawer.classList.remove('hidden');
    drawer.dataset.state = 'closed';
    if (!drawer.open) drawer.showModal();

    requestAnimationFrame(() => {
      if (!drawer.open) return;
      drawer.dataset.state = 'opening';
      requestAnimationFrame(() => {
        if (drawer.open) drawer.dataset.state = 'open';
      });
    });

    syncOverlayState();
  };

  const closeDrawer = (drawer: HTMLDialogElement, immediate = false) => {
    const timer = state.timers.get(drawer);
    if (typeof timer === 'number') {
      window.clearTimeout(timer);
    }

    const finalize = () => {
      drawer.dataset.state = 'closed';
      if (drawer.open) drawer.close();
      drawer.classList.add('hidden');
      syncOverlayState();
    };

    if (!drawer.open || immediate) {
      finalize();
      return;
    }

    drawer.dataset.state = 'closing';
    const nextTimer = window.setTimeout(finalize, DRAWER_ANIMATION_MS);
    state.timers.set(drawer, nextTimer);
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const openButton = target.closest('[data-drawer-open]');
    if (openButton instanceof HTMLElement) {
      const drawer = document.getElementById(openButton.dataset.drawerOpen || '');
      if (drawer instanceof HTMLDialogElement && drawer.matches('[data-drawer-root]')) {
        openDrawer(drawer);
      }
      return;
    }

    const closeButton = target.closest('[data-drawer-close]');
    if (closeButton) {
      const drawer = closeButton.closest('[data-drawer-root]');
      if (drawer instanceof HTMLDialogElement) closeDrawer(drawer);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('[data-drawer-root]').forEach((drawer) => {
      if (drawer instanceof HTMLDialogElement && drawer.open) closeDrawer(drawer);
    });
  });

  document.addEventListener('cancel', (event) => {
    const drawer = event.target;
    if (!(drawer instanceof HTMLDialogElement) || !drawer.matches('[data-drawer-root]')) return;
    event.preventDefault();
    closeDrawer(drawer);
  });

  document.addEventListener('close', (event) => {
    const drawer = event.target;
    if (!(drawer instanceof HTMLDialogElement) || !drawer.matches('[data-drawer-root]')) return;
    drawer.dataset.state = 'closed';
    drawer.classList.add('hidden');
    syncOverlayState();
  });

  document.addEventListener('astro:before-swap', () => {
    document.querySelectorAll('[data-drawer-root]').forEach((drawer) => {
      if (drawer instanceof HTMLDialogElement) closeDrawer(drawer, true);
    });
  });

  windowWithState[DRAWER_KEY] = state;
  syncOverlayState();
}

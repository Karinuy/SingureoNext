import { site } from '@/config/site';

type ArtalkModule = {
  default: {
    loadCountWidget: (config: Record<string, unknown>) => void;
  };
};

type ArtalkGlobalState = Window & {
  __artalkPreloadPromise?: Promise<unknown>;
  __artalkCountWidgetBound?: boolean;
};

async function getArtalk() {
  const globalState = window as ArtalkGlobalState;
  const mod = await (globalState.__artalkPreloadPromise ?? import('artalk'));
  return (mod as unknown as ArtalkModule).default;
}

export async function loadArtalkCountWidget() {
  if (!site.artalk.enabled) return;

  const server = site.artalk.server.trim();
  if (!server) return;

  if (
    !document.querySelector(
      '.artalk-pv-count[data-page-key], .artalk-comment-count[data-page-key]'
    )
  ) {
    return;
  }

  const Artalk = await getArtalk();
  Artalk.loadCountWidget({
    server,
    site: site.name,
    pvEl: '.artalk-pv-count[data-page-key]',
    countEl: '.artalk-comment-count[data-page-key]',
    statPageKeyAttr: 'data-page-key',
  });
}

export function initArtalkCountWidget() {
  const globalState = window as ArtalkGlobalState;
  if (globalState.__artalkCountWidgetBound) {
    void loadArtalkCountWidget();
    return;
  }

  globalState.__artalkCountWidgetBound = true;
  void loadArtalkCountWidget();
  document.addEventListener('astro:page-load', () => {
    void loadArtalkCountWidget();
  });
}

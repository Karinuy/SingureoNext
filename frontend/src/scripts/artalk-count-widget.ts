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

function readArtalkCountWidgetConfig() {
  const dataset = document.body?.dataset;
  return {
    enabled: dataset?.artalkEnabled === 'true',
    server: dataset?.artalkServer?.trim() ?? '',
    site: dataset?.artalkSite?.trim() ?? '',
  };
}

export async function loadArtalkCountWidget() {
  const config = readArtalkCountWidgetConfig();
  if (!config.enabled) return;

  if (!config.server || !config.site) return;

  if (
    !document.querySelector(
      '.artalk-pv-count[data-page-key], .artalk-comment-count[data-page-key]'
    )
  ) {
    return;
  }

  const Artalk = await getArtalk();
  Artalk.loadCountWidget({
    server: config.server,
    site: config.site,
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

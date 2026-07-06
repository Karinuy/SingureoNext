import LazyLoad, { type ILazyLoadInstance } from 'vanilla-lazyload';

type LazyLoadWindow = Window & {
  __singureoLazyLoad?: ILazyLoadInstance;
  __singureoLazyLoadBound?: boolean;
};

function getLazyLoadInstance() {
  const globalWindow = window as LazyLoadWindow;
  globalWindow.__singureoLazyLoad ??= new LazyLoad({
    elements_selector: '.lazy',
    threshold: 0,
  });
  return globalWindow.__singureoLazyLoad;
}

export function updateLazyImages() {
  getLazyLoadInstance().update();
}

export function initLazyImages() {
  const globalWindow = window as LazyLoadWindow;
  updateLazyImages();

  if (globalWindow.__singureoLazyLoadBound) return;
  document.addEventListener('astro:page-load', updateLazyImages);
  document.addEventListener('singureo:lazyload-update', updateLazyImages);
  globalWindow.__singureoLazyLoadBound = true;
}

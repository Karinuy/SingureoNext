import { slugifySegment } from '@/lib/slug';
import { updateLazyImages } from '@/scripts/lazyload';
import { loadArtalkCountWidget } from '@/scripts/artalk-count-widget';
import type { PostCardData } from '@/types/post-card';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderArtalkStatBadge(pageKey: string) {
  const template = document.getElementById('artalk-stat-badge-template');
  if (!(template instanceof HTMLTemplateElement)) return '';

  const node = template.content.firstElementChild?.cloneNode(true);
  if (!(node instanceof HTMLElement)) return '';

  node.querySelectorAll('.artalk-pv-count, .artalk-comment-count').forEach((el) => {
    if (el instanceof HTMLElement) el.dataset.pageKey = pageKey;
  });
  node.classList.add('right-1.5', 'top-1.5');
  return node.outerHTML;
}

function renderPostCard(item: PostCardData, options?: { hideCoverPlaceholder?: boolean }) {
  const metaClass =
    'inline-flex shrink-0 items-center rounded-lg bg-[rgb(var(--color-primary))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--color-primary-foreground))]';
  const categories = item.categories;
  const cover = item.cover
    ? `
      <img
        data-src="${escapeHtml(item.cover)}"
        alt="${escapeHtml(item.title)}"
        class="lazy block h-full w-full object-cover"
        decoding="async"
      />`
    : options?.hideCoverPlaceholder
      ? ''
      : '<span class="text-sm text-[rgb(var(--color-text-muted))]">无封面</span>';

  const tags = item.tags
    .map(
      (tag) => `
      <a
        href="/tag/${slugifySegment(tag)}/"
        class="${metaClass}"
        data-dark-dim
      >
        #${escapeHtml(tag)}
      </a>`
    )
    .join('');
  const categoriesMarkup = categories
    .map(
      (category) => `
                <a href="/category/${slugifySegment(category)}/" class="${metaClass}" data-dark-dim>
                  ${escapeHtml(category)}
                </a>`
    )
    .join('');
  const tagRow = tags
    ? `
            <div class="min-w-0 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div class="flex w-max min-w-full flex-nowrap gap-1.5">
                ${tags}
              </div>
            </div>`
    : '';

  return `
    <div class="h-full">
      <article class="flex h-full flex-col overflow-hidden rounded-xl border border-[rgb(var(--color-border)_/_0.9)] bg-white dark:bg-black">
        <a
          href="${escapeHtml(item.href)}"
          class="relative block aspect-[3/4] overflow-hidden border-b border-[rgb(var(--color-border)_/_0.9)] bg-gray-100 no-underline dark:bg-neutral-900"
          aria-label="${escapeHtml(item.title)}"
        >
          <div class="flex h-full w-full items-center justify-center">
            ${cover}
          </div>
          ${renderArtalkStatBadge(item.href)}
        </a>

        <div class="flex min-w-0 flex-1 flex-col gap-2 p-3">
          <a href="${escapeHtml(item.href)}" class="block no-underline" aria-label="${escapeHtml(item.title)}">
            <h3 class="line-clamp-2 text-[0.95rem] font-semibold leading-[1.35] tracking-[-0.02em] text-[rgb(var(--color-text)_/_0.82)] sm:text-[1.02rem]">
              ${escapeHtml(item.title)}
            </h3>
          </a>

          <div class="mt-auto grid min-w-0 gap-1.5 overflow-hidden">
            <div class="min-w-0 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div class="flex w-max min-w-full flex-nowrap gap-1.5">
${categoriesMarkup}
              </div>
            </div>
${tagRow}
          </div>
        </div>
      </article>
    </div>`;
}

export function renderPostList(
  container: HTMLElement,
  items: PostCardData[],
  options?: { hideCoverPlaceholder?: boolean }
) {
  if (!items.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="post-list-grid">
      ${items.map((item) => renderPostCard(item, options)).join('')}
    </div>
  `;
  updateLazyImages();
  void loadArtalkCountWidget();
}

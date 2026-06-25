import { slugifySegment } from '@/lib/slug';
import type { PostCardData } from '@/types/post-card';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderPostCard(item: PostCardData, options?: { hideCoverPlaceholder?: boolean }) {
  const metaClass =
    'inline-flex shrink-0 items-center rounded-lg bg-[rgb(var(--color-primary))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--color-primary-foreground))]';
  const cover = item.cover
    ? `
      <img
        src="${escapeHtml(item.cover)}"
        alt="${escapeHtml(item.title)}"
        class="block h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />`
    : options?.hideCoverPlaceholder
      ? ''
      : '<span class="text-sm text-[rgb(var(--color-text-muted))]">无封面</span>';

  const tags = item.tags
    .slice(0, 2)
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

  return `
    <div class="h-full">
      <article class="flex h-full flex-col overflow-hidden rounded-xl border border-[rgb(var(--color-border)_/_0.9)] bg-white dark:bg-black">
        <a
          href="${escapeHtml(item.href)}"
          class="block aspect-[3/4] overflow-hidden border-b border-[rgb(var(--color-border)_/_0.9)] bg-gray-100 no-underline dark:bg-neutral-900"
          aria-label="${escapeHtml(item.title)}"
        >
          <div class="flex h-full w-full items-center justify-center">
            ${cover}
          </div>
        </a>

        <div class="flex min-w-0 flex-1 flex-col gap-2 p-3">
          <a href="${escapeHtml(item.href)}" class="block no-underline" aria-label="${escapeHtml(item.title)}">
            <h3 class="line-clamp-2 text-[0.95rem] font-semibold leading-[1.35] tracking-[-0.02em] text-[rgb(var(--color-text)_/_0.82)] sm:text-[1.02rem]">
              ${escapeHtml(item.title)}
            </h3>
          </a>

          <div class="mt-auto overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div class="flex w-max min-w-full flex-nowrap gap-1.5">
              <a href="/category/${slugifySegment(item.category)}/" class="${metaClass}" data-dark-dim>
                ${escapeHtml(item.category)}
              </a>
              ${tags}
            </div>
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
    <div class="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      ${items.map((item) => renderPostCard(item, options)).join('')}
    </div>
  `;
}

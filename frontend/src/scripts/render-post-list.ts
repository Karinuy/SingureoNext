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
  const cover = item.cover
    ? `
      <img
        src="${escapeHtml(item.cover)}"
        alt="${escapeHtml(item.title)}"
        class="block max-h-full max-w-full rounded-xl object-contain"
        loading="lazy"
        decoding="async"
      />`
    : options?.hideCoverPlaceholder
      ? ''
      : '<div class="flex h-full w-full items-center justify-center rounded-xl text-sm text-[rgb(var(--color-text-muted))]">无封面</div>';

  const background = item.cover
    ? `
      <img
        src="${escapeHtml(item.cover)}"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 h-full w-full scale-105 object-cover blur-lg brightness-[0.82] contrast-[0.92] dark:brightness-[0.72]"
        loading="lazy"
        decoding="async"
      />
      <div class="absolute inset-0 bg-white/15 dark:bg-black/15"></div>
      <div class="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/55 via-black/15 to-transparent"></div>`
    : '<div class="absolute inset-0 bg-gray-100 dark:bg-neutral-800"></div>';

  const chips = item.tags
    .slice(0, 2)
    .map((tag) => `<a href="/tag/${slugifySegment(tag)}/" class="max-w-[45%] shrink-0 truncate no-underline text-white">#${escapeHtml(tag)}</a>`)
    .join('');

  return `
    <div class="h-full">
      <div class="group relative aspect-[5/7] overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-900">
        <div class="absolute inset-0">${background}</div>
        <div class="relative z-10 flex h-full flex-col p-3">
          <a href="${escapeHtml(item.href)}" class="flex min-h-0 flex-1 items-center justify-center">
            ${cover}
          </a>
          <div class="space-y-2.5 px-1 pb-1 pt-3">
            <div class="hidden min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden whitespace-nowrap text-[0.72rem] tracking-[0.01em] text-white sm:flex">
              <a href="/category/${slugifySegment(item.category)}/" class="max-w-[50%] shrink truncate no-underline font-medium text-white">${escapeHtml(item.category)}</a>
              ${chips}
            </div>
            <a href="${escapeHtml(item.href)}" class="block no-underline text-inherit">
              <h3 class="line-clamp-2 text-[0.9rem] font-semibold leading-[1.32] tracking-[-0.02em] text-white sm:text-[1.02rem]">
                ${escapeHtml(item.title)}
              </h3>
            </a>
          </div>
        </div>
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]"></div>
        </div>
      </div>
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
    <div class="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-3">
      ${items.map((item) => renderPostCard(item, options)).join('')}
    </div>
  `;
}

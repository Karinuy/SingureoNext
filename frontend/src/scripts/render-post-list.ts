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
  const tag = item.tags[0];
  const cover = item.cover
    ? `
      <img
        src="${escapeHtml(item.cover)}"
        alt="${escapeHtml(item.title)}"
        class="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />`
    : options?.hideCoverPlaceholder
      ? ''
      : '<span class="text-sm text-[rgb(var(--color-text-muted))]">无封面</span>';

  const tagLabel = tag
    ? `
      <a
        href="/tag/${slugifySegment(tag)}/"
        class="pointer-events-auto inline-flex h-6 max-w-[48%] items-center truncate rounded-md border border-white/35 bg-black/45 px-2 text-[10px] font-semibold leading-none tracking-wide text-white shadow-sm backdrop-blur-md"
      >
        #${escapeHtml(tag)}
      </a>`
    : '';

  return `
    <div class="h-full">
      <article class="group flex h-full flex-col gap-3">
        <div class="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 shadow-sm dark:bg-neutral-900">
          <a href="${escapeHtml(item.href)}" class="block h-full w-full no-underline" aria-label="${escapeHtml(item.title)}">
            <div class="flex h-full w-full items-center justify-center">
              ${cover}
            </div>
          </a>

          <div class="pointer-events-none absolute inset-x-1.5 top-1.5 hidden items-start justify-between gap-2 sm:flex">
            <a
              href="/category/${slugifySegment(item.category)}/"
              class="pointer-events-auto inline-flex h-6 max-w-[48%] items-center truncate rounded-md border border-white/35 bg-black/45 px-2 text-[10px] font-semibold leading-none tracking-wide text-white shadow-sm backdrop-blur-md"
            >
              ${escapeHtml(item.category)}
            </a>
            ${tagLabel}
          </div>

          <a
            href="${escapeHtml(item.href)}"
            class="absolute inset-x-1.5 bottom-1.5 block rounded-md border border-white/35 bg-black/45 px-2.5 py-2 text-white shadow-sm backdrop-blur-md no-underline"
          >
            <h3 class="line-clamp-2 text-[0.9rem] font-semibold leading-[1.35] tracking-[-0.02em] text-white sm:text-[0.98rem]">
              ${escapeHtml(item.title)}
            </h3>
          </a>
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

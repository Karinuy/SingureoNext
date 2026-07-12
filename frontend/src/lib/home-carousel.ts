import { getCollection } from 'astro:content';
import { site } from '@/config/site';
import { getEntrySlug, getPosts } from '@/lib/content';

export type HomeCarouselSlide = {
  title: string;
  href: string;
  image: string;
  color: string;
  rgb: string;
};

export type HomeCarouselData = {
  tag: string;
  items: HomeCarouselSlide[];
};

const THEME_COLOR = { hex: '#525252', rgb: '82 82 82' };

function normalizeId(value: string | number) {
  return String(value).trim();
}

function matchById<T extends { id: string; data: { abbrlink?: string | number | null } }>(
  entries: T[],
  uniqueId: string
) {
  return (
    entries.find((entry) => String(entry.data.abbrlink ?? '') === uniqueId) ??
    entries.find((entry) => entry.id === uniqueId) ??
    entries.find((entry) => entry.id.endsWith(`/${uniqueId}`))
  );
}

export async function resolveHomeCarousel(
  config: typeof site.home.carousel = site.home.carousel
): Promise<HomeCarouselData> {
  const tag = config.tag?.trim() || '站点推荐';
  const ids = (config.posts ?? []).map(normalizeId).filter(Boolean);
  if (!ids.length) return { tag, items: [] };

  const [posts, docs] = await Promise.all([
    getPosts(),
    getCollection('docs', ({ data }) => !data.draft),
  ]);

  const items: HomeCarouselSlide[] = [];

  for (const id of ids) {
    const post = matchById(posts, id);
    if (post) {
      const cover = post.data.cover?.trim();
      if (!cover) {
        console.warn(`[home-carousel] 文章缺少封面，已跳过: ${id}`);
        continue;
      }
      items.push({
        title: post.data.title,
        href: `/posts/${getEntrySlug(post)}/`,
        image: cover,
        color: THEME_COLOR.hex,
        rgb: THEME_COLOR.rgb,
      });
      continue;
    }

    const doc = matchById(docs, id);
    if (doc) {
      const cover = doc.data.cover?.trim();
      if (!cover) {
        console.warn(`[home-carousel] 文档缺少封面，已跳过: ${id}`);
        continue;
      }
      const slug = String(doc.data.abbrlink ?? doc.id);
      items.push({
        title: doc.data.title,
        href: `/docs/${encodeURIComponent(slug)}/`,
        image: cover,
        color: THEME_COLOR.hex,
        rgb: THEME_COLOR.rgb,
      });
      continue;
    }

    console.warn(`[home-carousel] 未找到文章或文档: ${id}`);
  }

  return { tag, items };
}

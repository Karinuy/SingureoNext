import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../config/site';
import {
  getEntryCategories,
  getEntryPublishDate,
  getEntrySlug,
  getEntryTags,
  getPosts,
} from '../lib/content';
import { extractSummaryFromMarkdown } from '../lib/markdown-summary';

const rssPath = site.rss.path.replace(/^\/+/, '').replace(/\.xml\/?$/, '');

export function getStaticPaths() {
  return site.rss.enabled ? [{ params: { rss: rssPath } }] : [];
}

export async function GET(context: APIContext) {
  if (context.params.rss !== rssPath) {
    return new Response(null, { status: 404 });
  }

  const posts = await getPosts();
  const limit = Math.max(1, site.rss.limit);
  const descriptionLength = Math.max(1, site.rss.descriptionLength);

  return rss({
    title: site.rss.title,
    description: site.rss.description,
    site: context.site ?? new URL(context.url.origin),
    items: posts.slice(0, limit).map((post) => {
      const description =
        post.data.description?.trim() ||
        extractSummaryFromMarkdown(post.body ?? '', { maxLength: descriptionLength });

      return {
        title: post.data.title,
        description,
        pubDate: getEntryPublishDate(post),
        link: `/posts/${getEntrySlug(post)}/`,
        categories: [...getEntryCategories(post), ...getEntryTags(post)],
      };
    }),
    customData: `<language>${site.rss.language}</language>`,
  });
}

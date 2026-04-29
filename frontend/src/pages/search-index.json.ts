import { getEntrySlug, getPrimaryCategory, getEntryTags, getEntryCategories, getPosts } from '../lib/content';
import { extractSummaryFromMarkdown } from '../lib/markdown-summary';

export const prerender = true;

export async function GET() {
  const games = await getPosts();
  const items = games.map((g) => ({
    slug: getEntrySlug(g),
    title: g.data.title,
    description: (g.data.description ?? '').trim() || extractSummaryFromMarkdown(g.body ?? '', { maxLength: 120 }),
    cover: g.data.cover ?? '',
    content: (g.body ?? '')
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/[#>*_~\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500),
    category: getPrimaryCategory(g),
    categories: getEntryCategories(g),
    tags: getEntryTags(g),
  }));

  return new Response(JSON.stringify({ items }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}


import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { slugifySegment } from './slug';

export type PostEntry = Awaited<ReturnType<typeof getPosts>>[number];

export function getEntrySlug(entry: CollectionEntry<'post'>) {
  const abbr = entry.data.abbrlink;
  if (abbr === undefined || abbr === null || abbr === '') return slugifySegment(entry.id);
  return String(abbr);
}

export function getEntryTags(entry: CollectionEntry<'post'>) {
  return entry.data.tags ?? [];
}

export function getEntryDownloads(entry: CollectionEntry<'post'>) {
  const downloads =
    entry.data.downloads
      ?.map((item) => ({
        label: item.label.trim() || '下载',
        url: item.url.trim(),
      }))
      .filter((item) => item.url) ?? [];

  return downloads;
}

export function getEntryCategories(entry: CollectionEntry<'post'>) {
  const out: string[] = [];

  const raw = entry.data.categories;
  if (typeof raw === 'string') {
    out.push(raw);
  } else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') out.push(item);
      else if (Array.isArray(item)) {
        const joined = item.filter((x): x is string => typeof x === 'string').join('/');
        if (joined) out.push(joined);
      }
    }
  }
  return Array.from(new Set(out.map((s) => s.trim()).filter(Boolean)));
}

export function getEntryPublishDate(entry: CollectionEntry<'post'>) {
  return entry.data.publishDate ?? entry.data.date;
}

function comparePostsByPublishDateDesc(a: CollectionEntry<'post'>, b: CollectionEntry<'post'>) {
  const at = getEntryPublishDate(a)?.getTime() ?? 0;
  const bt = getEntryPublishDate(b)?.getTime() ?? 0;
  return bt - at;
}

export function sortPostsForHome(entries: CollectionEntry<'post'>[]) {
  return [...entries].sort((a, b) => {
    const pinnedDelta = Number(b.data.pinned) - Number(a.data.pinned);
    return pinnedDelta || comparePostsByPublishDateDesc(a, b);
  });
}

export async function getHomePosts() {
  return sortPostsForHome(await getPosts());
}

export async function getPosts() {
  const entries = await getCollection('post', ({ data }) => !data.draft);
  return entries.sort(comparePostsByPublishDateDesc);
}

export async function getAllCategories() {
  const posts = await getPosts();
  return Array.from(new Set(posts.flatMap((g) => getEntryCategories(g)))).sort();
}

export async function getAllTags() {
  const posts = await getPosts();
  return Array.from(new Set(posts.flatMap((g) => getEntryTags(g)))).sort();
}


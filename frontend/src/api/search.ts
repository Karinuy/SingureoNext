import { site } from '@/config/site';
import type { PostCardData } from '@/types/post-card';

export type SearchApiPost = PostCardData & {
  slug: string;
};

type SearchResponse = {
  query: string;
  total: number;
  items: SearchApiPost[];
};

type DailyRecommendResponse = {
  source: 'favorites' | 'global';
  dayKey: string;
  nextRefreshAt: string;
  items: SearchApiPost[];
};

type RandomResponse = {
  item: SearchApiPost | null;
};

type PostsBySlugsResponse = {
  items: SearchApiPost[];
};

function buildApiUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${site.api.searchBaseUrl}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function requestJson<T>(path: string, init?: RequestInit, params?: Record<string, string | number | undefined>) {
  const response = await fetch(buildApiUrl(path, params), {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function searchPosts(query: string) {
  return requestJson<SearchResponse>('/search', undefined, { q: query });
}

export function getRandomPost() {
  return requestJson<RandomResponse>('/random');
}

export function getDailyRecommendations(favoriteSlugs: string[]) {
  return requestJson<DailyRecommendResponse>('/daily-recommend', {
    method: 'POST',
    body: JSON.stringify({ favoriteSlugs }),
  });
}

export function getPostsBySlugs(slugs: string[]) {
  return requestJson<PostsBySlugsResponse>('/posts-by-slugs', {
    method: 'POST',
    body: JSON.stringify({ slugs }),
  });
}

import type { PostCardData } from '@/types/post-card';

export type AdItem = {
  title: string;
  href: string;
  image: string;
};

export type AdConfig = {
  enabled?: boolean;
  items?: AdItem[];
};

export type PostListAdFeedEntry<TAd = AdItem> =
  | { type: 'post'; post: PostCardData }
  | { type: 'ad'; ad: TAd };

export const POST_LIST_AD_COLS = 4;
export const POST_LIST_AD_EVERY_ROWS = 2;
export const POST_LIST_AD_FULL_BELOW_ROWS = 4;

export function shuffle<T>(list: T[]): T[] {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function resolveAdItems(config?: AdConfig, fallback: AdItem[] = []): AdItem[] {
  if (!(config?.enabled ?? true)) return [];
  return config?.items ?? fallback;
}

export function buildPostListAdFeed<TAd extends AdItem>(
  posts: PostCardData[],
  ads: TAd[],
  cols = POST_LIST_AD_COLS,
  everyRows = POST_LIST_AD_EVERY_ROWS
): PostListAdFeedEntry<TAd>[] {
  if (!posts.length) return [];
  if (!ads.length) return posts.map((post) => ({ type: 'post', post }));

  const rows = Math.ceil(posts.length / cols);
  if (rows < POST_LIST_AD_FULL_BELOW_ROWS) {
    return [
      ...posts.map((post) => ({ type: 'post' as const, post })),
      ...ads.map((ad) => ({ type: 'ad' as const, ad })),
    ];
  }

  const blockSize = cols * everyRows;
  const pool = shuffle(ads);
  const feed: PostListAdFeedEntry<TAd>[] = [];
  let adIndex = 0;

  for (let i = 0; i < posts.length; i++) {
    feed.push({ type: 'post', post: posts[i] });
    const next = i + 1;
    if (next % blockSize === 0 && next < posts.length) {
      feed.push({ type: 'ad', ad: pool[adIndex % pool.length] });
      adIndex += 1;
    }
  }

  return feed;
}

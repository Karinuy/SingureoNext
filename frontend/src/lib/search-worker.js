import FlexSearch from 'flexsearch';

const INDEX_URL = '/search-index.json';
const DAILY_LIMIT = 24;
const SEARCH_LIMIT = 60;

let readyPromise = null;
let posts = [];
let postsBySlug = new Map();
let searchTextBySlug = new Map();
let index = null;

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function toArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function toPost(item) {
  const slug = String(item.slug ?? '');
  const title = String(item.title ?? '');
  const categories = toArray(item.categories);
  const tags = toArray(item.tags);

  return {
    slug,
    href: `/posts/${encodeURIComponent(slug)}/`,
    title,
    description: String(item.description ?? ''),
    cover: String(item.cover ?? ''),
    categories: categories.length ? categories : ['未分类'],
    tags,
    content: String(item.content ?? ''),
  };
}

function createSearchText(post) {
  return normalize(
    [
      post.title,
      post.description,
      ...post.categories,
      ...post.tags,
      post.content,
    ].join(' ')
  );
}

function createPublicPost(post) {
  return {
    slug: post.slug,
    href: post.href,
    title: post.title,
    description: post.description,
    cover: post.cover,
    categories: post.categories,
    tags: post.tags,
  };
}

async function ensureReady() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    const response = await fetch(INDEX_URL, { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`Failed to load search index: ${response.status}`);
    }

    const data = await response.json();
    posts = Array.isArray(data.items) ? data.items.map(toPost).filter((post) => post.slug && post.title) : [];
    postsBySlug = new Map(posts.map((post) => [post.slug, post]));
    searchTextBySlug = new Map(posts.map((post) => [post.slug, createSearchText(post)]));

    index = new FlexSearch.Index({
      tokenize: 'forward',
      cache: true,
      resolution: 9,
    });

    for (const post of posts) {
      index.add(post.slug, searchTextBySlug.get(post.slug));
    }
  })();

  return readyPromise;
}

function scorePost(post, terms, flexMatched) {
  const title = normalize(post.title);
  const description = normalize(post.description);
  const categories = normalize(post.categories.join(' '));
  const tags = normalize(post.tags.join(' '));
  const content = normalize(post.content);

  let score = flexMatched ? 8 : 0;
  for (const term of terms) {
    if (title === term) score += 80;
    else if (title.startsWith(term)) score += 60;
    else if (title.includes(term)) score += 45;

    if (tags.includes(term)) score += 30;
    if (categories.includes(term)) score += 24;
    if (description.includes(term)) score += 14;
    if (content.includes(term)) score += 4;
  }
  return score;
}

async function searchPosts(query) {
  await ensureReady();

  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(' ').filter(Boolean);
  if (!terms.length) {
    return { query: '', total: 0, items: [] };
  }

  const termResults = terms.map((term) => new Set(index.search(term, { limit: posts.length })));
  const candidateSlugs = new Set(termResults.flatMap((result) => Array.from(result)));
  const exactCandidates = posts.filter((post) => {
    const searchText = searchTextBySlug.get(post.slug) ?? '';
    return terms.every((term) => searchText.includes(term));
  });
  for (const post of exactCandidates) {
    candidateSlugs.add(post.slug);
  }
  const candidates = candidateSlugs.size > 0 ? Array.from(candidateSlugs).map((slug) => postsBySlug.get(slug)).filter(Boolean) : posts;

  const matched = candidates
    .map((post) => {
      const searchText = searchTextBySlug.get(post.slug) ?? '';
      const textMatched = terms.every((term) => searchText.includes(term));
      const flexMatched = termResults.every((result) => result.has(post.slug));
      if (!textMatched && !flexMatched) return null;
      return {
        post,
        score: scorePost(post, terms, flexMatched),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.post.title.localeCompare(b.post.title, 'zh-Hans-CN'));

  return {
    query: normalizedQuery,
    total: matched.length,
    items: matched.slice(0, SEARCH_LIMIT).map(({ post }) => createPublicPost(post)),
  };
}

function getRandomPost() {
  if (!posts.length) {
    return { item: null };
  }
  const pick = posts[Math.floor(Math.random() * posts.length)];
  return { item: createPublicPost(pick) };
}

function dayKeyOf(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nextRefreshAt() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
}

function hashSeed(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, seedText) {
  const nextRandom = randomFromSeed(hashSeed(seedText));
  const output = [...items];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

async function getDailyRecommendations(favoriteSlugs) {
  await ensureReady();

  const dayKey = dayKeyOf(new Date());
  const uniqueFavoriteSlugs = Array.from(new Set(Array.isArray(favoriteSlugs) ? favoriteSlugs.filter(Boolean) : []));
  const favorites = uniqueFavoriteSlugs.map((slug) => postsBySlug.get(slug)).filter(Boolean);
  const favoriteSlugSet = new Set(favorites.map((post) => post.slug));
  const favoriteTags = new Set(favorites.flatMap((post) => post.tags));
  const favoriteCategories = new Set(favorites.flatMap((post) => post.categories));

  const related = posts.filter((post) => {
    if (favoriteSlugSet.has(post.slug)) return false;
    return post.tags.some((tag) => favoriteTags.has(tag)) || post.categories.some((category) => favoriteCategories.has(category));
  });

  const source = related.length > 0 ? 'favorites' : 'global';
  const pool = source === 'favorites' ? related : posts;
  const seed = `${dayKey}:${source}:${uniqueFavoriteSlugs.sort().join(',')}`;
  const items = seededShuffle(pool, seed).slice(0, DAILY_LIMIT).map(createPublicPost);

  return {
    source,
    dayKey,
    nextRefreshAt: nextRefreshAt(),
    items,
  };
}

async function getPostsBySlugs(slugs) {
  await ensureReady();

  const items = Array.isArray(slugs)
    ? slugs.map((slug) => postsBySlug.get(slug)).filter(Boolean).map(createPublicPost)
    : [];

  return { items };
}

self.addEventListener('message', (event) => {
  const { id, type, payload } = event.data ?? {};
  if (!id || !type) return;

  Promise.resolve()
    .then(async () => {
      await ensureReady();
      if (type === 'preload') return undefined;
      if (type === 'search') return searchPosts(payload?.query);
      if (type === 'random') return getRandomPost();
      if (type === 'daily') return getDailyRecommendations(payload?.favoriteSlugs);
      if (type === 'postsBySlugs') return getPostsBySlugs(payload?.slugs);
      throw new Error(`Unknown search worker message: ${type}`);
    })
    .then((result) => {
      self.postMessage({ id, ok: true, result });
    })
    .catch((error) => {
      self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
    });
});

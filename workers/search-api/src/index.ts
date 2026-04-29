type SearchIndexItem = {
  slug: string;
  title: string;
  description?: string;
  content?: string;
  cover?: string;
  category?: string;
  categories?: string[];
  tags?: string[];
};

type PostCardItem = {
  slug: string;
  href: string;
  title: string;
  description: string;
  cover?: string;
  category: string;
  tags: string[];
};

type Env = {
  SEARCH_INDEX_URL: string;
  ALLOWED_ORIGIN: string;
  INDEX_CACHE_TTL_SECONDS?: string;
};

const MAX_SEARCH_RESULTS = 80;
const MAX_DAILY_CARDS = 21;
const PER_TAG_LIMIT = 3;
const DEFAULT_CACHE_TTL_SECONDS = 300;
const DAILY_TIME_ZONE = 'Asia/Shanghai';

function json(data: unknown, init: ResponseInit = {}, corsHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...init.headers,
    },
  });
}

function getCorsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('origin');
  const allowedOrigins = env.ALLOWED_ORIGIN.split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!origin || !allowedOrigins.includes(origin)) {
    return {
      vary: 'Origin',
    };
  }

  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    vary: 'Origin',
  };
}

type SearchKeyword = {
  normalized: string;
  compact: string;
};

type SearchField = {
  normalized: string;
  compact: string;
  weight: number;
};

function normalizeText(value: string) {
  return (value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function compactText(value: string) {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, '');
}

function buildKeyword(value: string): SearchKeyword {
  return {
    normalized: normalizeText(value),
    compact: compactText(value),
  };
}

function buildField(value: string, weight: number): SearchField {
  return {
    normalized: normalizeText(value),
    compact: compactText(value),
    weight,
  };
}

function scoreField(field: SearchField, keyword: SearchKeyword) {
  if (!keyword.normalized && !keyword.compact) return 0;

  let score = 0;
  if (keyword.normalized) {
    if (field.normalized === keyword.normalized) score += field.weight * 12;
    else if (field.normalized.startsWith(keyword.normalized)) score += field.weight * 10;
    else if (field.normalized.includes(keyword.normalized)) score += field.weight * 8;
  }

  if (keyword.compact) {
    if (field.compact === keyword.compact) score += field.weight * 6;
    else if (field.compact.startsWith(keyword.compact)) score += field.weight * 5;
    else if (field.compact.includes(keyword.compact)) score += field.weight * 4;
  }

  return score;
}

function scoreItem(item: SearchIndexItem, keywords: SearchKeyword[]) {
  const fields = [
    buildField(item.title, 6),
    buildField((item.tags ?? []).join(' '), 4),
    buildField((item.categories ?? []).join(' '), 3),
    buildField(item.description ?? '', 2),
    buildField(item.content ?? '', 1),
  ];

  for (const keyword of keywords) {
    if (!fields.some((field) => scoreField(field, keyword) > 0)) return 0;
  }

  let score = 0;
  for (const keyword of keywords) {
    for (const field of fields) {
      score += scoreField(field, keyword);
    }
  }
  return score;
}

function toCardItem(item: SearchIndexItem): PostCardItem {
  return {
    slug: item.slug,
    href: `/posts/${encodeURIComponent(item.slug)}/`,
    title: item.title,
    description: item.description || item.content || '',
    cover: item.cover || undefined,
    category: item.category || '未分类',
    tags: item.tags ?? [],
  };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashString(seed);
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const next = [...items];
  const random = createSeededRandom(seed);
  for (let index = next.length - 1; index > 0; index -= 1) {
    const pivot = Math.floor(random() * (index + 1));
    [next[index], next[pivot]] = [next[pivot], next[index]];
  }
  return next;
}

function getDailyKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DAILY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function getNextDailyRefreshAt(date = new Date()) {
  const shanghaiNow = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const nextUtcMs = Date.UTC(
    shanghaiNow.getUTCFullYear(),
    shanghaiNow.getUTCMonth(),
    shanghaiNow.getUTCDate() + 1,
    -8,
    0,
    0,
    0
  );
  return new Date(nextUtcMs).toISOString();
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function loadSearchIndex(request: Request, env: Env): Promise<SearchIndexItem[]> {
  if (!env.SEARCH_INDEX_URL) {
    throw new Error('SEARCH_INDEX_URL is not configured.');
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(env.SEARCH_INDEX_URL, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) {
    const data = (await cached.json()) as { items?: SearchIndexItem[] };
    return Array.isArray(data.items) ? data.items : [];
  }

  const response = await fetch(env.SEARCH_INDEX_URL, {
    headers: {
      accept: 'application/json',
    },
    cf: {
      cacheTtl: Number(env.INDEX_CACHE_TTL_SECONDS || DEFAULT_CACHE_TTL_SECONDS),
      cacheEverything: true,
    },
  } as RequestInit & { cf: { cacheTtl: number; cacheEverything: boolean } });

  if (!response.ok) {
    throw new Error(`Search index request failed with ${response.status}.`);
  }

  const payload = await response.text();
  const ttl = Number(env.INDEX_CACHE_TTL_SECONDS || DEFAULT_CACHE_TTL_SECONDS);
  await cache.put(
    cacheKey,
    new Response(payload, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': `public, max-age=${ttl}`,
      },
    })
  );

  const data = JSON.parse(payload) as { items?: SearchIndexItem[] };
  return Array.isArray(data.items) ? data.items : [];
}

function getSlugList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function buildDailyRecommendations(items: SearchIndexItem[], favoriteSlugs: string[]) {
  const dayKey = getDailyKey();
  const favoriteSignature = [...new Set(favoriteSlugs)].sort().join('|');
  const seedPrefix = `daily:${dayKey}:${favoriteSignature || 'global'}`;
  const bySlug = new Map(items.map((item) => [item.slug, item] as const));
  const favoriteSet = new Set(favoriteSlugs);
  const favoriteItems = favoriteSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as SearchIndexItem[];
  const tags = Array.from(new Set(favoriteItems.flatMap((item) => item.tags ?? []).map((tag) => tag.trim()).filter(Boolean)));

  if (!favoriteSlugs.length || !tags.length) {
    return {
      source: 'global' as const,
      dayKey,
      nextRefreshAt: getNextDailyRefreshAt(),
      items: seededShuffle(items, `${seedPrefix}:items`).slice(0, MAX_DAILY_CARDS).map(toCardItem),
    };
  }

  const tagOrder = seededShuffle(tags, `${seedPrefix}:tags`);
  const tagBuckets = new Map<string, SearchIndexItem[]>();
  const tagIndex = new Map<string, number>();
  for (const tag of tagOrder) {
    const candidates = seededShuffle(
      items.filter((item) => (item.tags ?? []).includes(tag) && !favoriteSet.has(item.slug)),
      `${seedPrefix}:tag:${tag}`
    );
    if (candidates.length) {
      tagBuckets.set(tag, candidates);
      tagIndex.set(tag, 0);
    }
  }

  const chosen: SearchIndexItem[] = [];
  const chosenSet = new Set<string>();
  const activeTags = [...tagBuckets.keys()];

  for (const tag of activeTags) {
    let used = 0;
    const bucket = tagBuckets.get(tag) ?? [];
    let cursor = tagIndex.get(tag) ?? 0;
    while (cursor < bucket.length && used < PER_TAG_LIMIT && chosen.length < MAX_DAILY_CARDS) {
      const item = bucket[cursor];
      cursor += 1;
      if (chosenSet.has(item.slug)) continue;
      chosen.push(item);
      chosenSet.add(item.slug);
      used += 1;
    }
    tagIndex.set(tag, cursor);
    if (chosen.length >= MAX_DAILY_CARDS) break;
  }

  let hasRemaining = true;
  while (chosen.length < MAX_DAILY_CARDS && hasRemaining) {
    hasRemaining = false;
    for (const tag of activeTags) {
      const bucket = tagBuckets.get(tag) ?? [];
      let cursor = tagIndex.get(tag) ?? 0;
      while (cursor < bucket.length) {
        const item = bucket[cursor];
        cursor += 1;
        if (chosenSet.has(item.slug)) continue;
        chosen.push(item);
        chosenSet.add(item.slug);
        hasRemaining = true;
        break;
      }
      tagIndex.set(tag, cursor);
      if (chosen.length >= MAX_DAILY_CARDS) break;
    }
  }

  if (chosen.length < MAX_DAILY_CARDS) {
    const fallbackPool = seededShuffle(
      items.filter((item) => !favoriteSet.has(item.slug) && !chosenSet.has(item.slug)),
      `${seedPrefix}:fallback`
    );
    for (const item of fallbackPool) {
      chosen.push(item);
      chosenSet.add(item.slug);
      if (chosen.length >= MAX_DAILY_CARDS) break;
    }
  }

  return {
    source: 'favorites' as const,
    dayKey,
    nextRefreshAt: getNextDailyRefreshAt(),
    items: chosen.slice(0, MAX_DAILY_CARDS).map(toCardItem),
  };
}

async function handleRequest(request: Request, env: Env) {
  const corsHeaders = getCorsHeaders(request, env);
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);

  try {
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true }, { headers: { 'cache-control': 'no-store' } }, corsHeaders);
    }

    const items = await loadSearchIndex(request, env);

    if (request.method === 'GET' && url.pathname === '/search') {
      const query = url.searchParams.get('q')?.trim() ?? '';
      const keywords = normalizeText(query).split(' ').filter(Boolean).map(buildKeyword);
      const limit = Math.min(Number(url.searchParams.get('limit')) || MAX_SEARCH_RESULTS, MAX_SEARCH_RESULTS);
      if (!keywords.length) {
        return json({ query, total: 0, items: [] }, {}, corsHeaders);
      }

      const results = items
        .map((item) => ({ item, score: scoreItem(item, keywords) }))
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score);

      return json(
        {
          query,
          total: results.length,
          items: results.slice(0, limit).map(({ item }) => toCardItem(item)),
        },
        {},
        corsHeaders
      );
    }

    if (request.method === 'GET' && url.pathname === '/random') {
      const item = items[Math.floor(Math.random() * items.length)];
      return json({ item: item ? toCardItem(item) : null }, {}, corsHeaders);
    }

    if (request.method === 'POST' && url.pathname === '/daily-recommend') {
      const body = await readJsonBody(request);
      const favoriteSlugs = getSlugList(body.favoriteSlugs);
      return json(buildDailyRecommendations(items, favoriteSlugs), {}, corsHeaders);
    }

    if (request.method === 'POST' && url.pathname === '/posts-by-slugs') {
      const body = await readJsonBody(request);
      const slugs = getSlugList(body.slugs);
      const bySlug = new Map(items.map((item) => [item.slug, item] as const));
      return json(
        {
          items: slugs.map((slug) => bySlug.get(slug)).filter(Boolean).map((item) => toCardItem(item as SearchIndexItem)),
        },
        {},
        corsHeaders
      );
    }

    return json({ error: 'Not found' }, { status: 404 }, corsHeaders);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Unexpected Worker error',
      },
      { status: 500 },
      corsHeaders
    );
  }
}

export default {
  fetch: handleRequest,
};

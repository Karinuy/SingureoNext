import type { PostCardData } from '@/types/post-card';

export type SearchPost = PostCardData & {
  slug: string;
};

type SearchResponse = {
  query: string;
  total: number;
  items: SearchPost[];
};

type DailyRecommendResponse = {
  source: 'favorites' | 'global';
  dayKey: string;
  nextRefreshAt: string;
  items: SearchPost[];
};

type RandomResponse = {
  item: SearchPost | null;
};

type PostsBySlugsResponse = {
  items: SearchPost[];
};

type WorkerRequest =
  | { type: 'preload'; payload?: undefined }
  | { type: 'search'; payload: { query: string } }
  | { type: 'random'; payload?: undefined }
  | { type: 'daily'; payload: { favoriteSlugs: string[] } }
  | { type: 'postsBySlugs'; payload: { slugs: string[] } };

type WorkerResponse<T> =
  | { id: string; ok: true; result: T }
  | { id: string; ok: false; error: string };

let worker: Worker | null = null;
let requestId = 0;
let preloadPromise: Promise<void> | null = null;
let preloadScheduled = false;
const pending = new Map<string, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();

function getWorker() {
  if (worker) return worker;

  worker = new Worker(new URL('./search-worker.js', import.meta.url), {
    type: 'module',
  });

  worker.addEventListener('message', (event: MessageEvent<WorkerResponse<unknown>>) => {
    const message = event.data;
    const request = pending.get(message.id);
    if (!request) return;

    pending.delete(message.id);
    if (message.ok) {
      request.resolve(message.result);
    } else {
      request.reject(new Error(message.error || '本地搜索失败'));
    }
  });

  worker.addEventListener('error', (event) => {
    const error = new Error(event.message || '本地搜索 Worker 运行失败');
    for (const request of pending.values()) {
      request.reject(error);
    }
    pending.clear();
    worker?.terminate();
    worker = null;
  });

  return worker;
}

function requestSearchWorker<T>(request: WorkerRequest) {
  const id = `search-${Date.now()}-${requestId++}`;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    getWorker().postMessage({ id, ...request });
  });
}

export function preloadSearchIndex() {
  if (!preloadPromise) {
    preloadPromise = requestSearchWorker<void>({
      type: 'preload',
    }).catch(() => {
      preloadPromise = null;
    });
  }

  return preloadPromise;
}

export function scheduleSearchIndexPreload() {
  if (preloadScheduled) return;
  preloadScheduled = true;

  const run = () => {
    void preloadSearchIndex();
  };

  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  };

  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(run, { timeout: 3000 });
    return;
  }

  window.setTimeout(run, 800);
}

export function searchPosts(query: string) {
  return requestSearchWorker<SearchResponse>({
    type: 'search',
    payload: { query },
  });
}

export function getRandomPost() {
  return requestSearchWorker<RandomResponse>({
    type: 'random',
  });
}

export function getDailyRecommendations(favoriteSlugs: string[]) {
  return requestSearchWorker<DailyRecommendResponse>({
    type: 'daily',
    payload: { favoriteSlugs },
  });
}

export function getPostsBySlugs(slugs: string[]) {
  return requestSearchWorker<PostsBySlugsResponse>({
    type: 'postsBySlugs',
    payload: { slugs },
  });
}

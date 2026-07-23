export type ArtalkLatestComment = {
  id: number;
  content: string;
  content_marked?: string;
  nick: string;
  email_encrypted?: string;
  date: string;
  page_key: string;
  page_url?: string;
  badge_name?: string;
  badge_color?: string;
  is_pending?: boolean;
  visible?: boolean;
};

export type ArtalkGravatarConf = {
  mirror: string;
  params: string;
};

type ArtalkLatestCommentsResponse = {
  data?: ArtalkLatestComment[];
};

type ArtalkConfResponse = {
  frontend_conf?: {
    gravatar?: {
      mirror?: string;
      params?: string;
    };
  };
};

export type ArtalkLatestCommentsQuery = {
  server: string;
  siteName: string;
  limit?: number;
};

function normalizeArtalkBase(server: string) {
  return server.replace(/\/+$/, '');
}

/** Build avatar URL strictly from Artalk `/api/v2/conf` gravatar + comment email hash. */
export function buildArtalkAvatarUrl(
  emailEncrypted: string | undefined,
  gravatar: ArtalkGravatarConf,
  size = 80
) {
  const hash = emailEncrypted?.trim();
  const mirror = gravatar.mirror?.trim().replace(/\/+$/, '');
  if (!hash || !mirror) return '';

  const params = new URLSearchParams((gravatar.params || '').replace(/^\?/, ''));
  params.set('s', String(size));

  const query = params.toString();
  return query ? `${mirror}/${encodeURIComponent(hash)}?${query}` : `${mirror}/${encodeURIComponent(hash)}`;
}

export function plainCommentText(content: string) {
  return content
    .replace(/<img\b[^>]*>/gi, ' [表情] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Artalk open URL: `{page_url}#atk-comment-{id}` from API fields. */
export function commentAnchorHref(comment: ArtalkLatestComment) {
  const anchor = `#atk-comment-${comment.id}`;
  const pageUrl = comment.page_url?.trim();

  if (pageUrl) {
    try {
      const url = new URL(pageUrl);
      return `${url.pathname}${url.search}${anchor}`;
    } catch {
      return `${pageUrl.replace(/#.*$/, '')}${anchor}`;
    }
  }

  const key = comment.page_key?.trim();
  if (key?.startsWith('/')) return `${key}${anchor}`;
  return anchor;
}

export function formatCommentTime(dateInput: string) {
  const date = new Date(dateInput.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return dateInput;

  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchArtalkGravatarConf(server: string): Promise<ArtalkGravatarConf> {
  const base = normalizeArtalkBase(server);
  const response = await fetch(`${base}/api/v2/conf`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Artalk conf failed: ${response.status}`);
  }

  const payload = (await response.json()) as ArtalkConfResponse;
  const mirror = payload.frontend_conf?.gravatar?.mirror?.trim();
  const params = payload.frontend_conf?.gravatar?.params?.trim();

  if (!mirror) {
    throw new Error('Artalk conf missing gravatar.mirror');
  }

  return { mirror, params: params || '' };
}

export async function fetchArtalkLatestComments({
  server,
  siteName,
  limit = 6,
}: ArtalkLatestCommentsQuery): Promise<ArtalkLatestComment[]> {
  const base = normalizeArtalkBase(server);
  const url = new URL(`${base}/api/v2/stats/latest_comments`);
  url.searchParams.set('site_name', siteName);
  url.searchParams.set('limit', String(Math.max(1, limit)));

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Artalk latest comments failed: ${response.status}`);
  }

  const payload = (await response.json()) as ArtalkLatestCommentsResponse;
  const list = Array.isArray(payload.data) ? payload.data : [];

  return list.filter((item) => item && item.visible !== false && item.is_pending !== true);
}

export async function fetchArtalkLatestCommentsBundle(query: ArtalkLatestCommentsQuery) {
  const [comments, gravatar] = await Promise.all([
    fetchArtalkLatestComments(query),
    fetchArtalkGravatarConf(query.server),
  ]);

  return { comments, gravatar };
}

export const EXTERNAL_LINK_TARGET = '_blank';
export const EXTERNAL_LINK_REL = 'noreferrer noopener';

export type RedirectConfig = {
  enabled?: boolean;
  whitelist?: string[];
};

type ResolveLinkOptions = {
  currentHostname?: string;
  skipRedirect?: boolean;
  redirect?: RedirectConfig;
};

type ResolvedLink = {
  href: string;
  target?: typeof EXTERNAL_LINK_TARGET;
  rel?: typeof EXTERNAL_LINK_REL;
};

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function encodeRedirectHref(href: string): string {
  return btoa(unescape(encodeURIComponent(href)));
}

function normalizeWhitelist(config?: RedirectConfig): string[] {
  return (config?.whitelist ?? [])
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

function readJsonArray(value?: string): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function isHttpHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function isExternalHttpHref(href: string, options: ResolveLinkOptions = {}): boolean {
  if (!href || !isHttpHref(href)) return false;

  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    const currentHostname = options.currentHostname?.toLowerCase();
    return hostname !== currentHostname;
  } catch {
    return false;
  }
}

export function shouldUseRedirect(href: string, options: ResolveLinkOptions = {}): boolean {
  if (options.skipRedirect || !options.redirect?.enabled || !isExternalHttpHref(href, options)) return false;

  try {
    const hostname = new URL(href).hostname.toLowerCase();
    const whitelist = normalizeWhitelist(options.redirect);
    return !whitelist.some((domain) => matchesDomain(hostname, domain));
  } catch {
    return false;
  }
}

export function toRedirectUrl(href: string, options: ResolveLinkOptions = {}): string {
  if (!shouldUseRedirect(href, options)) return href;
  return `/go?url=${encodeRedirectHref(href)}`;
}

export function resolveLink(href: string, options: ResolveLinkOptions = {}): ResolvedLink {
  if (!isExternalHttpHref(href, options)) {
    return { href };
  }

  return {
    href: toRedirectUrl(href, options),
    target: EXTERNAL_LINK_TARGET,
    rel: EXTERNAL_LINK_REL,
  };
}

export function readClientRedirectConfig(): RedirectConfig {
  if (typeof document === 'undefined') return {};

  const dataset = document.body?.dataset;
  return {
    enabled: dataset?.redirectEnabled === 'true',
    whitelist: readJsonArray(dataset?.redirectWhitelist),
  };
}

export function getClientResolveLinkOptions(options: ResolveLinkOptions = {}): ResolveLinkOptions {
  if (typeof window === 'undefined') return options;

  const clientOptions: ResolveLinkOptions = {
    currentHostname: window.location.hostname,
    redirect: readClientRedirectConfig(),
  };

  return {
    ...clientOptions,
    ...options,
    redirect: options.redirect ?? clientOptions.redirect,
  };
}

export function normalizeExternalLinks(root: ParentNode = document, options: ResolveLinkOptions = {}): void {
  const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href]');

  for (const anchor of anchors) {
    if (anchor.closest('[data-no-external-redirect]')) continue;

    const rawHref = anchor.getAttribute('href');
    if (!rawHref || !isExternalHttpHref(rawHref, options)) continue;

    const resolved = resolveLink(rawHref, options);
    anchor.setAttribute('href', resolved.href);

    if (resolved.target) {
      anchor.setAttribute('target', resolved.target);
    }

    if (resolved.rel) {
      anchor.setAttribute('rel', resolved.rel);
    }
  }
}

export function installExternalLinkNormalizer(): void {
  if (typeof window === 'undefined') return;

  const key = '__externalLinkNormalizerInstalled';
  if ((window as typeof window & Record<string, unknown>)[key]) return;

  const apply = () => normalizeExternalLinks(document, getClientResolveLinkOptions());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }

  document.addEventListener('astro:page-load', apply);
  (window as typeof window & Record<string, unknown>)[key] = true;
}

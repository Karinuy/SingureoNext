import { site } from '../config/site';

const whitelist = (site.redirect?.whitelist ?? []).map((domain) => domain.toLowerCase());

export const EXTERNAL_LINK_TARGET = '_blank';
export const EXTERNAL_LINK_REL = 'noreferrer noopener';

type ResolveLinkOptions = {
  currentHostname?: string;
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
  if (!site.redirect?.enabled || !isExternalHttpHref(href, options)) return false;

  try {
    const hostname = new URL(href).hostname.toLowerCase();
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

export function normalizeExternalLinks(root: ParentNode = document, options: ResolveLinkOptions = {}): void {
  const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href]');

  for (const anchor of anchors) {
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

  const apply = () => normalizeExternalLinks(document, { currentHostname: window.location.hostname });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }

  document.addEventListener('astro:page-load', apply);
  (window as typeof window & Record<string, unknown>)[key] = true;
}

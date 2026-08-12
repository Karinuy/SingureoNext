import * as icons from '@lucide/astro';

export type NavIconName = string;

function toPascalCase(value: string) {
  return value
    .replace(/(^|[-_\s]+)([a-zA-Z0-9])/g, (_match, _prefix, char: string) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

export function resolveNavIcon(name: string | undefined) {
  if (!name) return undefined;
  return (icons as Record<string, unknown>)[toPascalCase(name)] as typeof icons.Circle | undefined;
}

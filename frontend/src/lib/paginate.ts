export function clampPage(page: number, pageCount: number) {
  if (!Number.isFinite(page) || page < 1) return 1
  if (pageCount < 1) return 1
  return Math.min(page, pageCount)
}

export function getPageCount(total: number, pageSize: number) {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(total / pageSize))
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = getPageCount(items.length, pageSize)
  const p = clampPage(page, pageCount)
  const start = (p - 1) * pageSize
  const end = start + pageSize
  return {
    page: p,
    pageSize,
    pageCount,
    total: items.length,
    items: items.slice(start, end),
  }
}


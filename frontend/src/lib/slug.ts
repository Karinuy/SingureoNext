export function slugifySegment(input: string) {
  const s = (input ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\-]+|[.\-]+$/g, "")

  return s || "untitled"
}


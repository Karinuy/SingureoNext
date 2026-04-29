export function extractSummaryFromMarkdown(
  markdown: string,
  options?: {
    maxLength?: number
  }
) {
  const maxLength = options?.maxLength ?? 120
  if (!markdown) return ""

  const lines = markdown.split(/\r?\n/)
  const kept: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const next = lines[i + 1]

    if (/^\s*#{1,6}\s+/.test(line)) continue

    if (
      next &&
      line.trim() &&
      /^\s*(=|-){3,}\s*$/.test(next)
    ) {
      i++
      continue
    }

    kept.push(line)
  }

  let text = kept.join("\n")

  text = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")

  text = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")

  text = text
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/[>*_~#=-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "…"
}


import type { CollectionEntry } from "astro:content"

import { getEntryCategories, getEntrySlug, getEntryTags } from "./content"
import { extractSummaryFromMarkdown } from "./markdown-summary"
import type { PostCardData } from "@/types/post-card"

export function postToCardData(entry: CollectionEntry<"post">): PostCardData {
  const description =
    entry.data.description?.trim() ||
    extractSummaryFromMarkdown(entry.body ?? "", { maxLength: 120 })

  return {
    href: `/posts/${getEntrySlug(entry)}/`,
    title: entry.data.title,
    description,
    cover: entry.data.cover,
    categories: getEntryCategories(entry),
    tags: getEntryTags(entry),
  }
}


import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

export type DocEntry = CollectionEntry<'docs'>;

export type DocListItem = {
  entry: DocEntry;
  updatedDate: Date;
};

async function getDocFileUpdatedDate(entry: DocEntry) {
  const file = join(process.cwd(), 'src/content/docs', `${entry.id}.mdx`);
  const stats = await stat(file);
  return stats.mtime;
}

export async function getDocsByUpdatedTime(): Promise<DocListItem[]> {
  const entries = await getCollection('docs', ({ data }) => !data.draft);
  const docs = await Promise.all(
    entries.map(async (entry) => ({
      entry,
      updatedDate: await getDocFileUpdatedDate(entry),
    }))
  );

  return docs.sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime());
}

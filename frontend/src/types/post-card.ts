export type PostCardData = {
  href: string;
  title: string;
  description?: string;
  cover?: string;
  categories: string[];
  tags: string[];
  pinned?: boolean;
};

# Singureo

Singureo is a content-driven ACG resource website built with Astro, React, shadcn/ui, Tailwind CSS, and Vaul. The project is designed around a simple goal: deliver a clean interface, smooth navigation, and a comfortable reading and discovery experience on both desktop and mobile devices.

The site combines static content delivery with client-side interactions. Most pages are generated from content collections, while features such as local favorites, search, daily recommendations, and interactive navigation are handled in the browser for a faster and more personal experience.

## Core Features

- Responsive layout optimized for desktop and mobile browsing
- Dedicated desktop navigation and slide-out mobile drawer navigation
- Content collections for posts and documentation pages
- Category pages, tag pages, and paginated archive pages
- Local search experience powered by a generated search index
- Browser-based favorites system with import and export support
- Daily recommendation page that uses favorite tags when available
- Home page announcement area, carousel, and configurable ad slots
- Breadcrumb navigation and content-focused page layout
- SEO-oriented metadata setup including canonical URLs, Open Graph, and sitemap support

## User Experience Highlights

Singureo is not only a content repository, but also a browsing-focused reading product. The interface emphasizes clarity, spacing, and lightweight interaction patterns. Users can move between the home page, archive pages, tags, categories, search results, favorites, and documentation without losing visual consistency.

Some interaction-focused features include:

- Smooth hover and active states for navigation elements
- Mobile drawer navigation for compact screens
- Toast-based feedback for loading, searching, importing, and exporting actions
- Local persistence for favorites through IndexedDB
- Daily recommendations refreshed on a timed cache cycle
- Search query persistence in the URL for easier revisits and sharing

## Content Model

The project uses Astro content collections to manage structured content.

### Posts

Post content is loaded from `src/content/post` and uses Markdown files. A post can include fields such as:

- `title`
- `description`
- `cover`
- `category`
- `categories`
- `tags`
- `downloadUrl`
- `downloads`
- `publishDate`
- `date`
- `abbrlink`
- `updatedDate`
- `draft`

### Docs

Documentation content is loaded from `src/content/docs` and uses MDX files. Docs entries support fields such as:

- `title`
- `description`
- `date`
- `updatedDate`
- `abbrlink`
- `draft`

This structure keeps publishing workflows maintainable while allowing the site to render multiple content types with a consistent design language.

## Tech Stack

- Astro
- React
- shadcn/ui
- Tailwind CSS
- Vaul
- TypeScript
- IndexedDB for local favorites storage

## Project Structure

Key directories and files:

- `src/pages` for route-based Astro pages
- `src/components` for reusable React and Astro UI components
- `src/content/post` for Markdown post content
- `src/content/docs` for MDX documentation content
- `src/content/config.ts` for content collection schemas
- `src/config/site.ts` for site-wide configuration such as navigation, announcements, links, carousel items, and ad slots
- `src/lib` for shared utilities such as favorites storage, pagination, and content helpers

## Getting Started

### Prerequisites

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` starts the Astro development server
- `npm run build` creates the production build
- `npm run preview` previews the built site locally
- `npm run astro` runs Astro CLI commands
- `npm run ensure:abbrlink` validates or prepares `abbrlink`-related content data

The `predev` and `prebuild` hooks automatically run the `ensure-abbrlink` script before development and production builds.

## Configuration Notes

Most site-level content can be adjusted without changing layout code. For example, `src/config/site.ts` controls:

- Site name and tagline
- Navigation items
- Home page announcement text
- Carousel items
- Ad slot configuration
- Footer links
- Friend links

This makes it easy to tune content presentation while keeping the core UI components stable.

## Search, Favorites, and Recommendations

Search is implemented on the client side using a local search index and keyword scoring. The experience is designed to stay responsive even with a larger content set by debouncing input and processing result batches incrementally.

Favorites are stored locally in the browser through IndexedDB. Users can:

- Save favorite posts
- View all favorites on a dedicated page
- Export favorites as JSON
- Import favorites in replace or merge mode

The daily recommendation page builds a list of suggested posts. When favorites exist, the system prefers related content based on favorite tags. If there is not enough favorite data, it falls back to a broader site-wide recommendation pool.

## Purpose

Singureo aims to provide a practical and visually clean foundation for a modern Astro-based content site. It blends static publishing, responsive UI patterns, and lightweight personalized features into a single project that is easy to browse, extend, and maintain.

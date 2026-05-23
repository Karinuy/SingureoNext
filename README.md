# SingureoNext

SingureoNext is the next-generation codebase for **Singureo**, a content-driven ACG and Galgame resource website focused on clean presentation, fast discovery, and a comfortable reading experience across desktop and mobile devices.

The project combines a statically generated Astro frontend with a Cloudflare Worker search API. Content is managed through Markdown and MDX collections, while interactive features such as search, favorites, daily recommendations, responsive navigation, and external-link redirects are handled with lightweight client-side scripts and edge APIs.

## Features

- Astro-powered static site generation for fast content delivery
- Markdown-based post collection and MDX-based documentation collection
- Category, tag, archive, post detail, documentation, search, favorites, and daily recommendation pages
- Responsive desktop and mobile layouts with drawer-style mobile navigation
- Generated search index with optional Cloudflare Worker-backed search endpoints
- Local favorites powered by browser storage, including import and export support
- Daily recommendations based on favorite slugs and tag affinity
- SEO-friendly metadata, canonical URLs, Open Graph support, and sitemap generation
- Configurable site navigation, carousel entries, announcements, friend links, footer links, ad slots, and redirect whitelist

## Tech Stack

- [Astro](https://astro.build/) for the frontend application
- [TypeScript](https://www.typescriptlang.org/) for application and Worker code
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [MDX](https://mdxjs.com/) for documentation content
- [Cloudflare Workers](https://workers.cloudflare.com/) for the search and recommendation API
- Browser storage for local favorites

## Project Structure

```text
.
├── frontend/
│   ├── astro.config.mjs
│   ├── src/
│   │   ├── components/       # Reusable Astro UI components
│   │   ├── config/           # Site-wide configuration
│   │   ├── content/          # Markdown posts and MDX docs
│   │   ├── layouts/          # Shared page layouts
│   │   ├── lib/              # Content, pagination, search, redirect, and storage utilities
│   │   ├── pages/            # File-based routes
│   │   ├── scripts/          # Browser-side interaction scripts
│   │   └── styles/           # Global styles
│   └── package.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Install Dependencies

```bash
cd frontend
npm install
```

### Start Development Server

```bash
npm run dev
```

The Astro development server starts locally, usually at `http://localhost:4321`.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Available Frontend Scripts

Run these commands from the `frontend` directory:

- `npm run dev` starts the Astro development server
- `npm run build` creates a production build
- `npm run preview` previews the production build locally
- `npm run astro` runs Astro CLI commands
- `npm run ensure:abbrlink` validates and prepares `abbrlink` values for content entries

The `predev` and `prebuild` hooks automatically run the `ensure-abbrlink` script before local development and production builds.

## Content Model

Posts live in `frontend/src/content/post` as Markdown files. They support frontmatter fields such as:

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

Documentation pages live in `frontend/src/content/docs` as MDX files. They support fields such as:

- `title`
- `description`
- `cover`
- `date`
- `updatedDate`
- `abbrlink`
- `draft`

The collection schemas are defined in `frontend/src/content.config.ts`.

## Site Configuration

Most site-level content can be customized in `frontend/src/config/site.ts`, including:

- Site name, tagline, keywords, and logo text
- Main navigation and nested navigation items
- Home page announcement and carousel items
- Ad slot configuration
- Friend links and footer links
- External redirect behavior and whitelist
- Artalk server URL

## Local Search

Search, random post selection, daily recommendations, and favorites detail lookup run locally in the browser. The frontend builds `/search-index.json` during the Astro build, then `frontend/src/lib/search-worker.js` loads that index inside a Web Worker and searches it with FlexSearch.

The local search worker powers:

- `/search`
- Random article navigation
- `/daily`
- Favorites detail rendering

## Deployment Notes

The frontend can be deployed to any static hosting platform that supports Astro builds. Configure the production site URL in `frontend/astro.config.mjs` and update `frontend/src/config/site.ts` for site-level settings.

## License

No license has been specified yet. Add a license file before distributing or reusing this project publicly.

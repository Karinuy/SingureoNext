# 🌸 SingureoNext

> 一个以 **ACGN** 为核心的 Astro 静态站点项目。

SingureoNext 是 Singureo 网站的新一代前端实现。项目以 Astro SSG 为基础，将 Markdown / MDX 内容构建为可部署到静态托管平台的站点，并在浏览器端补充搜索、收藏、每日推荐、随机文章、外链确认、评论统计等交互能力。

当前项目没有独立后端目录，主要能力集中在 `frontend/`。

## ✨ 项目亮点

- 🚀 **Astro SSG**：构建静态页面、内容集合、RSS、站点地图与 SEO 元信息。
- 📝 **Markdown 文章**：资源文章统一放在 `frontend/src/content/post`。
- 📚 **MDX 文档**：公告、教程、关于本站等内容放在 `frontend/src/content/docs`。
- 📌 **首页置顶文章**：文章 frontmatter 支持 `pinned: true`，首页最新文章列表优先展示置顶内容。
- 🔎 **本地搜索**：Web Worker + FlexSearch 加载 `/search-index.json`，不阻塞主线程。
- ⭐ **本地收藏**：使用 IndexedDB 保存收藏，支持收藏导入 / 导出。
- 🎲 **随机文章**：复用搜索索引，在全站文章中随机跳转。
- 📅 **每日推荐**：优先根据本地收藏的分类和标签推荐内容。
- 💬 **Artalk 接入**：文章评论、浏览量和评论数统计由外部 Artalk 服务提供。
- 🖼️ **图片懒加载**：`vanilla-lazyload` + 自定义 rehype 插件处理正文与组件图片。
- 🌓 **深浅主题**：全站统一主题变量，暗色模式下自动压低图片亮度。
- 🧭 **外链跳转确认**：非白名单外链会进入 `/go` 离站提示页。
- 🧩 **扩展页面**：包含收藏页、每日推荐页、AI 识图页、留言板、RSS 等。

## 🧱 技术栈

| 类型 | 使用 |
| --- | --- |
| 🧭 框架 | Astro `^7.2.1` |
| 🧠 语言 | TypeScript |
| 🎨 样式 | Tailwind CSS `^3.4.19` |
| 📄 内容 | Markdown、MDX、Astro Content Collections |
| 🔍 搜索 | FlexSearch、Web Worker |
| 🖼️ 图片 | vanilla-lazyload、Astro passthrough image service |
| 💬 评论 | Artalk |
| 🧰 UI | Lucide Astro、clsx、tailwind-merge |
| 🗺️ SEO | `@astrojs/sitemap`、RSS、Open Graph |

## 📦 仓库结构

```text
.
├── README.md
├── package.json              # 根目录仅保留项目元信息和占位脚本
└── frontend/
    ├── package.json          # 实际开发、构建、预览脚本
    ├── package-lock.json
    ├── astro.config.mjs
    ├── tailwind.config.mjs
    ├── postcss.config.cjs
    ├── public/
    ├── scripts/
    └── src/
        ├── components/       # 站点组件
        ├── components/ui/    # 基础 UI 组件
        ├── config/           # 站点配置
        ├── content/          # post / docs 内容集合
        ├── layouts/          # 页面布局
        ├── lib/              # 内容、分页、搜索、slug 等工具
        ├── pages/            # Astro 文件路由
        ├── scripts/          # 浏览器端初始化脚本
        ├── styles/           # 全局样式
        └── types/            # 类型定义
```

## 🗂️ 核心目录说明

- 🏠 `frontend/src/pages`
  Astro 路由目录，包含首页、文章页、分类、标签、文档、搜索、收藏、每日推荐、AI 识图、留言板、外链跳转和 RSS。

- 📝 `frontend/src/content/post`
  Markdown 文章目录。每篇文章通过 frontmatter 配置标题、封面、分类、标签、下载链接、日期、短链、置顶状态等。

- 📚 `frontend/src/content/docs`
  MDX 文档目录。用于公告、教程、关于本站等较稳定内容。

- 🧩 `frontend/src/components`
  站点组件目录，包括导航栏、文章卡片、文章列表、广告位、最新评论、最新文档、收藏按钮、下载按钮、评论区、搜索入口、页脚等。

- 🎛️ `frontend/src/config/site.ts`
  站点级配置：导航、广告、友链、页脚链接、RSS、外链白名单、Artalk、AnimeTrace 等。

- 🧠 `frontend/src/lib`
  通用逻辑：内容读取、首页排序、分页、slug、文章卡片数据转换、搜索 Worker、收藏 IndexedDB、外链重定向、Markdown 摘要、图片懒加载 rehype 插件等。

- 🎨 `frontend/src/styles/SingureoMain.css`
  全局样式入口，包含 Tailwind 层、主题变量、暗色模式、滚动条、懒加载动画、弹层、导航、最新评论、文章列表网格等样式。

## 🧭 当前路由

| 路由 | 用途 |
| --- | --- |
| `/` | 首页：广告图、最新评论、最新文档、最新文章列表 |
| `/page/[page]/` | 首页文章分页 |
| `/posts/[slug]/` | 文章详情页 |
| `/categories` | 分类索引 |
| `/categories/page/[page]/` | 分类索引分页 |
| `/category/[slug]/` | 单个分类文章列表 |
| `/category/[slug]/page/[page]/` | 单个分类分页 |
| `/tags` | 标签索引 |
| `/tags/page/[page]/` | 标签索引分页 |
| `/tag/[slug]/` | 单个标签文章列表 |
| `/tag/[slug]/page/[page]/` | 单个标签分页 |
| `/docs` | 文档索引 |
| `/docs/[...slug]/` | 文档详情页 |
| `/search` | 搜索结果页 |
| `/search-index.json` | 构建生成的搜索索引 |
| `/favorites` | 本地收藏页 |
| `/daily` | 每日推荐页 |
| `/anime-trace/[...route]` | AI 识图页 |
| `/guestbook/[...route]` | 留言板 |
| `/go` | 外链跳转确认页 |
| `/rss.xml` | RSS 订阅 |

## 📝 文章 Frontmatter

文章集合定义位于 `frontend/src/content.config.ts`，来源为：

```text
frontend/src/content/post/**/*.md
```

支持字段：

| 字段 | 说明 |
| --- | --- |
| `title` | 必填，文章标题 |
| `description` | 可选，页面描述；缺省时从正文提取摘要 |
| `cover` | 可选，封面图片地址 |
| `categories` | 可选，支持字符串、字符串数组或嵌套字符串数组 |
| `tags` | 可选，标签数组，默认 `[]` |
| `downloads` | 可选，下载入口数组，包含 `label` 和 `url` |
| `publishDate` | 可选，发布时间 |
| `date` | 可选，兼容日期字段；排序会优先使用 `publishDate` |
| `abbrlink` | 可选，稳定短链；缺省时回退到文件名生成 slug |
| `updatedDate` | 可选，更新时间 |
| `pinned` | 可选，首页最新文章置顶，默认 `false` |
| `draft` | 可选，草稿标记，默认 `false` |

### 📌 置顶示例

```md
---
title: 示例文章
cover: https://example.com/cover.avif
categories:
  - Galgame
tags:
  - 示例
downloads:
  - label: OneDrive 下载
    url: https://example.com/download
abbrlink: demo-001
date: 2026-01-28 12:00:00
pinned: true
---

## 游戏介绍

这里是正文内容。
```

置顶规则：

- 📌 只有首页和首页分页使用置顶排序。
- ⏱️ 置顶文章内部仍按发布时间倒序。
- 🧾 未置顶文章保持原本的发布时间倒序。
- 🎴 置顶文章卡片左上角会显示“置顶”标识。

## 📚 文档 Frontmatter

文档集合来源为：

```text
frontend/src/content/docs/**/*.mdx
```

支持字段：

| 字段 | 说明 |
| --- | --- |
| `title` | 必填，文档标题 |
| `description` | 可选，页面描述 |
| `cover` | 可选，封面图片地址 |
| `date` | 可选，发布时间 |
| `updatedDate` | 可选，更新时间 |
| `abbrlink` | 可选，文档短链 |
| `draft` | 可选，草稿标记，默认 `false` |

## ⚙️ 开发命令

实际命令都在 `frontend/` 目录执行：

```bash
cd frontend
npm install
npm run dev
```

常用脚本：

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Astro 开发服务器 |
| `npm run build` | 生成生产静态站点 |
| `npm run preview` | 本地预览构建结果 |
| `npm run astro` | 运行 Astro CLI |
| `npm run ensure:abbrlink` | 检查并补齐内容文件的 `abbrlink` |

注意：

- 🧷 `predev` 会自动执行 `node scripts/ensure-abbrlink.mjs`。
- 🧷 `prebuild` 会自动执行 `node scripts/ensure-abbrlink.mjs`。
- 🗃️ `ensure-abbrlink.mjs` 会遍历 `src/content` 下的 Markdown / MDX 文件，确保每个内容条目都有唯一 `abbrlink`。

## 🛠️ 内容维护流程

### 📝 新增文章

1. 在 `frontend/src/content/post` 新建 Markdown 文件。
2. 填写 `title`、`categories`、`tags`、`cover`、`downloads`、`date` 等 frontmatter。
3. 如需首页置顶，添加 `pinned: true`。
4. 使用 `abbrlink` 固定文章 URL；也可以交给 `ensure-abbrlink` 自动补齐。
5. 正文图片会由懒加载插件处理。

### 📚 新增文档

1. 在 `frontend/src/content/docs` 新建 MDX 文件。
2. 填写 `title`、`description`、`date`、`abbrlink` 等字段。
3. 如需导航入口，修改 `frontend/src/config/site.ts`。
4. 文档详情路由优先使用 `abbrlink`。

## 🔍 搜索与浏览器端数据

- 🔎 搜索索引由 `frontend/src/pages/search-index.json.ts` 生成。
- 🧵 搜索、随机文章、收藏回查、每日推荐都复用 `frontend/src/lib/search-worker.js`。
- ⭐ 收藏数据保存在浏览器 IndexedDB：`singureo-favorites`。
- 🌓 主题偏好保存在 localStorage。
- 🔐 这些数据只保存在当前浏览器，不会自动同步到服务器。

## 💬 评论与统计

Artalk 配置集中在 `frontend/src/config/site.ts`：

```ts
artalk: {
  enabled: true,
  server: 'https://artalk.sin0.cc',
}
```

文章卡片和详情页会显示浏览量 / 评论数统计；文章详情页会加载评论区，并随当前主题同步深浅色。

## 🚦 外链跳转

外链逻辑位于 `frontend/src/lib/redirect.ts`，配置位于 `site.redirect`：

- ✅ 站内链接保持原样。
- ✅ 白名单域名可直接打开。
- ⚠️ 非白名单 HTTP / HTTPS 外链会转换到 `/go?url=...`。
- ⏳ `/go` 页面显示离站提示和倒计时。

## 🎨 视觉风格

项目当前设计倾向：

- 🌿 简洁、中性、内容优先。
- ⚪ 浅色模式以白色和浅灰为主。
- ⚫ 深色模式以黑色和近黑色为主。
- 🔵 主色只用于关键操作、选中状态和重点反馈。
- 🃏 文章卡片使用清晰边框、克制圆角和封面优先布局。
- 🌘 暗色模式下图片自动降低亮度，避免阅读时过亮。
- 🧭 导航使用胶囊式布局，桌面端和移动端分别适配。

## 🚀 部署说明

项目适合部署到支持 Node.js 构建和静态文件托管的平台。

基本流程：

```bash
cd frontend
npm ci
npm run build
```

构建产物通常输出到：

```text
frontend/dist
```

部署前建议确认：

- 🌐 `frontend/astro.config.mjs` 中的 `site` 是否为生产域名。
- 🧭 `frontend/src/config/site.ts` 中导航、广告、友链、页脚链接是否正确。
- 💬 Artalk 服务是否允许当前站点域名。
- 🖼️ 外部图片域名是否可访问。
- 🔗 下载链接是否需要进入 `/go` 离站提示。

## 📌 项目状态备注

- 根目录 `package.json` 目前只是占位，实际脚本在 `frontend/package.json`。
- 当前样式入口是 `frontend/src/styles/SingureoMain.css`。
- 首页当前展示的是广告图、最新评论、最新文档和最新文章列表。
- 首页最新文章支持通过 frontmatter 的 `pinned: true` 进行置顶。

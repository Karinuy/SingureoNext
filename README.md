# SingureoNext

SingureoNext 是 Singureo 站点的新一代静态生成项目。它以 Galgame 与 ACG 资源内容整理为核心，使用 Astro 构建可部署到静态托管平台的前端站点，并通过浏览器端脚本补充搜索、收藏、每日推荐、主题切换、外链跳转确认、评论加载等交互能力。

项目当前没有独立后端服务目录，主要能力由以下几部分组成：

- Astro SSG 负责页面生成、路由、内容集合、SEO 元信息和站点地图。
- Markdown 文章集合承载资源条目。
- MDX 文档集合承载公告、教程和关于页面。
- 浏览器 Web Worker 加载 `/search-index.json`，使用 FlexSearch 完成本地搜索、随机文章、收藏文章回显和每日推荐。
- IndexedDB 保存用户本地收藏，并支持收藏导入/导出。
- Artalk 作为外部评论系统接入。
- vanilla-lazyload 驱动全站图片懒加载，并提供加载完成后的高斯模糊过渡动画。

## 项目定位

SingureoNext 面向内容量较大的 Galgame/ACG 资源型站点。它的目标不是做一个重后台系统，而是用静态生成保证访问速度、可缓存性和部署简单性，同时在浏览器侧实现用户常用的个性化体验。

站点体验重点包括：

- 首页快速浏览最新文章、公告、轮播图和广告位。
- 分类、标签、分页归档用于大批量内容导航。
- 文章详情页展示封面、分类、标签、正文、下载入口、分享、收藏、相关推荐和评论。
- 顶部搜索按钮与搜索页支持关键词检索。
- 收藏页使用本地浏览器数据，不依赖登录账号。
- 每日推荐根据收藏内容优先推荐相同分类或标签的文章。
- 外链统一经过安全提示页，白名单域名可直接打开。
- 浅色/深色主题全站统一，并对暗色模式下的图片亮度做处理。

## 技术栈

核心依赖：

- Astro 6：静态站点生成、文件路由、内容集合、资源处理。
- TypeScript：前端脚本、内容工具、类型定义。
- Tailwind CSS：全站样式系统。
- MDX：文档内容编写。
- FlexSearch：浏览器端全文检索。
- vanilla-lazyload：图片懒加载。
- Embla Carousel：首页轮播。
- Artalk：评论系统。
- Lucide Astro：图标组件。
- IndexedDB：本地收藏存储。

Astro 配置位于 `frontend/astro.config.mjs`，当前包含：

- `site: 'https://www.singureo.com'`
- `@astrojs/sitemap`
- `@astrojs/mdx`
- 自定义 `rehypeLazyImages` 插件
- `passthroughImageService`
- Noto Sans SC、Noto Sans JP、Noto Sans Mono、Outfit 字体
- Vite 别名 `@ -> ./src`

## 仓库结构

```text
.
├─ README.md
├─ package.json
└─ frontend/
   ├─ README.md
   ├─ DESIGN.md
   ├─ sample-post.md
   ├─ package.json
   ├─ package-lock.json
   ├─ astro.config.mjs
   ├─ tailwind.config.mjs
   ├─ postcss.config.cjs
   ├─ public/
   │  ├─ favicon.ico
   │  └─ robots.txt
   ├─ scripts/
   │  ├─ ensure-abbrlink.mjs
   │  └─ replace_image_domain.py
   └─ src/
      ├─ components/
      ├─ components/ui/
      ├─ config/
      ├─ content/
      │  ├─ docs/
      │  └─ post/
      ├─ layouts/
      ├─ lib/
      ├─ pages/
      ├─ scripts/
      ├─ styles/
      └─ types/
```

根目录 `package.json` 目前只保留项目级元信息和占位脚本；实际开发、构建、预览命令都在 `frontend/package.json` 中执行。

## 主要目录说明

`frontend/src/pages`

Astro 文件路由目录，包含首页、分页、分类、标签、文章详情、文档、搜索、收藏、每日推荐、外链跳转页和搜索索引 JSON。

`frontend/src/content/post`

文章内容目录。每篇文章是一个 Markdown 文件，使用 frontmatter 描述标题、封面、分类、标签、下载链接、日期和永久短链。

`frontend/src/content/docs`

文档内容目录。当前用于公告、关于本站、模拟器教程、Winlator 教程和镜像版安装说明。

`frontend/src/components`

站点组件目录，包括导航栏、移动端抽屉、文章卡片、文章列表、首页轮播、公告、广告位、收藏按钮、下载按钮、评论、搜索入口、返回顶部、页脚等。

`frontend/src/components/ui`

基础 UI 组件目录，包括 Button、Card、Tag、Pagination、Dialog、Drawer、Alert、Breadcrumb 等。

`frontend/src/lib`

通用逻辑目录，包括内容读取、分页、slug 处理、文章卡片数据转换、摘要提取、外链跳转、搜索 Worker、收藏 IndexedDB、图片懒加载 rehype 插件等。

`frontend/src/scripts`

浏览器端初始化脚本目录，包括导航搜索、搜索结果页、收藏页、每日推荐页、移动端抽屉、动态文章列表渲染、图片懒加载更新等。

`frontend/src/styles`

全局样式目录。当前主要文件为 `globals.css`，定义 Tailwind 基础层、主题变量、暗色模式、懒加载动画、弹层动画、对话框样式和文章正文样式。

## 页面与路由

当前主要路由如下：

- `/`：首页，展示公告、轮播、广告位和最新文章列表。
- `/page/[page]/`：首页文章分页。
- `/posts/[slug]/`：文章详情页，slug 来自文章 `abbrlink` 或文件名。
- `/categories`：分类索引页。
- `/categories/page/[page]/`：分类索引分页。
- `/category/[slug]/`：单个分类文章列表。
- `/category/[slug]/page/[page]/`：单个分类文章分页。
- `/tags`：标签索引页。
- `/tags/page/[page]/`：标签索引分页。
- `/tag/[slug]/`：单个标签文章列表。
- `/tag/[slug]/page/[page]/`：单个标签文章分页。
- `/docs`：文档索引页。
- `/docs/[...slug]/`：文档详情页，通常使用文档 `abbrlink`。
- `/search`：搜索结果页。
- `/search-index.json`：构建时生成的搜索索引。
- `/favorites`：本地收藏页。
- `/daily`：每日推荐页。
- `/go`：外链跳转确认页。

## 内容模型

内容集合定义位于 `frontend/src/content.config.ts`。

### 文章字段

文章集合名为 `post`，来源为 `frontend/src/content/post/**/*.md`。当前支持字段：

- `title`：必填，文章标题。
- `description`：可选，页面描述；缺省时会从正文提取摘要。
- `cover`：可选，封面图片地址。
- `categories`：可选，文章分类；支持字符串、字符串数组或嵌套字符串数组。
- `tags`：可选，标签数组，默认空数组。
- `downloadUrl`：可选，兼容旧的单下载链接。
- `downloads`：可选，多下载入口数组，每项包含 `label` 和 `url`。
- `publishDate`：可选，发布日期。
- `date`：可选，日期字段；文章排序会使用 `publishDate`，没有则回退到 `date`。
- `abbrlink`：可选，文章稳定短链；没有时回退到文件名生成 slug。
- `updatedDate`：可选，更新时间。
- `draft`：可选，草稿标记，默认 `false`。

注意：当前项目以 `categories` 作为唯一分类数据字段，不再使用 `category`。

### 文章示例

```md
---
title: 示例文章
cover: CoverUrl
categories:
  - - 示例分类
tags:
  - 示例
downloads:
  - label: OneDrive下载
    url: OneDriveDownloadUrl
abbrlink: demo-001
date: 2026-01-28 12:00:00
---

## 游戏介绍

这里是正文示例。
```

### 文档字段

文档集合名为 `docs`，来源为 `frontend/src/content/docs/**/*.mdx`。当前支持字段：

- `title`：必填，文档标题。
- `description`：可选，页面描述。
- `cover`：可选，封面图片地址。
- `date`：可选，发布日期。
- `updatedDate`：可选，更新时间。
- `abbrlink`：可选，文档短链。
- `draft`：可选，草稿标记，默认 `false`。

## 核心功能

### 静态生成

项目通过 Astro 内容集合读取文章和文档，在构建阶段生成静态页面。文章、分类、标签、文档和分页路由都基于内容数据生成，适合部署到静态托管平台或 CDN。

### 文章详情

文章详情页提供：

- 封面展示与新标签页打开原图。
- 多分类和多标签展示。
- 下载按钮，支持 `downloads` 多链接。
- 分享按钮。
- 本地收藏按钮。
- 基于相同标签的相关推荐。
- Artalk 评论区。
- SEO 标题、描述、关键词和 Open Graph 图片。

### 分类和标签

分类与标签都由文章 frontmatter 自动聚合，不需要手动维护索引文件。索引页显示每个分类或标签下的文章数量，并在内容较多时自动分页。

文章卡片中分类和标签分为两行展示：

- 分类独占一行。
- 标签独占一行。
- 不限制显示数量。
- 超出卡片宽度时横向滑动。

### 本地搜索

搜索数据由 `frontend/src/pages/search-index.json.ts` 生成。浏览器加载 `/search-index.json` 后，在 `frontend/src/lib/search-worker.js` 中使用 FlexSearch 建立索引。

搜索实现特点：

- 使用 Web Worker，避免阻塞主线程。
- 对搜索文本做 NFKC 标准化、小写化和空白合并。
- 使用 `tokenize: 'forward'` 支持前向分词。
- 搜索字段包含标题、描述、分类、标签和正文摘要。
- 标题、标签、分类、描述、正文有不同权重。
- 搜索页最多返回 60 条结果。

### 随机文章

导航中的随机按钮复用搜索 Worker 中已加载的索引，从全站文章中随机选择一篇并跳转到对应文章详情页。

### 本地收藏

收藏数据保存在浏览器 IndexedDB 中，数据库名为 `singureo-favorites`。收藏记录包含：

- `id`
- `slug`
- `createdAt`

收藏页会根据本地保存的 slug 调用搜索 Worker 回查文章详情。用户可以导出收藏 JSON，也可以通过覆盖导入迁移收藏数据。

### 每日推荐

每日推荐页会读取本地收藏：

- 如果有收藏，优先从相同分类或相同标签的文章中推荐。
- 如果没有可用收藏或没有匹配内容，则从全站文章池推荐。
- 使用日期和收藏 slug 生成稳定随机种子。
- 每日最多展示 24 篇。
- 推荐结果每天刷新一次。

### 外链跳转

外链处理逻辑位于 `frontend/src/lib/redirect.ts`。

默认行为：

- 站内链接保持原样。
- HTTP/HTTPS 外链在新标签页打开。
- 未命中白名单的外链会转换为 `/go?url=...`。
- `/go` 页面展示离站提示和倒计时。
- 白名单、倒计时和提示文案在 `frontend/src/config/site.ts` 中配置。

### 评论系统

文章详情页通过 Artalk 接入评论。配置位于 `frontend/src/config/site.ts`：

- `artalk.enabled`
- `artalk.server`

布局会在空闲时间预加载 Artalk，并根据当前主题同步评论区暗色模式。

### 图片懒加载

全站图片懒加载由 `vanilla-lazyload` 驱动。

相关实现：

- `frontend/src/components/LazyImage.astro` 用于组件内图片。
- `frontend/src/lib/rehype-lazy-images.mjs` 自动改写 Markdown/MDX 正文图片。
- `frontend/src/scripts/lazyload.ts` 初始化 LazyLoad 实例。
- LazyLoad 使用 `.lazy` 作为选择器。
- `threshold: 0`，图片进入当前视窗范围才开始加载。
- 动态渲染文章列表后会调用 `updateLazyImages()` 更新懒加载实例。

加载动画定义在 `frontend/src/styles/globals.css`：

- 未加载图片初始 `opacity: 0`。
- 使用 `blur(32px)` 和轻微放大制造明显高斯模糊占位。
- 加载完成后渐变到清晰状态。
- 过渡时间较慢，滤镜与缩放约 960ms，透明度约 720ms。
- 尊重 `prefers-reduced-motion: reduce`，减少动态效果。

## 站点配置

主要站点配置集中在 `frontend/src/config/site.ts`，包括：

- 站点名称、标语、浏览器标签页标语。
- SEO 关键词。
- Logo 文本。
- 桌面和移动端导航。
- 首页轮播。
- 首页公告。
- 广告位。
- 友情链接。
- 页脚链接。
- 外链跳转白名单和倒计时。
- 评论开关。
- Artalk 服务地址。

新增页面或调整站点运营内容时，优先检查该配置文件，避免把可配置内容写死在组件里。

## 视觉与交互设计

项目的设计说明位于 `frontend/DESIGN.md`。当前实现遵循以下方向：

- 中性、简洁、内容优先。
- 浅色模式以白色为主，深色模式以纯黑和近黑色为主。
- 主题色只用于关键操作、选中状态和重要反馈。
- 卡片使用清晰边框和克制阴影。
- 文章卡片采用上图下文结构，底部固定分类和标签区域。
- 暗色模式下图片默认轻微压暗，避免过亮图片破坏阅读体验。
- 弹层、抽屉、对话框使用统一的动画变量。
- 支持浏览器 View Transition 的主题切换动画。
- 全站隐藏滚动条，但保留滚动能力。

## 开发命令

进入前端目录后执行命令：

```bash
cd frontend
npm install
npm run dev
```

常用脚本：

```bash
npm run dev
npm run build
npm run preview
npm run astro
npm run ensure:abbrlink
```

脚本说明：

- `npm run dev`：启动 Astro 开发服务器。
- `npm run build`：生成生产静态站点。
- `npm run preview`：本地预览构建结果。
- `npm run astro`：运行 Astro CLI。
- `npm run ensure:abbrlink`：检查并补齐内容文件中的 `abbrlink`。

`frontend/package.json` 中配置了：

- `predev`: `node scripts/ensure-abbrlink.mjs`
- `prebuild`: `node scripts/ensure-abbrlink.mjs`

因此运行开发或构建命令前，会自动检查文章和文档的 `abbrlink` 唯一性。

## 内容维护流程

新增文章建议流程：

1. 在 `frontend/src/content/post` 新建 Markdown 文件。
2. 按内容模型填写 frontmatter。
3. 使用 `categories` 配置全部分类。
4. 使用 `tags` 配置厂商、作品系列或其他检索标签。
5. 配置 `cover`，保证卡片和详情页有稳定封面。
6. 配置 `downloads`，优先使用多下载入口格式。
7. 运行 `npm run ensure:abbrlink` 补齐或校验短链。

新增文档建议流程：

1. 在 `frontend/src/content/docs` 下创建 MDX 文件。
2. 配置 `title`、`description`、`abbrlink`、`date` 等字段。
3. 文档详情路由会优先使用 `abbrlink`。
4. 如需在导航中露出入口，修改 `frontend/src/config/site.ts`。

## 辅助脚本

`frontend/scripts/ensure-abbrlink.mjs`

用于遍历 `src/content` 下的 Markdown/MDX 文件，确保每个内容条目都有唯一 `abbrlink`。脚本使用 CRC32 生成短链，并会处理重复值。

`frontend/scripts/replace_image_domain.py`

用于批量替换内容文件中的图片域名。

## 部署说明

项目可以部署到支持 Node.js 构建和静态文件托管的平台。基本流程：

```bash
cd frontend
npm ci
npm run build
```

构建产物由 Astro 输出，通常位于 `frontend/dist`。

部署前需要重点确认：

- `frontend/astro.config.mjs` 中的 `site` 是否为生产域名。
- `frontend/src/config/site.ts` 中的导航、外链白名单、广告位、友链、评论服务是否正确。
- Artalk 服务是否允许当前站点域名。
- 内容中的外部图片域名是否可访问。
- 下载链接是否需要进入 `/go` 离站提示。

## SEO 与可发现性

`BaseLayout.astro` 统一处理页面 SEO：

- `title`
- `description`
- `keywords`
- canonical URL
- Open Graph
- Twitter Card
- robots
- sitemap 链接

文章详情页会将文章标题、分类和标签合并为关键词，并使用封面作为社交分享图。

## 浏览器端数据

项目会在用户浏览器中保存少量本地数据：

- `theme`：当前浅色/深色主题，保存在 localStorage。
- `singureo-favorites`：收藏数据，保存在 IndexedDB。

这些数据都仅保存在当前浏览器环境，不会自动同步到服务器。

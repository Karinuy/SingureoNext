# Singureo Search API Worker 配置说明

这个 Worker 用来接管原先前端直接请求 `/search-index.json` 后在浏览器内处理的功能，包括搜索、随机文章、每日推荐和收藏页文章详情查询。搜索打分、随机抽取、每日推荐算法都在 Worker 后端执行，前端只请求处理后的结果，避免每个用户都下载完整索引。

## 前端配置

前端请求后端 API 的地址直接在 `src/config/site.ts` 中配置：

```ts
api: {
  searchBaseUrl: 'https://your-search-api-worker.your-subdomain.workers.dev',
},
```

如果你把 Worker 绑定到自定义路径，例如 `https://www.example.com/api/search-api`，这里就填写这个基础地址，末尾不要加 `/`。

## Worker 控制台变量

以下变量必须在 Cloudflare Worker 控制台的 `Settings` -> `Variables and Secrets` 中配置，不要把生产值写进仓库。

```bash
SEARCH_INDEX_URL=https://www.singureo.com/search-index.json
ALLOWED_ORIGIN=https://www.singureo.com
INDEX_CACHE_TTL_SECONDS=300
```

变量含义：

- `SEARCH_INDEX_URL`：Worker 后端拉取完整搜索索引的地址，通常是线上站点的 `/search-index.json`。
- `ALLOWED_ORIGIN`：允许访问 Worker 的前端来源，用于 CORS 校验。多个来源可用英文逗号分隔，例如 `https://www.singureo.com,http://localhost:4321`。
- `INDEX_CACHE_TTL_SECONDS`：Worker 在 Cloudflare 边缘缓存完整索引的秒数，可选；不配置时默认 300 秒。

`workers/search-api/wrangler.toml` 中已经配置 `keep_vars = true`。这样执行 `npm run worker:deploy` 时，Wrangler 会保留 Cloudflare 控制台中已有的运行时变量，不会因为配置文件里没有 `[vars]` 而清空它们。

本地调试时，可以在 `workers/search-api/.dev.vars` 中填写同样的变量；`.dev.vars` 已加入 `.gitignore`，不会提交到仓库。

## Worker 接口

- `GET /search?q=关键词`：返回搜索结果，Worker 内部完成关键词打分。
- `GET /random`：返回一个随机文章。
- `POST /daily-recommend`：请求体 `{ "favoriteSlugs": ["slug-a"] }`，返回每日推荐结果。推荐结果按北京时间自然日生成，同一天同一收藏集合返回相同结果，每天 24 点统一刷新。
- `POST /posts-by-slugs`：请求体 `{ "slugs": ["slug-a"] }`，返回收藏页需要展示的文章卡片数据。
- `GET /health`：健康检查。

## 部署命令

先在 Cloudflare 控制台配置变量，然后运行：

```bash
npm run worker:deploy
```

本地调试 Worker：

```bash
npm run worker:dev
```

Worker 配置文件位于 `workers/search-api/wrangler.toml`，入口文件位于 `workers/search-api/src/index.ts`。

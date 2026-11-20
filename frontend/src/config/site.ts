export const site = {
  name: 'Singureo',
  tagline: 'Singureo是以Galgame为主的资源分享网站，贯彻简洁美观人性化的理念，为用户提供优质的体验！',
  tabTagline: '简洁·美观·人性化！',
  keywords: ['Singureo', 'ACG资源站', '免费galgame', 'galgame', '东方project', 'galgame汉化', '不限速下载', 'galgame资源站'],
  nav: [
    { label: '首页', href: '/', icon: 'home' },
    {
      label: '分类',
      href: '/categories',
      icon: 'folder',
      children: [
        { label: '东方Project', href: '/category/东方Project/' },
        { label: 'Galgame', href: '/category/Galgame/' },
        { label: 'PC资源', href: '/category/PC资源/' },
        { label: 'PE资源', href: '/category/PE资源/' },
      ],
    },
    { label: '标签', href: '/tags', icon: 'tags' },
    {
      label: '文档',
      href: '/docs',
      icon: 'fileText',
      children: [
        { label: '公告板', href: '/docs/notice/' },
        { label: '关于本站', href: '/docs/about/' },
      ],
    },
    {
      label: '更多',
      href: '/',
      icon: 'layout-grid',
      children: [
        { label: 'AI识图', href: '/anime-trace', icon: 'scanSearch' },
        { label: '收藏', href: '/favorites', icon: 'heart' },
        { label: '每日推荐', href: '/daily', icon: 'calendarDays' },
        { label: '留言板', href: '/guestbook', icon: 'messages-square' },
      ],
    },    
  ],
  ads: {
    enabled: true,
    items: [
      { title: '广告示例', href: 'https://baidu.com/', image: 'https://baidu.com/1.jpg' },
    ],
  },
  friendLinks: [
    { label: 'baidu', href: 'https://baidu.com/' },
  ],
  footerLinks: [
    { label: '关于本站', href: '/docs/about/' },
    { label: 'RSS', href: '/rss.xml' },
  ],
  rss: {
    enabled: true,
    path: '/rss.xml',
    title: 'Singureo RSS',
    description: '实时获取Singureo的更新',
    language: 'zh-CN',
    limit: 50,
    descriptionLength: 160,
  },
  redirect: {
    enabled: true,
    countdown: 3,
    whitelist: [
      'www.singureo.com',
      'res.sin0.cc',
      'ays.sin0.cc',
      'url.sin0.cc',
    ],
    message: '您即将离开本站，前往第三方网站。请注意您的账号和财产安全。',
  },
  artalk: {
    enabled: true,
    server: 'https://artalk.sin0.cc',
    latestComments: {
      enabled: true,
      limit: 6,
    },
  },
  animeTrace: {
    enabled: true,
    apiBaseUrl: 'https://api.animetrace.com',
    isMulti: true,
    aiDetect: true,
  },
};


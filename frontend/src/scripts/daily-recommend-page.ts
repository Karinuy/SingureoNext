import { listFavorites } from '@/lib/favorites-db';
import { getDailyRecommendations } from '@/api/search';
import { renderPostList } from '@/scripts/render-post-list';

export function initDailyRecommendPage() {
  const mount = document.querySelector('[data-daily-recommend-page]');
  const results = mount?.querySelector('[data-daily-recommend-results]');
  if (!(mount instanceof HTMLElement) || !(results instanceof HTMLElement) || mount.dataset.bound === 'true') return;
  mount.dataset.bound = 'true';

  listFavorites()
    .then(async (favorites) => {
      const favoriteSlugs = favorites.map((item) => item.slug);
      const daily = await getDailyRecommendations(favoriteSlugs);
      renderPostList(results, daily.items, { emptyMessage: '暂无可推荐文章' });
    })
    .catch(() => {
      renderPostList(results, [], { emptyMessage: '加载失败' });
    });
}

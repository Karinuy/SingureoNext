import { exportFavorites, importFavorites, listFavorites } from '@/lib/favorites-db';
import { getPostsBySlugs } from '@/api/search';
import { renderPostList } from '@/scripts/render-post-list';

export function initFavoritesPage() {
  const mount = document.querySelector('[data-favorites-page]');
  if (!(mount instanceof HTMLElement) || mount.dataset.bound === 'true') return;
  mount.dataset.bound = 'true';

  const results = mount.querySelector('[data-favorites-results]');
  const exportButton = mount.querySelector('[data-favorites-export]');
  const importToggle = mount.querySelector('#favorites-import-dialog');
  const importFileInput = mount.querySelector('[data-favorites-import-file]');
  const importFileName = mount.querySelector('[data-favorites-import-file-name]');
  const importConfirmButton = mount.querySelector('[data-favorites-import-confirm]');

  if (
    !(results instanceof HTMLElement) ||
    !(exportButton instanceof HTMLButtonElement) ||
    !(importToggle instanceof HTMLInputElement) ||
    !(importFileInput instanceof HTMLInputElement) ||
    !(importFileName instanceof HTMLElement) ||
    !(importConfirmButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  const reload = async () => {
    try {
      const favorites = await listFavorites();
      const { items } = await getPostsBySlugs(favorites.map((favorite) => favorite.slug));
      renderPostList(results, items, { hideCoverPlaceholder: true });
    } catch {
      renderPostList(results, []);
    }
  };

  const importSelectedFile = async () => {
    const file = importFileInput.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await importFavorites(json, 'replace');
    } catch {
      return;
    }

    await reload();
    importToggle.checked = false;
    importFileInput.value = '';
    importFileName.textContent = '尚未选择文件';
  };

  exportButton.addEventListener('click', async () => {
    try {
      const data = await exportFavorites();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `favorites-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
    }
  });

  importFileInput.addEventListener('change', () => {
    importFileName.textContent = importFileInput.files?.[0]?.name || '尚未选择文件';
  });

  importConfirmButton.addEventListener('click', () => {
    void importSelectedFile();
  });

  reload();
}

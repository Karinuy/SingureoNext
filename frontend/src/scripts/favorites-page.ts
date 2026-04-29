import Swal from 'sweetalert2';
import { exportFavorites, importFavorites, listFavorites } from '@/lib/favorites-db';
import { getPostsBySlugs } from '@/api/search';
import { getPopupAnimationOptions, showToast } from '@/scripts/sweetalert';
import { renderPostList } from '@/scripts/render-post-list';

export function initFavoritesPage() {
  const mount = document.querySelector('[data-favorites-page]');
  if (!(mount instanceof HTMLElement) || mount.dataset.bound === 'true') return;
  mount.dataset.bound = 'true';

  const results = mount.querySelector('[data-favorites-results]');
  const exportButton = mount.querySelector('[data-favorites-export]');
  const openButton = mount.querySelector('[data-favorites-import-open]');

  if (!(results instanceof HTMLElement) || !(exportButton instanceof HTMLButtonElement) || !(openButton instanceof HTMLButtonElement)) {
    return;
  }

  const reload = async () => {
    try {
      const favorites = await listFavorites();
      const { items } = await getPostsBySlugs(favorites.map((favorite) => favorite.slug));
      renderPostList(results, items, { hideCoverPlaceholder: true, emptyMessage: '暂无收藏内容' });
    } catch (error) {
      showToast(error instanceof Error ? error.message : '无法读取收藏数据', 'error');
    }
  };

  const openImportDialog = async () => {
    const modeResult = await Swal.fire({
      title: '选择导入方式',
      text: '覆盖导入会先清空当前收藏，合并导入会在保留当前收藏基础上追加。',
      input: 'radio',
      inputOptions: {
        replace: '覆盖导入',
        merge: '合并导入',
      },
      inputValue: 'replace',
      inputValidator: (value) => (!value ? '请选择导入方式' : undefined),
      showCancelButton: true,
      confirmButtonText: '下一步',
      cancelButtonText: '取消',
      ...getPopupAnimationOptions(),
    });

    if (!modeResult.isConfirmed || !modeResult.value) return;

    const fileResult = await Swal.fire({
      title: '选择 JSON 文件',
      input: 'file',
      inputAttributes: {
        accept: 'application/json',
      },
      inputValidator: (value) => (!value ? '请选择要导入的文件' : undefined),
      showCancelButton: true,
      confirmButtonText: '开始导入',
      cancelButtonText: '取消',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      ...getPopupAnimationOptions(),
      preConfirm: async (value) => {
        const file = value instanceof File ? value : null;
        if (!file) return false;
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          await importFavorites(json, modeResult.value === 'merge' ? 'merge' : 'replace');
          return true;
        } catch (error) {
          Swal.showValidationMessage(error instanceof Error ? error.message : '导入失败');
          return false;
        }
      }
    });

    if (!fileResult.isConfirmed) return;
    await reload();
    showToast('导入完成', 'success');
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
      showToast('已导出收藏数据', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '导出失败', 'error');
    }
  });

  openButton.addEventListener('click', () => {
    void openImportDialog();
  });

  reload();
}

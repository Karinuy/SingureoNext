import { exportFavorites, importFavorites, listFavorites } from '@/lib/favorites-db';
import { getPostsBySlugs } from '@/api/search';
import { showDialog, showToast } from '@/scripts/feedback';
import { renderPostList } from '@/scripts/render-post-list';
import { createTabs } from '@/scripts/tabs';

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
    const importContent = createImportDialogContent();
    const confirmed = await showDialog({
      title: '导入收藏',
      message: '选择导入方式并上传备份 JSON 文件。',
      content: importContent.root,
      confirmText: '开始导入',
      cancelText: '取消',
      showCancel: true,
      closeOnBackdrop: false,
    });

    if (!confirmed) return;

    const file = importContent.fileInput.files?.[0];
    if (!file) {
      showToast('请选择要导入的文件', 'info');
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await importFavorites(json, importContent.getMode());
    } catch (error) {
      showToast(error instanceof Error ? error.message : '导入失败', 'error');
      return;
    }

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

function createImportDialogContent() {
  let mode: 'replace' | 'merge' = 'replace';

  const root = document.createElement('div');
  root.className = 'favorites-import';

  const description = document.createElement('p');
  description.className = 'favorites-import__description';

  const syncDescription = (nextMode: 'replace' | 'merge') => {
    mode = nextMode;
    description.textContent =
      mode === 'replace'
        ? '覆盖导入会先清空当前收藏，再写入 JSON 文件中的收藏数据。'
        : '合并导入会保留当前收藏，并追加 JSON 文件中的新收藏。';
  };

  const tabs = createTabs<'replace' | 'merge'>({
    value: mode,
    options: [
      { value: 'replace', label: '覆盖导入' },
      { value: 'merge', label: '合并导入' },
    ],
    onChange: syncDescription,
  });

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.className = 'favorites-import__file-input';

  const picker = document.createElement('label');
  picker.className = 'favorites-import__picker';

  const pickerTitle = document.createElement('span');
  pickerTitle.className = 'favorites-import__picker-title';
  pickerTitle.textContent = '选择 JSON 文件';

  const pickerText = document.createElement('span');
  pickerText.className = 'favorites-import__picker-text';
  pickerText.textContent = '支持从收藏页导出的 .json 备份文件';

  const fileName = document.createElement('span');
  fileName.className = 'favorites-import__file-name';
  fileName.textContent = '尚未选择文件';

  picker.append(input, pickerTitle, pickerText, fileName);
  input.addEventListener('change', () => {
    fileName.textContent = input.files?.[0]?.name || '尚未选择文件';
  });

  root.append(tabs.root, description, picker);
  syncDescription(mode);

  return {
    root,
    fileInput: input,
    getMode: () => mode,
  };
}

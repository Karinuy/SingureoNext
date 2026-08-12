type AnimeTraceRoot = HTMLElement & {
  dataset: DOMStringMap & {
    apiBaseUrl?: string;
    isMulti?: string;
    aiDetect?: string;
    bound?: string;
  };
};

type AnimeTraceModel = {
  id?: string;
  name?: string;
  provider?: string;
  enabled?: boolean;
  default?: boolean;
  desc?: {
    ja?: string;
    en?: string;
    zh?: string;
  };
};

type AnimeTraceModelListResponse = {
  code?: number;
  message?: string;
  data?: AnimeTraceModel[];
};

type AnimeTraceResult = {
  box?: number[];
  box_id?: string;
  not_confident?: boolean;
  character?: Array<{
    work?: string;
    character?: string;
  }>;
};

type AnimeTraceSearchResponse = {
  code?: number;
  message?: string;
  ai?: boolean;
  trace_id?: string;
  data?: AnimeTraceResult[];
};

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  for (const key of ['data', 'models', 'result', 'results']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function normalizeModels(payload: unknown): AnimeTraceModel[] {
  return getArrayPayload(payload)
    .map((item) => {
      if (typeof item === 'string') return { id: item, name: item, enabled: true };
      if (!item || typeof item !== 'object') return null;
      return item as AnimeTraceModel;
    })
    .filter((item): item is AnimeTraceModel => {
      if (!item || !item.id?.trim()) return false;
      return item.enabled !== false;
    });
}

function normalizeSearchResponse(payload: unknown): AnimeTraceSearchResponse {
  if (!payload || typeof payload !== 'object') return {};
  const response = payload as AnimeTraceSearchResponse;
  return {
    ...response,
    data: Array.isArray(response.data) ? response.data : [],
  };
}

function renderResults(results: AnimeTraceResult[]) {
  if (!results.length) {
    return '<p class="anime-trace-empty">没有识别到匹配结果。</p>';
  }

  return results
    .map((item, index) => {
      const candidates = Array.isArray(item.character) ? item.character : [];
      const title = candidates[0]?.work || '未知作品';
      const character = candidates[0]?.character || '未知角色';
      const confidence = item.not_confident ? '可信度较低，请核对候选结果' : '可信度正常';
      const box = Array.isArray(item.box) ? item.box.map((value) => Number(value).toFixed(3)).join(', ') : '';

      return `
        <article class="anime-trace-result">
          <div class="anime-trace-result__index">${index + 1}</div>
          <div class="anime-trace-result__body">
            <h2 class="anime-trace-result__title">${escapeHtml(String(title))}</h2>
            <p class="anime-trace-result__meta">${escapeHtml(character)} · ${escapeHtml(confidence)}</p>
            ${box ? `<p class="anime-trace-result__box">位置：${escapeHtml(box)}</p>` : ''}
            ${candidates.length > 1 ? `<ol class="anime-trace-candidates">${candidates
              .slice(1)
              .map((candidate) => `<li>${escapeHtml(candidate.work || '未知作品')} / ${escapeHtml(candidate.character || '未知角色')}</li>`)
              .join('')}</ol>` : ''}
          </div>
        </article>
      `;
    })
    .join('');
}

export function initAnimeTracePage() {
  document.querySelectorAll<AnimeTraceRoot>('[data-anime-trace-page]').forEach((root) => {
    if (root.dataset.bound === 'true') return;
    root.dataset.bound = 'true';

    const apiBaseUrl = normalizeApiBaseUrl(root.dataset.apiBaseUrl || '');
    const form = root.querySelector<HTMLFormElement>('[data-anime-trace-form]');
    const modelSelect = root.querySelector<HTMLSelectElement>('[data-anime-trace-model]');
    const modelPicker = root.querySelector<HTMLElement>('[data-anime-trace-model-picker]');
    const modelTrigger = root.querySelector<HTMLButtonElement>('[data-anime-trace-model-trigger]');
    const modelValue = root.querySelector<HTMLElement>('[data-anime-trace-model-value]');
    const modelMenu = root.querySelector<HTMLElement>('[data-anime-trace-model-menu]');
    const fileInput = root.querySelector<HTMLInputElement>('[data-anime-trace-file]');
    const fileName = root.querySelector<HTMLElement>('[data-anime-trace-file-name]');
    const urlInput = root.querySelector<HTMLInputElement>('[data-anime-trace-url]');
    const filePanel = root.querySelector<HTMLElement>('[data-anime-trace-file-panel]');
    const resultPanel = root.querySelector<HTMLElement>('[data-anime-trace-result-panel]');
    const preview = root.querySelector<HTMLElement>('[data-anime-trace-preview]');
    const results = root.querySelector<HTMLElement>('[data-anime-trace-results]');
    const status = root.querySelector<HTMLElement>('[data-anime-trace-status]');
    const submit = root.querySelector<HTMLButtonElement>('[data-anime-trace-submit]');

    if (!apiBaseUrl || !form || !modelSelect || !modelTrigger || !modelValue || !modelMenu || !fileInput || !urlInput || !resultPanel || !preview || !results || !status || !submit) {
      return;
    }

    const setStatus = (message: string) => {
      status.textContent = message;
    };

    const syncSubmit = () => {
      const hasModel = Boolean(modelSelect.value);
      const hasImage = Boolean(fileInput.files?.[0]) || Boolean(urlInput.value.trim());
      submit.disabled = !hasModel || !hasImage;
    };

    const closeModelMenu = () => {
      modelMenu.hidden = true;
      modelTrigger.setAttribute('aria-expanded', 'false');
    };

    const toggleModelMenu = () => {
      if (modelTrigger.disabled) return;
      const willOpen = modelMenu.hidden;
      modelMenu.hidden = !willOpen;
      modelTrigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    };

    const selectModel = (value: string, label: string) => {
      modelSelect.value = value;
      modelValue.textContent = label;
      modelMenu.querySelectorAll<HTMLElement>('[data-anime-trace-model-option]').forEach((option) => {
        const selected = option.dataset.value === value;
        option.classList.toggle('is-selected', selected);
        option.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      closeModelMenu();
      syncSubmit();
    };

    const setPreviewFile = (file: File | undefined) => {
      if (fileName) fileName.textContent = file?.name || '支持常见图片格式';
      syncSubmit();
    };

    const runSearch = async () => {
      submit.disabled = true;
      resultPanel.hidden = true;
      preview.innerHTML = '';
      results.innerHTML = '';
      setStatus('正在识别...');

      try {
        const formData = new FormData();
        const file = fileInput.files?.[0];
        const url = urlInput.value.trim();

        formData.set('model', modelSelect.value);
        formData.set('is_multi', root.dataset.isMulti === 'true' ? '1' : '0');
        formData.set('ai_detect', root.dataset.aiDetect === 'true' ? '1' : '0');

        if (file) {
          formData.set('file', file);
          preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="" data-no-dark-dim />`;
        } else if (url) {
          formData.set('url', url);
          preview.innerHTML = `<img src="${escapeHtml(url)}" alt="" data-no-dark-dim />`;
        } else {
          throw new Error('请选择图片或输入图片 URL');
        }

        const response = await fetch(`${apiBaseUrl}/v1/search`, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`识别失败：${response.status}`);

        const payload = normalizeSearchResponse(await response.json());
        if (payload.code && payload.code !== 0 && payload.code !== 17720 && payload.code !== 200) {
          throw new Error(payload.message || `识别失败：${payload.code}`);
        }

        results.innerHTML = renderResults(payload.data ?? []);
        resultPanel.hidden = false;
        const aiText = typeof payload.ai === 'boolean' ? `AI检测：${payload.ai ? '疑似 AI 生成' : '非 AI 生成'}` : '';
        const traceText = payload.trace_id ? `Trace ID：${payload.trace_id}` : '';
        setStatus(['识别完成。', aiText, traceText].filter(Boolean).join(' '));
      } catch (error) {
        results.innerHTML = '';
        setStatus(error instanceof Error ? error.message : '识别失败');
      } finally {
        syncSubmit();
      }
    };

    fileInput.addEventListener('change', () => {
      setPreviewFile(fileInput.files?.[0]);
    });

    filePanel?.addEventListener('dragover', (event) => {
      event.preventDefault();
      filePanel.classList.add('is-dragging');
    });

    filePanel?.addEventListener('dragleave', () => {
      filePanel.classList.remove('is-dragging');
    });

    filePanel?.addEventListener('drop', (event) => {
      event.preventDefault();
      filePanel.classList.remove('is-dragging');

      const file = event.dataTransfer?.files?.[0];
      if (!file) return;

      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
      setPreviewFile(file);
    });

    fileInput.addEventListener('click', () => {
      if (filePanel) {
        filePanel.classList.remove('is-dragging');
      }
    });

    urlInput.addEventListener('input', syncSubmit);
    modelSelect.addEventListener('change', () => {
      const selectedOption = modelSelect.selectedOptions[0];
      if (selectedOption) {
        selectModel(selectedOption.value, selectedOption.textContent || selectedOption.value);
      }
    });

    modelTrigger.addEventListener('click', toggleModelMenu);

    document.addEventListener('click', (event) => {
      if (!modelPicker?.contains(event.target as Node)) {
        closeModelMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModelMenu();
      }
    });

    const loadModels = async () => {
      const response = await fetch(`${apiBaseUrl}/v1/model/list`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`模型列表加载失败：${response.status}`);

      const payload = (await response.json()) as AnimeTraceModelListResponse;
      if (payload.code && payload.code !== 0 && payload.code !== 200) {
        throw new Error(payload.message || `模型列表加载失败：${payload.code}`);
      }

      const models = normalizeModels(payload);
      if (!models.length) throw new Error('模型列表为空');

      modelSelect.innerHTML = models
        .map((model) => {
          const value = model.id ?? '';
          const label = model.name ?? value;
          const provider = model.provider ? ` · ${model.provider}` : '';
          const selected = model.default ? ' selected' : '';
          return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label + provider)}</option>`;
        })
        .join('');
      modelSelect.disabled = false;
      modelTrigger.disabled = false;
      modelMenu.innerHTML = models
        .map((model) => {
          const value = model.id ?? '';
          const label = model.name ?? value;
          const provider = model.provider ? ` · ${model.provider}` : '';
          const optionLabel = label + provider;
          const selected = modelSelect.value === value ? ' is-selected' : '';
          const ariaSelected = modelSelect.value === value ? 'true' : 'false';
          return `<button class="anime-trace-select__option${selected}" type="button" role="option" aria-selected="${ariaSelected}" data-anime-trace-model-option data-value="${escapeHtml(value)}">${escapeHtml(optionLabel)}</button>`;
        })
        .join('');
      modelMenu.querySelectorAll<HTMLButtonElement>('[data-anime-trace-model-option]').forEach((option) => {
        option.addEventListener('click', () => {
          selectModel(option.dataset.value || '', option.textContent || '');
        });
      });
      modelValue.textContent = modelSelect.selectedOptions[0]?.textContent || '请选择模型';
      setStatus('模型已加载，可以开始识别。');
      syncSubmit();

      const initialUrl = new URLSearchParams(window.location.search).get('url')?.trim();
      if (initialUrl) {
        urlInput.value = initialUrl;
        syncSubmit();
        void runSearch();
      }
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      void runSearch();
    });

    void loadModels().catch((error) => {
      modelSelect.innerHTML = '<option value="">模型加载失败</option>';
      modelValue.textContent = '模型加载失败';
      modelTrigger.disabled = true;
      modelMenu.hidden = true;
      setStatus(error instanceof Error ? error.message : '模型加载失败');
      syncSubmit();
    });
  });
}

import {
  buildArtalkAvatarUrl,
  commentAnchorHref,
  fetchArtalkLatestCommentsBundle,
  formatCommentTime,
  plainCommentText,
  type ArtalkGravatarConf,
  type ArtalkLatestComment,
} from '@/lib/artalk-latest-comments';

type LatestCommentsRoot = HTMLElement & {
  dataset: DOMStringMap & {
    server?: string;
    site?: string;
    limit?: string;
    bound?: string;
  };
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCommentCard(comment: ArtalkLatestComment, gravatar: ArtalkGravatarConf) {
  const nick = escapeHtml(comment.nick || '匿名');
  const text = escapeHtml(plainCommentText(comment.content || '') || '（无文本内容）');
  const time = escapeHtml(formatCommentTime(comment.date || ''));
  const href = escapeHtml(commentAnchorHref(comment));
  const replyNick = (comment.reply_comment ?? comment.parent_comment)?.nick?.trim();
  const avatarUrl = buildArtalkAvatarUrl(comment.email_encrypted, gravatar);
  const avatar = avatarUrl
    ? `<img class="latest-comments__avatar" src="${escapeHtml(avatarUrl)}" alt="" width="40" height="40" loading="lazy" decoding="async" data-no-dark-dim />`
    : `<span class="latest-comments__avatar" aria-hidden="true"></span>`;
  const badge =
    comment.badge_name?.trim()
      ? `<span class="latest-comments__badge" style="--badge-color:${escapeHtml(comment.badge_color || '#0883ff')}">${escapeHtml(comment.badge_name.trim())}</span>`
      : '';
  const reply =
    replyNick && Number(comment.rid || 0) > 0
      ? `<span class="latest-comments__reply">回复 ${escapeHtml(replyNick)}</span>`
      : '';

  return `
    <a class="latest-comments__item" href="${href}" aria-label="${nick} 的评论">
      ${avatar}
      <div class="latest-comments__body">
        <div class="latest-comments__meta">
          <span class="latest-comments__nick">${nick}</span>
          ${reply}
          ${badge}
          <time class="latest-comments__time">${time}</time>
        </div>
        <p class="latest-comments__content">${text}</p>
      </div>
    </a>
  `;
}

async function loadLatestComments(root: LatestCommentsRoot) {
  const list = root.querySelector<HTMLElement>('[data-latest-comments-list]');
  if (!list) return;

  const server = root.dataset.server?.trim();
  const siteName = root.dataset.site?.trim();
  const limit = Number(root.dataset.limit || 6);

  if (!server || !siteName) {
    list.innerHTML = `<p class="latest-comments__empty">评论服务暂未配置</p>`;
    return;
  }

  list.innerHTML = `<p class="latest-comments__empty">评论加载中...</p>`;

  try {
    const { comments, gravatar } = await fetchArtalkLatestCommentsBundle({
      server,
      siteName,
      limit: Number.isFinite(limit) ? limit : 6,
    });

    if (!comments.length) {
      list.innerHTML = `<p class="latest-comments__empty">暂无评论</p>`;
      return;
    }

    list.innerHTML = `<div class="latest-comments__grid">${comments
      .map((comment) => renderCommentCard(comment, gravatar))
      .join('')}</div>`;
  } catch {
    list.innerHTML = `<p class="latest-comments__empty">评论加载失败</p>`;
  }
}

export function initLatestComments() {
  document.querySelectorAll<LatestCommentsRoot>('[data-latest-comments]').forEach((root) => {
    void loadLatestComments(root);
  });
}

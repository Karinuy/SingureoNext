export type FeedbackType = 'primary' | 'success' | 'warning' | 'info' | 'error';

type NotificationOptions = {
  title?: string;
  message: string;
  type?: FeedbackType;
  duration?: number;
  showClose?: boolean;
};

type DialogOptions = {
  title: string;
  message?: string;
  content?: HTMLElement;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
};

const notificationTitles: Record<FeedbackType, string> = {
  primary: '提示',
  success: '成功',
  warning: '警告',
  info: '提示',
  error: '错误',
};

export function showToast(message: string, type?: FeedbackType) {
  return showNotification({ message, type });
}

export function showNotification({
  title,
  message,
  type,
  duration = 4500,
  showClose = true,
}: NotificationOptions) {
  const viewport = getNotificationViewport();
  const notification = document.createElement('section');
  notification.className = 'site-notification';
  if (type) notification.dataset.type = type;
  notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
  notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

  const body = document.createElement('div');
  body.className = 'site-notification__body';

  if (type) {
    const svg = cloneScriptIcon(`notification-${type}`);
    const icon = document.createElement('span');
    icon.className = 'site-notification__icon';
    icon.setAttribute('aria-hidden', 'true');
    if (svg) {
      icon.append(svg);
      notification.append(icon);
    }
  }

  const messageNode = document.createElement('p');
  messageNode.className = 'site-notification__message';
  messageNode.textContent = message;

  const resolvedTitle = title ?? (type ? notificationTitles[type] : undefined);
  if (resolvedTitle) {
    const titleNode = document.createElement('p');
    titleNode.className = 'site-notification__title';
    titleNode.textContent = resolvedTitle;
    body.append(titleNode);
  }

  body.append(messageNode);
  notification.append(body);

  let closeTimer = 0;
  const close = () => {
    if (notification.dataset.state === 'closing') return;
    if (closeTimer) window.clearTimeout(closeTimer);
    notification.dataset.state = 'closing';
    window.setTimeout(() => notification.remove(), 220);
  };

  if (showClose) {
    const closeButton = document.createElement('button');
    closeButton.className = 'site-notification__close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', '关闭通知');
    closeButton.append(cloneScriptIcon('close') ?? document.createTextNode('×'));
    closeButton.addEventListener('click', close);
    notification.append(closeButton);
  }

  viewport.append(notification);
  if (duration > 0) closeTimer = window.setTimeout(close, duration);
  return { close };
}

export function showDialog({
  title,
  message,
  content,
  confirmText = '确定',
  cancelText = '取消',
  showCancel = false,
  closeOnEsc = true,
  closeOnBackdrop = true,
}: DialogOptions) {
  return new Promise<boolean>((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'site-dialog-overlay';
    overlay.setAttribute('role', 'presentation');

    const dialog = document.createElement('section');
    dialog.className = 'site-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const header = document.createElement('header');
    header.className = 'site-dialog__header';

    const titleNode = document.createElement('h2');
    titleNode.className = 'site-dialog__title';
    titleNode.textContent = title;
    header.append(titleNode);

    const body = document.createElement('div');
    body.className = 'site-dialog__body';
    if (message) {
      const messageNode = document.createElement('p');
      messageNode.className = 'site-dialog__message';
      messageNode.textContent = message;
      body.append(messageNode);
    }
    if (content) body.append(content);

    const footer = document.createElement('footer');
    footer.className = 'site-dialog__footer';

    if (showCancel) {
      const cancelButton = document.createElement('button');
      cancelButton.className = 'site-dialog__button site-dialog__button--secondary';
      cancelButton.type = 'button';
      cancelButton.textContent = cancelText;
      cancelButton.addEventListener('click', () => close(false));
      footer.append(cancelButton);
    }

    const confirmButton = document.createElement('button');
    confirmButton.className = 'site-dialog__button site-dialog__button--primary';
    confirmButton.type = 'button';
    confirmButton.textContent = confirmText;
    confirmButton.addEventListener('click', () => close(true));
    footer.append(confirmButton);

    dialog.append(header, body, footer);
    overlay.append(dialog);
    document.body.append(overlay);

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let closed = false;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEsc) close(false);
    };

    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === overlay && closeOnBackdrop) close(false);
    };

    document.addEventListener('keydown', onKeydown);
    overlay.addEventListener('click', onBackdropClick);
    window.requestAnimationFrame(() => {
      overlay.dataset.state = 'open';
      confirmButton.focus();
    });

    function close(result: boolean) {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKeydown);
      overlay.removeEventListener('click', onBackdropClick);
      overlay.dataset.state = 'closing';
      window.setTimeout(() => {
        overlay.remove();
        previousActiveElement?.focus();
        resolve(result);
      }, 180);
    }
  });
}

function getNotificationViewport() {
  const existing = document.querySelector('[data-site-notification-viewport]');
  if (existing instanceof HTMLElement) return existing;

  const viewport = document.createElement('div');
  viewport.className = 'site-notification-viewport';
  viewport.dataset.siteNotificationViewport = '';
  document.body.append(viewport);
  return viewport;
}

function cloneScriptIcon(name: `notification-${FeedbackType}` | 'close') {
  const template = document.querySelector(`[data-script-icon-template="${name}"]`);
  if (!(template instanceof HTMLTemplateElement)) return null;

  const icon = template.content.firstElementChild?.cloneNode(true);
  return icon instanceof SVGElement ? icon : null;
}

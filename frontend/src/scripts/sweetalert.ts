import Swal from 'sweetalert2';

export type ToastType = 'success' | 'error' | 'info';

function getSwalTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: false,
});

export function showToast(message: string, type: ToastType = 'info') {
  return toast.fire({
    title: message,
    icon: type,
    theme: getSwalTheme(),
  });
}

export function getPopupAnimationOptions() {
  return {
    theme: getSwalTheme(),
    showClass: {
      popup: 'swal2-center-enter',
    },
    hideClass: {
      popup: 'swal2-center-leave',
    },
  } as const;
}

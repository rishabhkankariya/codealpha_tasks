import Swal from 'sweetalert2';

export const chatbotSwal = Swal.mixin({
  background: '#171717',
  color: '#FFFFFF',
  confirmButtonColor: '#10A37F',
  cancelButtonColor: '#262626',
  buttonsStyling: true,
  customClass: {
    popup: 'border border-chatBorder rounded-2xl font-sans',
    title: 'text-lg font-bold text-chatText',
    confirmButton: 'px-4 py-2 bg-chatPrimary hover:bg-chatPrimary/90 text-white font-semibold rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-chatPrimary/40 transition-colors',
    cancelButton: 'px-4 py-2 bg-chatCard border border-chatBorder text-chatTextMuted hover:text-chatText font-semibold rounded-lg cursor-pointer focus:outline-none transition-colors'
  }
});

export const showSuccess = (title: string, text: string) => {
  return chatbotSwal.fire({
    title,
    text,
    icon: 'success',
    timer: 2500,
    timerProgressBar: true
  });
};

export const showError = (title: string, text: string) => {
  return chatbotSwal.fire({
    title,
    text,
    icon: 'error'
  });
};

export const showConfirm = (title: string, text: string, confirmText = 'Confirm') => {
  return chatbotSwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    reverseButtons: true
  });
};

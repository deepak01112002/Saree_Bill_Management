import toast from 'react-hot-toast';

// Toast notification helpers
export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
    });
  },
  info: (message: string) => {
    toast(message, {
      duration: 3000,
      icon: 'ℹ️',
    });
  },
  loading: (message: string) => {
    return toast.loading(message);
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// Confirmation dialog helper (using browser confirm for now, can be replaced with a custom modal later)
export const showConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
};



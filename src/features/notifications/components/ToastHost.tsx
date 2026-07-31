import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TOAST_EVENT } from '../../../utils/api';

type Toast = {
  key: number;
  message: string;
};

const AUTO_REMOVE_MS = 6000;

export function ToastHost() {
  const { t } = useTranslation('common');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string | null }>).detail;

      const entry: Toast = {
        key: Date.now() + Math.random(),
        message: detail?.message || t('toast.unexpectedError'),
      };

      setToasts((prev) => [...prev, entry]);

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.key !== entry.key));
        timersRef.current.delete(timer);
      }, AUTO_REMOVE_MS);

      timersRef.current.add(timer);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [t]);

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismiss = (key: number) => {
    setToasts((prev) => prev.filter((toast) => toast.key !== key));
  };

  if (toasts.length === 0) return null;

  return (
    <div>
      {toasts.map((toast) => (
        <div
          key={toast.key}
          className="relative flex items-center justify-center bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          <span className="text-center">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.key)}
            className="absolute right-4 underline"
          >
            {t('toast.dismiss')}
          </button>
        </div>
      ))}
    </div>
  );
}

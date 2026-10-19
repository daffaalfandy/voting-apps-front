import { createContext, use, useCallback, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const timer = useRef(undefined);

  const notify = useCallback((text) => {
    window.clearTimeout(timer.current);
    setMessage(text);
    timer.current = window.setTimeout(() => setMessage(null), 4000);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext value={notify}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:justify-end">
        {message && (
          <p className="rounded-lg border border-header-hover bg-header px-4 py-3 text-sm font-semibold text-header-ink shadow-xl">{message}</p>
        )}
      </div>
    </ToastContext>
  );
}

export const useToast = () => use(ToastContext);

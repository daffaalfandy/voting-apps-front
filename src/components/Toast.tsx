import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number>(undefined);

  const notify = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage(text);
    timer.current = window.setTimeout(() => setMessage(null), 4000);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext value={notify}>
      {children}
      {/* The live region stays mounted so screen readers announce each new message. */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:justify-end">
        {message && (
          <p className="rounded-lg border border-header-hover bg-header px-4 py-3 text-sm font-semibold text-header-ink shadow-xl">{message}</p>
        )}
      </div>
    </ToastContext>
  );
}

export const useToast = () => use(ToastContext);

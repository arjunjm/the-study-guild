import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  body?: string;
  durationMs: number;
}

interface ToastContextValue {
  success: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
  warning: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANTS: Record<ToastVariant, { icon: React.ElementType; border: string; bg: string; iconCls: string; bar: string }> = {
  success: { icon: CheckCircle,    border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', iconCls: 'text-emerald-400', bar: 'bg-emerald-500' },
  info:    { icon: Info,           border: 'border-violet-500/30',  bg: 'bg-violet-500/10',  iconCls: 'text-violet-400',  bar: 'bg-violet-500' },
  warning: { icon: AlertTriangle,  border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   iconCls: 'text-amber-400',   bar: 'bg-amber-500' },
  error:   { icon: XCircle,        border: 'border-red-500/30',     bg: 'bg-red-500/10',     iconCls: 'text-red-400',     bar: 'bg-red-500' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    function tick() {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / toast.durationMs) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        handleDismiss();
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 200);
  }

  const v = VARIANTS[toast.variant];
  const Icon = v.icon;

  return (
    <div
      className={cn(
        'relative w-80 overflow-hidden rounded-2xl border shadow-xl transition-all duration-200',
        v.border,
        'bg-slate-900',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className={cn('px-4 py-3', v.bg)}>
        <div className="flex items-start gap-3">
          <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', v.iconCls)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{toast.title}</p>
            {toast.body && <p className="mt-0.5 text-xs text-slate-400">{toast.body}</p>}
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded p-0.5 text-slate-500 transition hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-slate-800">
        <div
          className={cn('h-full transition-none', v.bar)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((variant: ToastVariant, title: string, body?: string, durationMs = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-2), { id, variant, title, body, durationMs }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ctx: ToastContextValue = {
    success: (t, b) => add('success', t, b),
    info:    (t, b) => add('info',    t, b),
    warning: (t, b) => add('warning', t, b),
    error:   (t, b) => add('error',   t, b),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast stack — bottom-right on desktop, bottom-center on mobile */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[100] flex flex-col gap-2 lg:bottom-6">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={() => dismiss(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

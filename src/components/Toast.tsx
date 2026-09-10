import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4500;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-xl p-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
        isSuccess
          ? "border-emerald-200/90 bg-white/95 text-emerald-950 shadow-[0_12px_40px_rgba(16,185,129,0.18)]"
          : isError
          ? "border-rose-200/90 bg-white/95 text-rose-950 shadow-[0_12px_40px_rgba(244,63,94,0.18)]"
          : "border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_12px_40px_rgba(36,49,46,0.12)]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Animated Icon badge */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${
            isSuccess
              ? "bg-emerald-100 text-emerald-700"
              : isError
              ? "bg-rose-100 text-rose-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {isSuccess && <CheckCircle2 size={22} className="animate-pulse" />}
          {isError && <AlertCircle size={22} />}
          {!isSuccess && !isError && <Info size={22} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-xs font-bold tracking-tight text-[#24312e]">
            {toast.title}
          </h4>
          <p className="mt-0.5 text-xs font-medium text-[#68736e] leading-relaxed break-words">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-[#84908a] hover:bg-black/5 hover:text-[#24312e] transition cursor-pointer shrink-0"
          aria-label="Dismiss toast"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
        <div
          className={`h-full transition-all ease-linear ${
            isSuccess ? "bg-emerald-600" : isError ? "bg-rose-600" : "bg-[#24312e]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

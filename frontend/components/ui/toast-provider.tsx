"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "destructive";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastStyles(variant: ToastVariant = "default") {
  switch (variant) {
    case "success":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "destructive":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    default:
      return "border-primary/20 bg-card/95 text-foreground";
  }
}

function getToastIcon(variant: ToastVariant = "default") {
  switch (variant) {
    case "success":
      return <CheckCircle2 className="h-5 w-5" />;
    case "destructive":
      return <AlertCircle className="h-5 w-5" />;
    default:
      return <CheckCircle2 className="h-5 w-5" />;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (options: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const nextToast = { id, ...options };
      setToasts((current) => [...current, nextToast]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toastItem) => (
            <motion.div
              key={toastItem.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur",
                getToastStyles(toastItem.variant)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getToastIcon(toastItem.variant)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toastItem.title}</p>
                  {toastItem.description ? (
                    <p className="mt-1 text-sm opacity-80">{toastItem.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toastItem.id)}
                  className="rounded-full p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

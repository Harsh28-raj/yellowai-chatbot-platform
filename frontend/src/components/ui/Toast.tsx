import * as React from "react";
import { cn } from "../../lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  return (
    <div
      className={cn(
        "flex w-80 items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-lg transition-all animate-in slide-in-from-right-4",
        {
          "border-error/20 bg-error/10": toast.type === "error",
          "border-success/20 bg-success/10": toast.type === "success",
        }
      )}
    >
      <div className="mt-0.5 shrink-0">
        {toast.type === "success" && <CheckCircle className="h-5 w-5 text-success" />}
        {toast.type === "error" && <AlertCircle className="h-5 w-5 text-error" />}
        {toast.type === "info" && <Info className="h-5 w-5 text-primary" />}
      </div>
      <div className="flex-1 space-y-1">
        {toast.title && <h4 className="text-sm font-semibold">{toast.title}</h4>}
        <p className="text-sm text-text-muted">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

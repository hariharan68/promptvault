import { createContext, useCallback, useContext, useState } from "react";
import { Check, X, Info } from "@phosphor-icons/react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-[100] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 pl-5 pr-6 py-3.5 rounded-xl
              shadow-[0_12px_32px_-8px_rgba(30,34,52,0.18)] border text-sm font-medium animate-in
              ${t.type === "success"
                ? "bg-white dark:bg-[#161923] border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                : t.type === "error"
                ? "bg-white dark:bg-[#161923] border-red-500/25 text-red-600 dark:text-red-400"
                : "bg-white dark:bg-[#161923] border-[#eaecf3] dark:border-[#252838] text-[#232735] dark:text-[#e4e6f0]"}`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
              ${t.type === "success" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : t.type === "error" ? "bg-red-500/15 text-red-500 dark:text-red-400"
                : "bg-[#6c63ff]/15 text-[#6c63ff]"}`}>
              {t.type === "success"
                ? <Check size={12} weight="bold" />
                : t.type === "error"
                ? <X size={12} weight="bold" />
                : <Info size={12} weight="bold" />}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

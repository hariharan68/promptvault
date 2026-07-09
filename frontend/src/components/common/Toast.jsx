import { createContext, useCallback, useContext, useState } from "react";

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
            className={`pointer-events-auto flex items-center gap-3 pl-4 pr-5 py-3 rounded-xl
              shadow-[0_12px_32px_-8px_rgba(30,34,52,0.18)] border text-sm font-medium animate-in
              ${t.type === "success"
                ? "bg-white border-emerald-500/25 text-emerald-700"
                : t.type === "error"
                ? "bg-white border-red-500/25 text-red-600"
                : "bg-white border-[#eaecf3] text-[#232735]"}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0
              ${t.type === "success" ? "bg-emerald-500/15 text-emerald-600"
                : t.type === "error" ? "bg-red-500/15 text-red-500"
                : "bg-[#6c63ff]/15 text-[#6c63ff]"}`}>
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "i"}
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

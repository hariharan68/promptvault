import { useEffect } from "react";
import { X } from "@phosphor-icons/react";

export default function Modal({ title, onClose, children, size = "md" }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[#1a1e2e]/40 dark:bg-[#000]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${widths[size]} bg-white dark:bg-[#161923]
          border border-[#eaecf3] dark:border-[#252838] rounded-2xl
          shadow-[0_25px_60px_-15px_rgba(30,34,52,0.25)]
          max-h-[90vh] overflow-y-auto animate-in`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eaecf3] dark:border-[#252838]">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-gradient-to-b from-[#6c63ff] to-[#8b83ff] rounded-full" />
            <h2 className="text-sm font-semibold text-[#232735] dark:text-[#e4e6f0]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-[#868da3] dark:text-[#737a95]
              hover:text-[#232735] dark:hover:text-[#e4e6f0]
              hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a] transition-all"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

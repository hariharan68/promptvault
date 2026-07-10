import { useEffect } from "react";
import { motion } from "motion/react";
import { X } from "@phosphor-icons/react";

export default function Modal({ title, onClose, children, size = "md" }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 bg-[#111827]/40 dark:bg-[#000]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${widths[size]} bg-white dark:bg-[#252733]
          border border-[#E5E7EB] dark:border-[#363847] rounded-2xl
          shadow-[0_25px_60px_-15px_rgba(17,24,39,0.2)]
          max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB] dark:border-[#363847]">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-[#714B67] rounded-full" />
            <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F1F2F6]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full
              text-[#6B7280] dark:text-[#6B7280]
              hover:text-[#111827] dark:hover:text-[#F1F2F6]
              hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A] transition-all"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

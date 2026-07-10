import { motion } from "motion/react";
import { Archive } from "@phosphor-icons/react";
import PromptCard from "./PromptCard.jsx";
import PromptRow from "./PromptRow.jsx";

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3.5 skeleton rounded-md w-3/5" />
          <div className="h-3 skeleton rounded-md w-2/5" />
        </div>
        <div className="h-4 w-4 skeleton rounded-md flex-shrink-0 ml-2" />
      </div>
      <div className="h-20 skeleton rounded-lg" />
      <div className="flex gap-1.5">
        <div className="h-5 skeleton rounded-full w-16" />
        <div className="h-5 skeleton rounded-full w-14" />
      </div>
      <div className="flex gap-1.5 pt-2 border-t border-[#E5E7EB] dark:border-[#363847]">
        <div className="h-6 skeleton rounded-full w-16" />
        <div className="h-6 skeleton rounded-full w-12" />
        <div className="h-6 skeleton rounded-full w-20" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F3F4F6] dark:border-[#2C2E3A] last:border-b-0">
      <div className="w-3.5 h-3.5 skeleton rounded-sm flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-3.5 skeleton rounded-md w-2/5" />
        <div className="h-3 skeleton rounded-md w-1/4" />
      </div>
      <div className="flex gap-1.5 hidden sm:flex">
        <div className="h-5 skeleton rounded-full w-12" />
        <div className="h-5 skeleton rounded-full w-14" />
      </div>
      <div className="h-3 skeleton rounded-md w-10 hidden sm:block" />
    </div>
  );
}

export default function PromptList({ prompts, loading, view = "grid", onEdit, onDelete, onDuplicate, onCopy, onFavoriteToggle, onTagClick }) {
  if (loading) {
    if (view === "list") {
      return (
        <div className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-xl overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonRow key={i} />)}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#252733]
          border border-[#E5E7EB] dark:border-[#363847]
          flex items-center justify-center mb-4 text-[#714B67]">
          <Archive size={28} weight="regular" />
        </div>
        <p className="text-[#111827] dark:text-[#F1F2F6] font-semibold text-sm">No prompts found</p>
        <p className="text-[#6B7280] text-xs mt-1.5 max-w-52 leading-relaxed">
          Try adjusting your filters or create your first prompt
        </p>
      </div>
    );
  }

  const sharedProps = { onEdit, onDelete, onDuplicate, onCopy, onFavoriteToggle, onTagClick };

  if (view === "list") {
    return (
      <div className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-xl overflow-hidden">
        {prompts.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i, 8) * 0.03, ease: "easeOut" }}
          >
            <PromptRow prompt={p} {...sharedProps} />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {prompts.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: Math.min(i, 8) * 0.04, ease: "easeOut" }}
        >
          <PromptCard prompt={p} {...sharedProps} />
        </motion.div>
      ))}
    </div>
  );
}

import { Archive } from "@phosphor-icons/react";
import PromptCard from "./PromptCard.jsx";

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#161923] border border-[#eaecf3] dark:border-[#252838] rounded-xl p-4 flex flex-col gap-3 shadow-[0_1px_3px_rgba(30,34,52,0.04)]">
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
      <div className="flex gap-1.5 pt-2 border-t border-[#f0f1f6] dark:border-[#1d2030]">
        <div className="h-7 skeleton rounded-lg w-16" />
        <div className="h-7 skeleton rounded-lg w-12" />
        <div className="h-7 skeleton rounded-lg w-20" />
      </div>
    </div>
  );
}

export default function PromptList({ prompts, loading, onEdit, onDelete, onDuplicate, onCopy, onFavoriteToggle, onTagClick }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#161923]
          border border-[#eaecf3] dark:border-[#252838]
          flex items-center justify-center mb-4 text-[#6c63ff]
          shadow-[0_8px_24px_-10px_rgba(108,99,255,0.3)]">
          <Archive size={28} weight="regular" />
        </div>
        <p className="text-[#232735] dark:text-[#e4e6f0] font-semibold text-sm">No prompts found</p>
        <p className="text-[#868da3] dark:text-[#737a95] text-xs mt-1.5 max-w-52 leading-relaxed">
          Try adjusting your filters or create your first prompt
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {prompts.map((p) => (
        <PromptCard
          key={p.id}
          prompt={p}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onCopy={onCopy}
          onFavoriteToggle={onFavoriteToggle}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}

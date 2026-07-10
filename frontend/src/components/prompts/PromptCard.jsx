import { useState } from "react";
import { Star, Copy, Check, PencilSimple, CopySimple, Trash } from "@phosphor-icons/react";
import TagPill from "../tags/TagPill.jsx";

function ActionBtn({ onClick, active = false, danger = false, accent = false, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-emerald-500/12 border border-emerald-500/30 text-emerald-600"
          : danger
          ? "bg-red-500/6 border border-red-500/20 text-red-500 hover:bg-red-500/12 hover:border-red-500/40"
          : accent
          ? "bg-[#6c63ff]/8 border border-[#6c63ff]/20 text-[#6c63ff] hover:bg-[#6c63ff]/15 hover:border-[#6c63ff]/40"
          : "bg-[#f4f6fb] dark:bg-[#1a1d2a] border border-[#e0e3ec] dark:border-[#2d3047] text-[#5b6178] dark:text-[#959baf] hover:bg-[#eef0f6] dark:hover:bg-[#1e2130] hover:text-[#232735] dark:hover:text-[#e4e6f0]"
      }`}
    >
      {children}
    </button>
  );
}

export default function PromptCard({ prompt, onEdit, onDelete, onDuplicate, onCopy, onFavoriteToggle, onTagClick }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt.prompt_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    onCopy(prompt);
  }

  const dateStr = new Date(prompt.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  return (
    <div className="group/card flex flex-col bg-white dark:bg-[#161923]
      border border-[#eaecf3] dark:border-[#252838] rounded-xl
      shadow-[0_1px_3px_rgba(30,34,52,0.04)]
      hover:border-[#6c63ff]/30 hover:shadow-[0_12px_28px_-10px_rgba(108,99,255,0.22)]
      transition-all duration-300 overflow-hidden">

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#6c63ff]/0 to-transparent
        group-hover/card:via-[#6c63ff]/40 transition-all duration-500" />

      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#232735] dark:text-[#e4e6f0] text-sm leading-snug line-clamp-1">
              {prompt.title}
            </h3>
            {prompt.description && (
              <p className="text-xs text-[#868da3] dark:text-[#737a95] mt-1 line-clamp-1 leading-relaxed">
                {prompt.description}
              </p>
            )}
          </div>
          <button
            onClick={() => onFavoriteToggle(prompt)}
            title={prompt.is_favorite ? "Remove from favorites" : "Add to favorites"}
            className={`flex-shrink-0 transition-all duration-200 hover:scale-115 leading-none ${
              prompt.is_favorite ? "text-amber-400" : "text-[#d5d9e4] dark:text-[#3a3e55] hover:text-amber-400"
            }`}
          >
            <Star size={17} weight={prompt.is_favorite ? "fill" : "regular"} />
          </button>
        </div>

        <div className="relative bg-[#f7f8fc] dark:bg-[#0f1118] border border-[#eaecf3] dark:border-[#252838] rounded-lg px-4 py-3.5 overflow-hidden">
          <pre className="text-xs text-[#5b6178] dark:text-[#959baf] whitespace-pre-wrap break-words line-clamp-4 font-mono leading-relaxed">
            {prompt.prompt_content}
          </pre>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#f7f8fc] dark:from-[#0f1118] to-transparent" />
        </div>

        {prompt.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.map((t) => (
              <TagPill
                key={t.id}
                name={t.name}
                onClick={onTagClick ? () => onTagClick(t.name) : undefined}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-[#f0f1f6] dark:border-[#1d2030]">
          <ActionBtn onClick={handleCopy} active={copied} accent={!copied}>
            {copied
              ? <><Check size={12} weight="bold" /> Copied</>
              : <><Copy size={12} /> Copy</>}
          </ActionBtn>
          <ActionBtn onClick={() => onEdit(prompt)}>
            <PencilSimple size={12} /> Edit
          </ActionBtn>
          <ActionBtn onClick={() => onDuplicate(prompt)}>
            <CopySimple size={12} /> Duplicate
          </ActionBtn>
          <ActionBtn onClick={() => onDelete(prompt)} danger>
            <Trash size={12} /> Delete
          </ActionBtn>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#aeb4c6] dark:text-[#525872]">{dateStr}</span>
            {prompt.usage_count > 0 && (
              <span className="text-xs text-[#868da3] dark:text-[#737a95] bg-[#f4f6fb] dark:bg-[#1a1d2a] border border-[#eaecf3] dark:border-[#252838] rounded-md px-1.5 py-0.5">
                {prompt.usage_count}x
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Star, Copy, Check, PencilSimple, Trash, CopySimple } from "@phosphor-icons/react";
import TagPill from "../tags/TagPill.jsx";
import PromptFillModal from "./PromptFillModal.jsx";

const VAR_RE = /\{\{[^{}]+\}\}/;

export default function PromptRow({ prompt, onEdit, onDelete, onDuplicate, onCopy, onFavoriteToggle, onTagClick }) {
  const [copied, setCopied] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);

  const hasVariables = VAR_RE.test(prompt.prompt_content);

  async function handleCopy() {
    if (hasVariables) { setFillOpen(true); return; }
    try {
      await navigator.clipboard.writeText(prompt.prompt_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    onCopy(prompt);
  }

  function handleFillCopy(p) {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy(p);
  }

  const dateStr = new Date(prompt.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <>
      <div className="group/row flex items-center gap-3 px-4 py-3
        bg-white dark:bg-[#252733]
        border-b border-[#F3F4F6] dark:border-[#2C2E3A] last:border-b-0
        hover:bg-[#FAFAFA] dark:hover:bg-[#2C2E3A]
        transition-colors duration-150">

        {/* Favorite star */}
        <button
          onClick={() => onFavoriteToggle(prompt)}
          className={`flex-shrink-0 transition-all duration-150 hover:scale-110 ${
            prompt.is_favorite ? "text-[#714B67]" : "text-[#D1D5DB] dark:text-[#363847] hover:text-[#714B67]"
          }`}
        >
          <Star size={14} weight={prompt.is_favorite ? "fill" : "regular"} />
        </button>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#111827] dark:text-[#F1F2F6] truncate">
              {prompt.title}
            </p>
            {hasVariables && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold
                bg-[#F2A93E]/12 border border-[#F2A93E]/30 text-[#D4841A] flex-shrink-0">
                {"{{ }}"}
              </span>
            )}
          </div>
          {prompt.description && (
            <p className="text-xs text-[#6B7280] truncate mt-0.5">{prompt.description}</p>
          )}
        </div>

        {/* Tags */}
        {prompt.tags?.length > 0 && (
          <div className="hidden sm:flex gap-1.5 flex-shrink-0">
            {prompt.tags.slice(0, 2).map((t) => (
              <TagPill key={t.id} name={t.name} onClick={onTagClick ? () => onTagClick(t.name) : undefined} />
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-[#9CA3AF] dark:text-[#6B7280]">
          {prompt.usage_count > 0 && (
            <span className="hidden md:block">{prompt.usage_count}x</span>
          )}
          <span className="hidden sm:block">{dateStr}</span>
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1 flex-shrink-0
          opacity-0 group-hover/row:opacity-100 transition-opacity duration-150">
          <button
            onClick={handleCopy}
            title={hasVariables ? "Fill variables & copy" : "Copy to clipboard"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              copied
                ? "bg-emerald-500/12 border border-emerald-500/30 text-emerald-600"
                : "bg-[#F3EEF3] dark:bg-[#3D2B3A] border border-[#E0D0DC] dark:border-[#5A3A54] text-[#714B67] dark:text-[#C4A0BA] hover:bg-[#714B67]/15"
            }`}
          >
            {copied ? <Check size={11} weight="bold" /> : <Copy size={11} />}
            {copied ? "Copied" : hasVariables ? "Use" : "Copy"}
          </button>

          <button
            onClick={() => onEdit(prompt)}
            title="Edit"
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#9CA3AF]
              hover:text-[#374151] dark:hover:text-[#F1F2F6]
              hover:bg-[#F3F4F6] dark:hover:bg-[#363847] transition-all"
          >
            <PencilSimple size={13} />
          </button>

          <button
            onClick={() => onDuplicate(prompt)}
            title="Duplicate"
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#9CA3AF]
              hover:text-[#374151] dark:hover:text-[#F1F2F6]
              hover:bg-[#F3F4F6] dark:hover:bg-[#363847] transition-all"
          >
            <CopySimple size={13} />
          </button>

          <button
            onClick={() => onDelete(prompt)}
            title="Delete"
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#9CA3AF]
              hover:text-red-500 hover:bg-red-500/8 transition-all"
          >
            <Trash size={13} />
          </button>
        </div>
      </div>

      {fillOpen && (
        <PromptFillModal
          prompt={prompt}
          onClose={() => setFillOpen(false)}
          onCopy={handleFillCopy}
        />
      )}
    </>
  );
}

import { useState } from "react";
import { Star, Copy, Check, PencilSimple, CopySimple, Trash } from "@phosphor-icons/react";
import TagPill from "../tags/TagPill.jsx";

function ActionBtn({ onClick, active = false, danger = false, accent = false, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-emerald-500/12 border border-emerald-500/30 text-emerald-600"
          : danger
          ? "bg-red-500/6 border border-red-500/20 text-red-500 hover:bg-red-500/12 hover:border-red-500/40"
          : accent
          ? "bg-[#F3EEF3] dark:bg-[#3D2B3A] border border-[#E0D0DC] dark:border-[#5A3A54] text-[#714B67] dark:text-[#C4A0BA] hover:bg-[#714B67]/15"
          : "bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847] text-[#374151] dark:text-[#9CA3AF] hover:border-[#714B67] hover:text-[#714B67] dark:hover:text-[#C4A0BA]"
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

  const dateStr = new Date(prompt.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="group/card flex flex-col bg-white dark:bg-[#252733]
      border border-[#E5E7EB] dark:border-[#363847] rounded-xl
      hover:border-[#714B67] hover:shadow-[0_4px_16px_-4px_rgba(113,75,103,0.15)] transition-all duration-200 overflow-hidden">

      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#111827] dark:text-[#F1F2F6] text-sm leading-snug line-clamp-1">
              {prompt.title}
            </h3>
            {prompt.description && (
              <p className="text-xs text-[#6B7280] mt-1 line-clamp-1 leading-relaxed">{prompt.description}</p>
            )}
          </div>
          <button
            onClick={() => onFavoriteToggle(prompt)}
            title={prompt.is_favorite ? "Remove from favorites" : "Add to favorites"}
            className={`flex-shrink-0 transition-all duration-200 hover:scale-115 leading-none ${
              prompt.is_favorite ? "text-[#714B67]" : "text-[#D1D5DB] dark:text-[#363847] hover:text-[#714B67]"
            }`}
          >
            <Star size={16} weight={prompt.is_favorite ? "fill" : "regular"} />
          </button>
        </div>

        <div className="relative bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847] rounded-lg px-4 py-3.5 overflow-hidden">
          <pre className="text-xs text-[#374151] dark:text-[#9CA3AF] whitespace-pre-wrap break-words line-clamp-4 font-mono leading-relaxed">
            {prompt.prompt_content}
          </pre>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#F3F4F6] dark:from-[#2C2E3A] to-transparent" />
        </div>

        {prompt.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.map((t) => (
              <TagPill key={t.id} name={t.name} onClick={onTagClick ? () => onTagClick(t.name) : undefined} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-[#E5E7EB] dark:border-[#363847]">
          <ActionBtn onClick={handleCopy} active={copied} accent={!copied}>
            {copied ? <><Check size={11} weight="bold" /> Copied</> : <><Copy size={11} /> Copy</>}
          </ActionBtn>
          <ActionBtn onClick={() => onEdit(prompt)}><PencilSimple size={11} /> Edit</ActionBtn>
          <ActionBtn onClick={() => onDuplicate(prompt)}><CopySimple size={11} /> Duplicate</ActionBtn>
          <ActionBtn onClick={() => onDelete(prompt)} danger><Trash size={11} /> Delete</ActionBtn>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#9CA3AF] dark:text-[#6B7280]">{dateStr}</span>
            {prompt.usage_count > 0 && (
              <span className="text-xs text-[#6B7280] bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847] rounded-md px-1.5 py-0.5">
                {prompt.usage_count}x
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

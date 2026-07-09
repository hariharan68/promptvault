import { useState } from "react";
import TagPill from "../tags/TagPill.jsx";

function ActionBtn({ onClick, active = false, danger = false, accent = false, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-emerald-500/12 border border-emerald-500/30 text-emerald-600"
          : danger
          ? "bg-red-500/6 border border-red-500/20 text-red-500 hover:bg-red-500/12 hover:border-red-500/40"
          : accent
          ? "bg-[#6c63ff]/8 border border-[#6c63ff]/20 text-[#6c63ff] hover:bg-[#6c63ff]/15 hover:border-[#6c63ff]/40"
          : "bg-[#f4f6fb] border border-[#e0e3ec] text-[#5b6178] hover:bg-[#eef0f6] hover:text-[#232735]"
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
    <div className="group/card flex flex-col bg-white border border-[#eaecf3] rounded-xl
      shadow-[0_1px_3px_rgba(30,34,52,0.04)]
      hover:border-[#6c63ff]/30 hover:shadow-[0_12px_28px_-10px_rgba(108,99,255,0.22)]
      transition-all duration-300 overflow-hidden">

      {/* Top gradient line on hover */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#6c63ff]/0 to-transparent
        group-hover/card:via-[#6c63ff]/40 transition-all duration-500" />

      <div className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#232735] text-sm leading-snug line-clamp-1">
              {prompt.title}
            </h3>
            {prompt.description && (
              <p className="text-xs text-[#868da3] mt-0.5 line-clamp-1 leading-relaxed">
                {prompt.description}
              </p>
            )}
          </div>
          <button
            onClick={() => onFavoriteToggle(prompt)}
            title={prompt.is_favorite ? "Remove from favorites" : "Add to favorites"}
            className={`flex-shrink-0 transition-all duration-200 hover:scale-115 text-base leading-none ${
              prompt.is_favorite
                ? "text-amber-400"
                : "text-[#d5d9e4] hover:text-amber-400"
            }`}
          >
            ★
          </button>
        </div>

        {/* Content preview */}
        <div className="relative bg-[#f7f8fc] border border-[#eaecf3] rounded-lg px-3.5 py-3 overflow-hidden">
          <pre className="text-xs text-[#5b6178] whitespace-pre-wrap break-words line-clamp-4 font-mono leading-relaxed">
            {prompt.prompt_content}
          </pre>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#f7f8fc] to-transparent" />
        </div>

        {/* Tags */}
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

        {/* Footer */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#f0f1f6]">
          <ActionBtn onClick={handleCopy} active={copied} accent={!copied}>
            {copied ? "✓ Copied!" : "Copy"}
          </ActionBtn>
          <ActionBtn onClick={() => onEdit(prompt)}>Edit</ActionBtn>
          <ActionBtn onClick={() => onDuplicate(prompt)}>Duplicate</ActionBtn>
          <ActionBtn onClick={() => onDelete(prompt)} danger>Delete</ActionBtn>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-[#aeb4c6]">{dateStr}</span>
            {prompt.usage_count > 0 && (
              <span className="text-[10px] text-[#868da3] bg-[#f4f6fb] border border-[#eaecf3] rounded-md px-1.5 py-0.5">
                {prompt.usage_count}×
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

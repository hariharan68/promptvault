import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MagnifyingGlass, SquaresFour, Archive, FolderSimple,
  GearSix, Copy, Check, ArrowElbowDownLeft, X,
} from "@phosphor-icons/react";
import { getPrompts, copyPrompt } from "../../api/promptApi.js";

const PAGES = [
  { id: "p-dashboard", label: "Dashboard",    icon: SquaresFour, path: "/dashboard" },
  { id: "p-prompts",   label: "All Prompts",  icon: Archive,     path: "/prompts" },
  { id: "p-groups",    label: "Groups",       icon: FolderSimple,path: "/groups" },
  { id: "p-settings",  label: "Settings",     icon: GearSix,     path: "/settings" },
];

function Highlight({ text, query }) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#714B67]/15 text-[#714B67] dark:text-[#C4A0BA] rounded-sm not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [query, setQuery] = useState("");
  const [allPrompts, setAllPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch prompts when palette opens
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    setCopiedId(null);
    setLoading(true);
    getPrompts({ page_size: 100 })
      .then((r) => setAllPrompts(r.data.data ?? r.data.items ?? []))
      .catch(() => setAllPrompts([]))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const filteredPrompts = query.trim()
    ? allPrompts
        .filter((p) => {
          const q = query.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.prompt_content.toLowerCase().includes(q)
          );
        })
        .slice(0, 8)
    : allPrompts.slice(0, 5);

  const filteredPages = query.trim()
    ? PAGES.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  const totalItems = filteredPages.length + filteredPrompts.length;

  // Keep selected item in view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e) => {
    if (!open) return;
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < filteredPages.length) {
        handlePageSelect(filteredPages[selectedIndex].path);
      } else {
        handlePromptCopy(filteredPrompts[selectedIndex - filteredPages.length]);
      }
    }
  }, [open, selectedIndex, filteredPages, filteredPrompts, totalItems]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset selection when results change
  useEffect(() => { setSelectedIndex(0); }, [query]);

  function handlePageSelect(path) {
    navigate(path);
    onClose();
  }

  async function handlePromptCopy(prompt) {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.prompt_content);
      await copyPrompt(prompt.id);
      setCopiedId(prompt.id);
      setTimeout(() => { setCopiedId(null); onClose(); }, 900);
    } catch {
      onClose();
    }
  }

  return (
    <AnimatePresence>
    {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#252733]
          border border-[#E5E7EB] dark:border-[#363847]
          rounded-2xl shadow-[0_32px_80px_-16px_rgba(17,24,39,0.35)]
          overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#363847]">
          <MagnifyingGlass size={17} className="text-[#9CA3AF] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts, navigate pages…"
            className="flex-1 bg-transparent text-[#111827] dark:text-[#F1F2F6] text-sm
              placeholder:text-[#9CA3AF] outline-none"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono
              bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847]
              rounded text-[#6B7280]">
              ESC
            </kbd>
            <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">

          {/* Pages section */}
          {filteredPages.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                Pages
              </p>
              {filteredPages.map((page, i) => {
                const { icon: Icon } = page;
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={page.id}
                    data-idx={i}
                    onClick={() => handlePageSelect(page.path)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                      isSelected
                        ? "bg-[#F3EEF3] dark:bg-[#3D2B3A] text-[#714B67] dark:text-[#C4A0BA]"
                        : "text-[#374151] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]"
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isSelected ? "text-[#714B67] dark:text-[#C4A0BA]" : "text-[#9CA3AF]"}`}>
                      <Icon size={15} />
                    </span>
                    <span className="font-medium">
                      <Highlight text={page.label} query={query} />
                    </span>
                    {isSelected && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-[#714B67]/70 dark:text-[#C4A0BA]/70 font-mono">
                        <ArrowElbowDownLeft size={11} /> Go
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Prompts section */}
          {filteredPrompts.length > 0 && (
            <div className={filteredPages.length > 0 ? "mt-1 border-t border-[#F3F4F6] dark:border-[#2C2E3A] pt-1" : ""}>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                {query.trim() ? "Prompts" : "Recent Prompts"}
              </p>
              {filteredPrompts.map((prompt, i) => {
                const idx = filteredPages.length + i;
                const isSelected = idx === selectedIndex;
                const isCopied = copiedId === prompt.id;
                return (
                  <button
                    key={prompt.id}
                    data-idx={idx}
                    onClick={() => handlePromptCopy(prompt)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-[#F3EEF3] dark:bg-[#3D2B3A]"
                        : "hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]"
                    }`}
                  >
                    <span className={`flex-shrink-0 mt-0.5 ${isSelected ? "text-[#714B67] dark:text-[#C4A0BA]" : "text-[#9CA3AF]"}`}>
                      <Archive size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isSelected ? "text-[#714B67] dark:text-[#C4A0BA]" : "text-[#111827] dark:text-[#F1F2F6]"
                      }`}>
                        <Highlight text={prompt.title} query={query} />
                      </p>
                      {prompt.description && (
                        <p className="text-xs text-[#6B7280] truncate mt-0.5">
                          <Highlight text={prompt.description} query={query} />
                        </p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-medium transition-colors ${
                      isCopied
                        ? "text-emerald-500"
                        : isSelected
                        ? "text-[#714B67]/70 dark:text-[#C4A0BA]/70"
                        : "text-[#D1D5DB] dark:text-[#363847]"
                    }`}>
                      {isCopied
                        ? <><Check size={11} weight="bold" /> Copied</>
                        : isSelected
                        ? <><ArrowElbowDownLeft size={11} /> Copy</>
                        : <Copy size={12} />
                      }
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && query.trim() && filteredPages.length === 0 && filteredPrompts.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-[#9CA3AF]">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="py-6 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#714B67] rounded-full animate-spin" />
              <span className="text-xs text-[#9CA3AF]">Loading…</span>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-[#F3F4F6] dark:border-[#2C2E3A] flex items-center gap-4 text-[10px] text-[#9CA3AF]">
          <span className="flex items-center gap-1"><ArrowElbowDownLeft size={10} /> select</span>
          <span className="flex items-center gap-1">↑↓ navigate</span>
          <span className="flex items-center gap-1">esc close</span>
          <span className="ml-auto font-mono opacity-60">⌘K</span>
        </div>
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
  );
}

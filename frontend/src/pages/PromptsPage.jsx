import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, SquaresFour, Rows, CaretUpDown } from "@phosphor-icons/react";
import {
  getPrompts, createPrompt, updatePrompt, deletePrompt,
  duplicatePrompt, copyPrompt, favoritePrompt, unfavoritePrompt,
} from "../api/promptApi.js";
import PromptList from "../components/prompts/PromptList.jsx";
import PromptFilters from "../components/prompts/PromptFilters.jsx";
import PromptEditor from "../components/prompts/PromptEditor.jsx";
import Modal from "../components/common/Modal.jsx";
import Button from "../components/common/Button.jsx";
import { useToast } from "../components/common/Toast.jsx";

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest first" },
  { value: "oldest",   label: "Oldest first" },
  { value: "most_used",label: "Most used" },
  { value: "az",       label: "A → Z" },
  { value: "za",       label: "Z → A" },
];

function sortPrompts(prompts, sort) {
  const sorted = [...prompts];
  switch (sort) {
    case "oldest":    return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case "most_used": return sorted.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    case "az":        return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "za":        return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:          return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export default function PromptsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // URL is the single source of truth — derived on every render, never stored in state
  const filters = {
    q: searchParams.get("q") ?? "",
    group_id: searchParams.get("group_id") ?? "",
    tag: searchParams.get("tag") ?? "",
    is_favorite: searchParams.get("is_favorite") ?? "",
  };

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(() => searchParams.get("new") === "1");
  const [editTarget, setEditTarget] = useState(null);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");

  function handleFiltersChange(newFilters) {
    const params = {};
    if (newFilters.q) params.q = newFilters.q;
    if (newFilters.group_id) params.group_id = newFilters.group_id;
    if (newFilters.tag) params.tag = newFilters.tag;
    if (newFilters.is_favorite) params.is_favorite = newFilters.is_favorite;
    setSearchParams(params, { replace: true });
  }

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      const q = searchParams.get("q");
      const group_id = searchParams.get("group_id");
      const tag = searchParams.get("tag");
      const is_favorite = searchParams.get("is_favorite");
      if (q) params.q = q;
      if (group_id) params.group_id = group_id;
      if (tag) params.tag = tag;
      if (is_favorite) params.is_favorite = is_favorite;
      const res = await getPrompts(params);
      setPrompts(res.data);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  async function handleCreate(data) {
    try {
      await createPrompt(data);
      setShowCreate(false);
      fetchPrompts();
      toast.success("Prompt created");
    } catch (err) { throw err; }
  }

  async function handleUpdate(data) {
    try {
      await updatePrompt(editTarget.id, data);
      setEditTarget(null);
      fetchPrompts();
      toast.success("Prompt updated");
    } catch (err) { throw err; }
  }

  async function handleDelete(prompt) {
    if (!window.confirm(`Delete "${prompt.title}"?`)) return;
    try {
      await deletePrompt(prompt.id);
      fetchPrompts();
      toast.success("Prompt deleted");
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to delete");
    }
  }

  async function handleDuplicate(prompt) {
    try {
      await duplicatePrompt(prompt.id);
      fetchPrompts();
      toast.success(`"${prompt.title}" duplicated`);
    } catch {
      toast.error("Failed to duplicate");
    }
  }

  async function handleCopy(prompt) {
    try {
      await copyPrompt(prompt.id);
      fetchPrompts();
    } catch {}
  }

  async function handleFavoriteToggle(prompt) {
    try {
      if (prompt.is_favorite) {
        await unfavoritePrompt(prompt.id);
        toast.success("Removed from favorites");
      } else {
        await favoritePrompt(prompt.id);
        toast.success("Added to favorites");
      }
      fetchPrompts();
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  function handleTagClick(tagName) {
    handleFiltersChange({ ...filters, tag: tagName });
  }

  const displayPrompts = sortPrompts(prompts, sort);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#111827] dark:text-[#F1F2F6]">Prompts</h1>
          <p className="text-xs text-[#6B7280] dark:text-[#6B7280] mt-0.5">
            {!loading
              ? `${prompts.length} prompt${prompts.length !== 1 ? "s" : ""}${
                  filters.q || filters.tag || filters.group_id || filters.is_favorite
                    ? " matched"
                    : " in library"
                }`
              : "Loading..."}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Sort dropdown */}
          <div className="relative flex items-center">
            <CaretUpDown
              size={12}
              className="absolute left-2.5 text-[#9CA3AF] pointer-events-none"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none pl-7 pr-3 py-1.5 text-xs font-medium rounded-lg
                bg-white dark:bg-[#252733]
                border border-[#E5E7EB] dark:border-[#363847]
                text-[#374151] dark:text-[#9CA3AF]
                hover:border-[#714B67]/40 focus:outline-none focus:border-[#714B67]
                focus:ring-2 focus:ring-[#714B67]/15
                transition-all duration-150 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white dark:bg-[#252733]
            border border-[#E5E7EB] dark:border-[#363847] rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              title="Grid view"
              className={`w-8 h-8 flex items-center justify-center transition-all ${
                view === "grid"
                  ? "bg-[#F3EEF3] dark:bg-[#3D2B3A] text-[#714B67] dark:text-[#C4A0BA]"
                  : "text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#F1F2F6] hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]"
              }`}
            >
              <SquaresFour size={15} weight={view === "grid" ? "fill" : "regular"} />
            </button>
            <div className="w-px h-4 bg-[#E5E7EB] dark:bg-[#363847]" />
            <button
              onClick={() => setView("list")}
              title="List view"
              className={`w-8 h-8 flex items-center justify-center transition-all ${
                view === "list"
                  ? "bg-[#F3EEF3] dark:bg-[#3D2B3A] text-[#714B67] dark:text-[#C4A0BA]"
                  : "text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#F1F2F6] hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]"
              }`}
            >
              <Rows size={15} weight={view === "list" ? "fill" : "regular"} />
            </button>
          </div>

          <Button onClick={() => setShowCreate(true)} size="md">
            <Plus size={14} weight="bold" /> New Prompt
          </Button>
        </div>
      </div>

      {/* Filters */}
      <PromptFilters filters={filters} onChange={handleFiltersChange} />

      {/* List */}
      <PromptList
        prompts={displayPrompts}
        loading={loading}
        view={view}
        onEdit={setEditTarget}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onCopy={handleCopy}
        onFavoriteToggle={handleFavoriteToggle}
        onTagClick={handleTagClick}
      />

      {/* Create modal */}
      {showCreate && (
        <Modal title="New Prompt" onClose={() => setShowCreate(false)} size="lg">
          <PromptEditor onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title="Edit Prompt" onClose={() => setEditTarget(null)} size="lg">
          <PromptEditor initial={editTarget} onSave={handleUpdate} onCancel={() => setEditTarget(null)} />
        </Modal>
      )}
    </div>
  );
}

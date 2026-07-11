import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useSWR from "swr";
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
import { bulkPrompts, exportPrompts, importPrompts, getPromptVersions, restorePromptVersion } from "../api/productApi.js";

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

  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(() => searchParams.get("new") === "1");
  const [editTarget, setEditTarget] = useState(null);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [selectedIds, setSelectedIds] = useState([]);
  const [history, setHistory] = useState(null);

  const requestParams = useMemo(() => ({
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.group_id ? { group_id: filters.group_id } : {}),
    ...(filters.tag ? { tag: filters.tag } : {}),
    ...(filters.is_favorite ? { is_favorite: filters.is_favorite } : {}),
    page,
    page_size: 25,
  }), [filters.q, filters.group_id, filters.tag, filters.is_favorite, page]);

  const { data: response, error, isLoading, mutate } = useSWR(
    ["prompts", requestParams],
    ([, params]) => getPrompts(params).then((res) => res.data),
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const prompts = response?.data ?? [];
  const loading = isLoading && !response;
  const pagination = response?.meta ?? { page: 1, page_size: 25, total: 0, has_next: false };
  const errorMessage = error?.response?.data?.detail ?? "Unable to load prompts.";

  function handleFiltersChange(newFilters) {
    setPage(1);
    const params = {};
    if (newFilters.q) params.q = newFilters.q;
    if (newFilters.group_id) params.group_id = newFilters.group_id;
    if (newFilters.tag) params.tag = newFilters.tag;
    if (newFilters.is_favorite) params.is_favorite = newFilters.is_favorite;
    setSearchParams(params, { replace: true });
  }

  async function handleCreate(data) {
    try {
      await createPrompt(data);
      setShowCreate(false);
      mutate();
      toast.success("Prompt created");
    } catch (err) { throw err; }
  }

  async function handleUpdate(data) {
    try {
      await updatePrompt(editTarget.id, data);
      setEditTarget(null);
      mutate();
      toast.success("Prompt updated");
    } catch (err) { throw err; }
  }

  async function handleDelete(prompt) {
    if (!window.confirm(`Delete "${prompt.title}"?`)) return;
    try {
      if (response) {
        mutate({
          ...response,
          data: response.data.filter((item) => item.id !== prompt.id),
          meta: { ...response.meta, total: Math.max(0, response.meta.total - 1) },
        }, false);
      }
      await deletePrompt(prompt.id);
      toast.success("Prompt deleted");
    } catch (err) {
      mutate();
      toast.error(err.response?.data?.detail ?? "Failed to delete");
    }
  }

  async function handleDuplicate(prompt) {
    try {
      await duplicatePrompt(prompt.id);
      mutate();
      toast.success(`"${prompt.title}" duplicated`);
    } catch {
      toast.error("Failed to duplicate");
    }
  }

  async function handleCopy(prompt) {
    try {
      if (response) {
        mutate({
          ...response,
          data: response.data.map((item) => item.id === prompt.id ? { ...item, usage_count: item.usage_count + 1 } : item),
        }, false);
      }
      await copyPrompt(prompt.id);
    } catch { mutate(); }
  }

  async function handleFavoriteToggle(prompt) {
    try {
      const nextValue = !prompt.is_favorite;
      if (response) {
        mutate({
          ...response,
          data: response.data.map((item) => item.id === prompt.id ? { ...item, is_favorite: nextValue } : item),
        }, false);
      }
      if (nextValue) await favoritePrompt(prompt.id); else await unfavoritePrompt(prompt.id);
      toast.success(nextValue ? "Added to favorites" : "Removed from favorites");
    } catch {
      mutate();
      toast.error("Failed to update favorite");
    }
  }

  function handleTagClick(tagName) {
    handleFiltersChange({ ...filters, tag: tagName });
  }

  async function handleExport() {
    const result = await exportPrompts("json");
    const url = URL.createObjectURL(result.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "promptnest.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imported = JSON.parse(await file.text());
    await importPrompts({ prompts: Array.isArray(imported) ? imported : imported.prompts ?? [] });
    mutate();
    event.target.value = "";
  }

  async function handleBulk(action) {
    await bulkPrompts({ prompt_ids: selectedIds, action });
    setSelectedIds([]);
    mutate();
  }

  async function handleHistory(prompt) {
    const result = await getPromptVersions(prompt.id);
    setHistory({ prompt, versions: result.data.data ?? [] });
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
              ? `${pagination.total} prompt${pagination.total !== 1 ? "s" : ""}${
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
          <Button onClick={handleExport} variant="ghost" size="md">Export</Button>
          <label className="cursor-pointer rounded-full border border-[#E5E7EB] dark:border-[#363847] px-4 py-2 text-xs font-medium text-[#374151] dark:text-[#9CA3AF]">
            Import<input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Filters */}
      <PromptFilters filters={filters} onChange={handleFiltersChange} />

      {/* List */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{errorMessage}</span>
          <button onClick={() => mutate()} className="font-semibold underline">Retry</button>
        </div>
      )}
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
        onSelect={(id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id])}
        selectedIds={selectedIds}
        onHistory={handleHistory}
      />

      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 flex items-center gap-2 rounded-xl border border-[#714B67]/30 bg-white/95 dark:bg-[#252733]/95 p-3 shadow-lg backdrop-blur">
          <span className="mr-auto text-sm font-medium">{selectedIds.length} selected</span>
          <button onClick={() => handleBulk("favorite")} className="rounded-full bg-[#714B67] px-3 py-1.5 text-xs text-white">Favorite</button>
          <button onClick={() => handleBulk("delete")} className="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-500">Delete</button>
        </div>
      )}

      {!loading && pagination.total > 0 && (
        <div className="flex items-center justify-between gap-3 text-sm text-[#6B7280]">
          <span>Page {pagination.page} of {Math.max(1, Math.ceil(pagination.total / pagination.page_size))}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-[#E5E7EB] dark:border-[#363847] px-3 py-1.5 disabled:opacity-40"
            >Previous</button>
            <button
              disabled={!pagination.has_next}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-[#E5E7EB] dark:border-[#363847] px-3 py-1.5 disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      )}

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

      {history && (
        <Modal title={`History: ${history.prompt.title}`} onClose={() => setHistory(null)} size="lg">
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {history.versions.map((version) => (
              <div key={version.id} className="rounded-xl border border-[#E5E7EB] dark:border-[#363847] p-4">
                <div className="flex items-center justify-between gap-3 mb-2"><span className="text-xs font-semibold">Version {version.version_number}</span><span className="text-[11px] text-[#9CA3AF]">{new Date(version.created_at).toLocaleString()}</span></div>
                <pre className="whitespace-pre-wrap rounded-lg bg-[#F3F4F6] dark:bg-[#2C2E3A] p-3 text-xs font-mono text-[#374151] dark:text-[#9CA3AF]">{version.prompt_content}</pre>
                <button onClick={async () => { await restorePromptVersion(history.prompt.id, version.id); setHistory(null); mutate(); }} className="mt-3 rounded-full border border-[#714B67]/30 px-3 py-1.5 text-xs font-medium text-[#714B67]">Restore this version</button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

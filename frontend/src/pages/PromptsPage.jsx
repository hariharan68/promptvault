import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "@phosphor-icons/react";
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#232735] dark:text-[#e4e6f0]">Prompts</h1>
          <p className="text-xs text-[#868da3] dark:text-[#737a95] mt-0.5">
            {!loading
              ? `${prompts.length} prompt${prompts.length !== 1 ? "s" : ""}${
                  filters.q || filters.tag || filters.group_id || filters.is_favorite
                    ? " matched"
                    : " in library"
                }`
              : "Loading..."}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="md">
          <Plus size={14} weight="bold" /> New Prompt
        </Button>
      </div>

      {/* Filters */}
      <PromptFilters filters={filters} onChange={handleFiltersChange} />

      {/* List */}
      <PromptList
        prompts={prompts}
        loading={loading}
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

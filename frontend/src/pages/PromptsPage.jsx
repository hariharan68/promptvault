import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: searchParams.get("q") ?? "",
    group_id: searchParams.get("group_id") ?? "",
    tag: searchParams.get("tag") ?? "",
    is_favorite: searchParams.get("is_favorite") ?? "",
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.group_id) params.group_id = filters.group_id;
    if (filters.tag) params.tag = filters.tag;
    if (filters.is_favorite) params.is_favorite = filters.is_favorite;
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.group_id) params.group_id = filters.group_id;
      if (filters.tag) params.tag = filters.tag;
      if (filters.is_favorite !== "") params.is_favorite = filters.is_favorite;
      const res = await getPrompts(params);
      setPrompts(res.data);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
        toast.success("Added to favorites ★");
      }
      fetchPrompts();
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  function handleTagClick(tagName) {
    setFilters((prev) => ({ ...prev, tag: tagName }));
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#232735]">Prompts</h1>
          <p className="text-xs text-[#868da3] mt-0.5">
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
          + New Prompt
        </Button>
      </div>

      {/* Filters */}
      <PromptFilters filters={filters} onChange={setFilters} />

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

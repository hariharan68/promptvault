import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSimple, Plus, DotsThree, PencilSimple, Trash, ArrowRight } from "@phosphor-icons/react";
import { getGroups, createGroup, updateGroup, deleteGroup } from "../api/groupApi.js";
import { getPrompts } from "../api/promptApi.js";
import { useToast } from "../components/common/Toast.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import Input from "../components/common/Input.jsx";

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 skeleton rounded-xl" />
        <div className="w-6 h-6 skeleton rounded-md" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-4 skeleton rounded-md w-3/5" />
        <div className="h-3 skeleton rounded-md w-2/5" />
      </div>
    </div>
  );
}

function GroupCard({ group, promptCount, onOpen, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      onClick={onOpen}
      className="group/card relative bg-white dark:bg-[#252733]
        border border-[#E5E7EB] dark:border-[#363847] rounded-xl p-5 cursor-pointer
        hover:border-[#714B67] hover:shadow-[0_4px_16px_-4px_rgba(113,75,103,0.15)] transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#F3EEF3] dark:bg-[#3D2B3A]
          flex items-center justify-center text-[#714B67] dark:text-[#C4A0BA]">
          <FolderSimple size={20} weight="fill" />
        </div>

        <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="w-7 h-7 flex items-center justify-center rounded-full
              opacity-0 group-hover/card:opacity-100 transition-opacity
              text-[#9CA3AF] dark:text-[#6B7280]
              hover:text-[#374151] dark:hover:text-[#9CA3AF]
              hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]"
          >
            <DotsThree size={16} weight="bold" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-32 z-10
              bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847]
              rounded-xl shadow-[0_8px_24px_-8px_rgba(17,24,39,0.15)] py-1 overflow-hidden animate-in">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(); }}
                className="w-full text-left flex items-center gap-2 px-3.5 py-2.5 text-sm
                  text-[#374151] dark:text-[#9CA3AF]
                  hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]
                  hover:text-[#111827] dark:hover:text-[#F1F2F6] transition-colors"
              >
                <PencilSimple size={13} /> Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                className="w-full text-left flex items-center gap-2 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-500/8 transition-colors"
              >
                <Trash size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-[#111827] dark:text-[#F1F2F6] text-sm leading-snug truncate mb-1">
          {group.name}
        </h3>
        <p className="text-xs text-[#6B7280]">{promptCount} prompt{promptCount !== 1 ? "s" : ""}</p>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs text-[#714B67] dark:text-[#C4A0BA] font-medium
        opacity-0 group-hover/card:opacity-100 transition-opacity">
        View prompts <ArrowRight size={11} weight="bold" />
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#252733]
        border border-[#E5E7EB] dark:border-[#363847]
        flex items-center justify-center mb-4 text-[#714B67]">
        <FolderSimple size={28} weight="regular" />
      </div>
      <p className="text-[#111827] dark:text-[#F1F2F6] font-semibold text-sm">No groups yet</p>
      <p className="text-[#6B7280] text-xs mt-1.5 max-w-52 leading-relaxed">
        Create a group to organize your prompts by topic or project
      </p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 bg-[#714B67] hover:bg-[#5A3A52]
          text-white text-sm font-medium
          px-5 py-2.5 rounded-full transition-all duration-200"
      >
        <Plus size={14} weight="bold" /> New Group
      </button>
    </div>
  );
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [groups, setGroups] = useState([]);
  const [promptCounts, setPromptCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [groupsRes, promptsRes] = await Promise.all([getGroups(), getPrompts()]);
      setGroups(groupsRes.data);
      const counts = {};
      promptsRes.data.forEach((p) => { if (p.group_id) counts[p.group_id] = (counts[p.group_id] || 0) + 1; });
      setPromptCounts(counts);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createGroup({ name: newName.trim() });
      setNewName(""); setShowCreate(false);
      toast.success("Group created"); loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to create group");
    } finally { setCreating(false); }
  }

  async function handleRename(e) {
    e.preventDefault();
    if (!editName.trim() || editName.trim() === editingGroup.name) { setEditingGroup(null); return; }
    try {
      await updateGroup(editingGroup.id, { name: editName.trim() });
      toast.success("Group renamed"); setEditingGroup(null); loadData();
    } catch (err) { toast.error(err.response?.data?.detail ?? "Failed to rename"); }
  }

  async function handleDelete(group) {
    if (!window.confirm(`Delete "${group.name}"? Prompts in this group will become ungrouped.`)) return;
    try {
      await deleteGroup(group.id); toast.success("Group deleted"); loadData();
    } catch (err) { toast.error(err.response?.data?.detail ?? "Failed to delete"); }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] dark:text-[#C4A0BA] mb-1">Organize</p>
          <h1 className="font-serif text-3xl text-[#111827] dark:text-[#F1F2F6]">Groups</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {loading ? "Loading..." : `${groups.length} group${groups.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={14} weight="bold" /> New Group
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <GroupCard
              key={g.id} group={g} promptCount={promptCounts[g.id] ?? 0}
              onOpen={() => navigate(`/prompts?group_id=${g.id}`)}
              onRename={() => { setEditingGroup(g); setEditName(g.name); }}
              onDelete={() => handleDelete(g)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Group" onClose={() => { setShowCreate(false); setNewName(""); }} size="sm">
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <Input label="Group name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Writing, Coding, Research" required />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowCreate(false); setNewName(""); }} type="button">Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create Group"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {editingGroup && (
        <Modal title="Rename Group" onClose={() => setEditingGroup(null)} size="sm">
          <form onSubmit={handleRename} className="flex flex-col gap-4">
            <Input label="Group name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingGroup(null)} type="button">Cancel</Button>
              <Button type="submit">Rename</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

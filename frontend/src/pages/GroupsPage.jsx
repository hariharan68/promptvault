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
    <div className="bg-white dark:bg-[#161923] border border-[#eaecf3] dark:border-[#252838]
      rounded-xl p-5 flex flex-col gap-4 shadow-[0_1px_3px_rgba(30,34,52,0.04)]">
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
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      onClick={onOpen}
      className="group/card relative bg-white dark:bg-[#161923]
        border border-[#eaecf3] dark:border-[#252838] rounded-xl p-5 cursor-pointer
        shadow-[0_1px_3px_rgba(30,34,52,0.04)]
        hover:border-[#6c63ff]/30 hover:shadow-[0_12px_28px_-10px_rgba(108,99,255,0.22)]
        transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r
        from-transparent via-[#6c63ff]/0 to-transparent
        group-hover/card:via-[#6c63ff]/40 transition-all duration-500" />

      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#6c63ff]/10 dark:bg-[#6c63ff]/15
          flex items-center justify-center text-[#6c63ff]">
          <FolderSimple size={20} weight="fill" />
        </div>

        {/* 3-dot menu */}
        <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="w-7 h-7 flex items-center justify-center rounded-md
              opacity-0 group-hover/card:opacity-100 transition-opacity
              text-[#aeb4c6] dark:text-[#525872]
              hover:text-[#4b5169] dark:hover:text-[#b0b6cc]
              hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a]"
          >
            <DotsThree size={16} weight="bold" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-36 z-10
              bg-white dark:bg-[#1c1f2e] border border-[#eaecf3] dark:border-[#252838]
              rounded-xl shadow-[0_12px_32px_-8px_rgba(30,34,52,0.18)] py-1 overflow-hidden animate-in">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(); }}
                className="w-full text-left flex items-center gap-2 px-3.5 py-2.5 text-sm
                  text-[#4b5169] dark:text-[#b0b6cc]
                  hover:bg-[#f4f6fb] dark:hover:bg-[#252838]
                  hover:text-[#232735] dark:hover:text-[#e4e6f0] transition-colors"
              >
                <PencilSimple size={13} /> Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                className="w-full text-left flex items-center gap-2 px-3.5 py-2.5 text-sm
                  text-[#ef4444] hover:bg-red-500/8 transition-colors"
              >
                <Trash size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-[#232735] dark:text-[#e4e6f0] text-sm leading-snug truncate mb-1">
          {group.name}
        </h3>
        <p className="text-xs text-[#868da3] dark:text-[#737a95]">
          {promptCount} prompt{promptCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs text-[#6c63ff] font-medium
        opacity-0 group-hover/card:opacity-100 transition-opacity">
        View prompts <ArrowRight size={11} weight="bold" />
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#161923]
        border border-[#eaecf3] dark:border-[#252838]
        flex items-center justify-center mb-4 text-[#6c63ff]
        shadow-[0_8px_24px_-10px_rgba(108,99,255,0.3)]">
        <FolderSimple size={28} weight="regular" />
      </div>
      <p className="text-[#232735] dark:text-[#e4e6f0] font-semibold text-sm">No groups yet</p>
      <p className="text-[#868da3] dark:text-[#737a95] text-xs mt-1.5 max-w-52 leading-relaxed">
        Create a group to organize your prompts by topic or project
      </p>
      <button
        onClick={onCreate}
        className="mt-5 flex items-center gap-2 bg-gradient-to-r from-[#6c63ff] to-[#8b83ff]
          hover:from-[#5a52e0] hover:to-[#7a71f5] text-white text-sm font-semibold
          px-5 py-2.5 rounded-xl transition-all duration-200
          shadow-[0_8px_20px_-6px_rgba(108,99,255,0.5)]"
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
      promptsRes.data.forEach((p) => {
        if (p.group_id) counts[p.group_id] = (counts[p.group_id] || 0) + 1;
      });
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
      setNewName("");
      setShowCreate(false);
      toast.success("Group created");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(e) {
    e.preventDefault();
    if (!editName.trim() || editName.trim() === editingGroup.name) { setEditingGroup(null); return; }
    try {
      await updateGroup(editingGroup.id, { name: editName.trim() });
      toast.success("Group renamed");
      setEditingGroup(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to rename");
    }
  }

  async function handleDelete(group) {
    if (!window.confirm(`Delete "${group.name}"? Prompts in this group will become ungrouped.`)) return;
    try {
      await deleteGroup(group.id);
      toast.success("Group deleted");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to delete");
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#232735] dark:text-[#e4e6f0]">Groups</h1>
          <p className="text-sm text-[#868da3] dark:text-[#737a95] mt-1">
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
              key={g.id}
              group={g}
              promptCount={promptCounts[g.id] ?? 0}
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
            <Input
              label="Group name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Writing, Coding, Research"
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowCreate(false); setNewName(""); }} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {editingGroup && (
        <Modal title="Rename Group" onClose={() => setEditingGroup(null)} size="sm">
          <form onSubmit={handleRename} className="flex flex-col gap-4">
            <Input
              label="Group name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
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

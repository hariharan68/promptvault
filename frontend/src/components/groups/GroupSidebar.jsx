import { useEffect, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { SquaresFour, Archive, FolderSimple, GearSix, Lock, Plus, DotsThree, PencilSimple, Trash } from "@phosphor-icons/react";
import { getGroups, createGroup, updateGroup, deleteGroup } from "../../api/groupApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../common/Toast.jsx";

export default function GroupSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const activeGroupId = searchParams.get("group_id");

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => { loadGroups(); }, []);

  async function loadGroups() {
    try {
      const res = await getGroups();
      setGroups(res.data);
    } catch {}
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await createGroup({ name: newGroupName.trim() });
      setGroups((prev) => [res.data, ...prev]);
      setNewGroupName("");
      setAdding(false);
      toast.success("Group created");
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to create group");
    }
  }

  async function handleRename(group) {
    if (!editingName.trim() || editingName.trim() === group.name) { setEditingId(null); return; }
    try {
      const res = await updateGroup(group.id, { name: editingName.trim() });
      setGroups((prev) => prev.map((g) => (g.id === group.id ? res.data : g)));
      toast.success("Group renamed");
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to rename");
    } finally { setEditingId(null); }
  }

  async function handleDelete(group) {
    if (!window.confirm(`Delete "${group.name}"? Prompts in this group will become ungrouped.`)) return;
    try {
      await deleteGroup(group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      toast.success("Group deleted");
      if (activeGroupId === group.id) navigate("/prompts");
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to delete");
    }
  }

  function handleLogout() { logout(); navigate("/login"); }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
      isActive
        ? "bg-[#F3EEF3] dark:bg-[#3D2B3A] text-[#714B67] dark:text-[#C4A0BA] font-semibold"
        : "text-[#374151] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A] hover:text-[#111827] dark:hover:text-[#F1F2F6]"
    }`;

  const avatarLetter = user?.username?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-[#111827]/30 backdrop-blur-[2px] z-20 md:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-60 flex flex-col z-30
        bg-white dark:bg-[#1A1B22] border-r border-[#E5E7EB] dark:border-[#363847]
        transition-transform duration-250 ease-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:z-auto`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E5E7EB] dark:border-[#363847]">
          <div className="w-8 h-8 bg-[#714B67] rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock size={15} className="text-white" weight="bold" />
          </div>
          <span className="font-serif text-[#111827] dark:text-[#F1F2F6] text-[17px] tracking-tight">PromptVault</span>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-0.5 px-3 py-3 border-b border-[#E5E7EB] dark:border-[#363847]">
          <NavLink to="/dashboard" className={navLinkClass} onClick={onClose}>
            <SquaresFour size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/prompts" end className={navLinkClass} onClick={onClose}>
            <Archive size={16} />
            All Prompts
          </NavLink>
          <NavLink to="/groups" className={navLinkClass} onClick={onClose}>
            <FolderSimple size={16} />
            Groups
          </NavLink>
          <NavLink to="/settings" className={navLinkClass} onClick={onClose}>
            <GearSix size={16} />
            Settings
          </NavLink>
        </nav>

        {/* Groups quick-list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF] dark:text-[#6B7280]">
              Quick access
            </span>
            <button
              onClick={() => setAdding((v) => !v)}
              title="New group"
              className="w-5 h-5 flex items-center justify-center rounded-md
                text-[#9CA3AF] dark:text-[#6B7280]
                hover:text-[#714B67] hover:bg-[#F3EEF3] dark:hover:bg-[#3D2B3A] transition-all"
            >
              <Plus size={12} weight="bold" />
            </button>
          </div>

          {adding && (
            <form onSubmit={handleCreate} className="flex gap-1.5 mb-2">
              <input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name..."
                className="flex-1 bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#714B67]/40
                  focus:border-[#714B67] rounded-lg px-3 py-1.5 text-sm
                  text-[#111827] dark:text-[#F1F2F6] outline-none
                  placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] transition-colors"
              />
              <button type="submit"
                className="bg-[#714B67] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#5A3A52] transition-colors font-medium">
                Add
              </button>
            </form>
          )}

          <div className="flex flex-col gap-0.5">
            {groups.map((g) => {
              const isActive = activeGroupId === g.id;
              return (
                <div key={g.id}
                  className={`group/item flex items-center rounded-lg transition-all duration-150 ${
                    isActive ? "bg-[#F3EEF3]/60 dark:bg-[#3D2B3A]/60" : "hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]"
                  }`}
                >
                  {editingId === g.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(g)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(g); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 bg-transparent px-3 py-2 text-sm text-[#111827] dark:text-[#F1F2F6]
                        outline-none border-b border-[#714B67]/50"
                    />
                  ) : (
                    <NavLink
                      to={`/prompts?group_id=${g.id}`}
                      onClick={onClose}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm truncate ${
                        isActive ? "text-[#714B67] dark:text-[#C4A0BA] font-medium" : "text-[#374151] dark:text-[#9CA3AF]"
                      }`}
                    >
                      <span className={`font-mono text-[10px] ${isActive ? "text-[#714B67]" : "text-[#9CA3AF] dark:text-[#6B7280]"}`}>#</span>
                      <span className="truncate">{g.name}</span>
                    </NavLink>
                  )}

                  <div className="relative opacity-0 group-hover/item:opacity-100 transition-opacity pr-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === g.id ? null : g.id); }}
                      className="p-1 rounded-md text-[#9CA3AF] dark:text-[#6B7280]
                        hover:text-[#374151] dark:hover:text-[#9CA3AF]
                        hover:bg-[#E5E7EB] dark:hover:bg-[#363847] transition-colors"
                    >
                      <DotsThree size={14} weight="bold" />
                    </button>
                    {openMenuId === g.id && (
                      <div className="absolute right-0 top-7 w-32
                        bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847]
                        rounded-xl shadow-[0_8px_24px_-8px_rgba(17,24,39,0.15)] z-10 py-1 overflow-hidden"
                        onMouseLeave={() => setOpenMenuId(null)}
                      >
                        <button
                          onClick={() => { setEditingId(g.id); setEditingName(g.name); setOpenMenuId(null); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm
                            text-[#374151] dark:text-[#9CA3AF]
                            hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]
                            hover:text-[#111827] dark:hover:text-[#F1F2F6] transition-colors"
                        >
                          <PencilSimple size={12} /> Rename
                        </button>
                        <button
                          onClick={() => { handleDelete(g); setOpenMenuId(null); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/8 transition-colors"
                        >
                          <Trash size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {groups.length === 0 && !adding && (
              <p className="text-xs text-[#D1D5DB] dark:text-[#363847] px-3 py-2 italic">No groups yet</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[#E5E7EB] dark:border-[#363847]">
          <div className="flex items-center gap-2.5 px-2 mb-2.5">
            <div className="w-7 h-7 rounded-full bg-[#F3EEF3] dark:bg-[#3D2B3A]
              flex items-center justify-center text-xs font-bold text-[#714B67] dark:text-[#C4A0BA] flex-shrink-0">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#374151] dark:text-[#9CA3AF] truncate">{user?.username}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-[#6B7280] dark:text-[#6B7280] hover:text-red-500
              rounded-lg py-2 hover:bg-red-500/6 border border-[#E5E7EB] dark:border-[#363847]
              hover:border-red-500/25 transition-all"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

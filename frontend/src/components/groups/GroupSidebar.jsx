import { useEffect, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { SquaresFour, Archive, FolderSimple, GearSix, Plus, DotsThree, PencilSimple, Trash } from "@phosphor-icons/react";
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
    if (!editingName.trim() || editingName.trim() === group.name) {
      setEditingId(null);
      return;
    }
    try {
      const res = await updateGroup(group.id, { name: editingName.trim() });
      setGroups((prev) => prev.map((g) => (g.id === group.id ? res.data : g)));
      toast.success("Group renamed");
    } catch (err) {
      toast.error(err.response?.data?.detail ?? "Failed to rename");
    } finally {
      setEditingId(null);
    }
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

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
      isActive
        ? "bg-[#6c63ff] text-white font-medium shadow-[0_6px_16px_-6px_rgba(108,99,255,0.6)]"
        : "text-[#5b6178] dark:text-[#959baf] hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a] hover:text-[#232735] dark:hover:text-[#e4e6f0]"
    }`;

  const avatarLetter = user?.username?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#1a1e2e]/30 backdrop-blur-[2px] z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 flex flex-col z-30
          bg-white dark:bg-[#161923] border-r border-[#eaecf3] dark:border-[#252838]
          transition-transform duration-250 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:z-auto`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-[#eaecf3] dark:border-[#252838]">
          <div className="w-9 h-9 bg-gradient-to-br from-[#6c63ff] to-[#8b83ff] rounded-xl
            flex items-center justify-center flex-shrink-0
            shadow-[0_6px_16px_-4px_rgba(108,99,255,0.5)]">
            <span className="text-white font-black text-sm">V</span>
          </div>
          <span className="font-bold text-[#232735] dark:text-[#e4e6f0] text-base tracking-tight">PromptVault</span>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-1 px-3 py-3 border-b border-[#eaecf3] dark:border-[#252838]">
          <NavLink to="/dashboard" className={navLinkClass} onClick={onClose}>
            <SquaresFour size={17} />
            Dashboard
          </NavLink>
          <NavLink to="/prompts" end className={navLinkClass} onClick={onClose}>
            <Archive size={17} />
            All Prompts
          </NavLink>
          <NavLink to="/groups" className={navLinkClass} onClick={onClose}>
            <FolderSimple size={17} />
            Groups
          </NavLink>
          <NavLink to="/settings" className={navLinkClass} onClick={onClose}>
            <GearSix size={17} />
            Settings
          </NavLink>
        </nav>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#aeb4c6] dark:text-[#525872]">
              Groups
            </span>
            <button
              onClick={() => setAdding((v) => !v)}
              title="New group"
              className="w-6 h-6 flex items-center justify-center rounded-md
                text-[#aeb4c6] dark:text-[#525872]
                hover:text-[#6c63ff] hover:bg-[#6c63ff]/10 transition-all"
            >
              <Plus size={14} weight="bold" />
            </button>
          </div>

          {adding && (
            <form onSubmit={handleCreate} className="flex gap-1.5 mb-3">
              <input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name..."
                className="flex-1 bg-[#f7f8fc] dark:bg-[#0f1118] border border-[#6c63ff]/40
                  focus:border-[#6c63ff]/80 rounded-lg px-3 py-2 text-sm
                  text-[#232735] dark:text-[#e4e6f0] outline-none
                  placeholder:text-[#aeb4c6] dark:placeholder:text-[#525872] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#6c63ff] text-white text-xs px-3 py-2 rounded-lg
                  hover:bg-[#5a52e0] transition-colors font-medium"
              >
                Add
              </button>
            </form>
          )}

          <div className="flex flex-col gap-0.5">
            {groups.map((g) => {
              const isActive = activeGroupId === g.id;
              return (
                <div
                  key={g.id}
                  className={`group/item flex items-center rounded-lg transition-all duration-150 ${
                    isActive
                      ? "bg-[#6c63ff]/10"
                      : "hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a]"
                  }`}
                >
                  {editingId === g.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(g)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(g);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 bg-transparent px-3 py-2 text-sm
                        text-[#232735] dark:text-[#e4e6f0]
                        outline-none border-b border-[#6c63ff]/50"
                    />
                  ) : (
                    <NavLink
                      to={`/prompts?group_id=${g.id}`}
                      onClick={onClose}
                      className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm truncate ${
                        isActive
                          ? "text-[#6c63ff] font-medium"
                          : "text-[#5b6178] dark:text-[#959baf]"
                      }`}
                    >
                      <span className={`text-xs font-bold ${isActive ? "text-[#6c63ff]" : "text-[#aeb4c6] dark:text-[#525872]"}`}>#</span>
                      <span className="truncate">{g.name}</span>
                    </NavLink>
                  )}

                  <div className="relative opacity-0 group-hover/item:opacity-100 transition-opacity pr-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === g.id ? null : g.id);
                      }}
                      className="p-1.5 rounded-md text-[#aeb4c6] dark:text-[#525872]
                        hover:text-[#4b5169] dark:hover:text-[#b0b6cc]
                        hover:bg-[#eef0f6] dark:hover:bg-[#1e2130] transition-colors"
                    >
                      <DotsThree size={16} weight="bold" />
                    </button>
                    {openMenuId === g.id && (
                      <div
                        className="absolute right-0 top-8 w-36
                          bg-white dark:bg-[#1c1f2e] border border-[#eaecf3] dark:border-[#252838]
                          rounded-xl shadow-[0_12px_32px_-8px_rgba(30,34,52,0.18)] z-10 py-1 overflow-hidden"
                        onMouseLeave={() => setOpenMenuId(null)}
                      >
                        <button
                          onClick={() => {
                            setEditingId(g.id);
                            setEditingName(g.name);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3.5 py-2.5 text-sm
                            text-[#4b5169] dark:text-[#b0b6cc]
                            hover:bg-[#f4f6fb] dark:hover:bg-[#252838]
                            hover:text-[#232735] dark:hover:text-[#e4e6f0] transition-colors"
                        >
                          <PencilSimple size={13} /> Rename
                        </button>
                        <button
                          onClick={() => { handleDelete(g); setOpenMenuId(null); }}
                          className="w-full text-left flex items-center gap-2 px-3.5 py-2.5 text-sm
                            text-[#ef4444] hover:bg-red-500/8 transition-colors"
                        >
                          <Trash size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {groups.length === 0 && !adding && (
              <p className="text-sm text-[#c9cdda] dark:text-[#3a3e55] px-3 py-2 italic">No groups yet</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-5 border-t border-[#eaecf3] dark:border-[#252838]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#8b83ff]
              flex items-center justify-center text-sm font-bold text-white flex-shrink-0
              shadow-[0_4px_10px_-3px_rgba(108,99,255,0.5)]">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#4b5169] dark:text-[#b0b6cc] truncate">{user?.username}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-[#868da3] dark:text-[#737a95] hover:text-red-500
              rounded-lg py-2 hover:bg-red-500/6 border border-[#eaecf3] dark:border-[#252838]
              hover:border-red-500/25 transition-all"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

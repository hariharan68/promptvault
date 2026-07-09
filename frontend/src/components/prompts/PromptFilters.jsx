import { useEffect, useState } from "react";
import { getGroups } from "../../api/groupApi.js";
import { getTags } from "../../api/tagApi.js";

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-32">
      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#868da3]">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-[#f7f8fc] border border-[#e0e3ec] rounded-xl text-sm
          text-[#232735] px-3.5 py-2.5 outline-none
          focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12 focus:bg-white
          hover:border-[#c9cdda] transition-all duration-200 cursor-pointer appearance-none"
      >
        {children}
      </select>
    </div>
  );
}

export default function PromptFilters({ filters, onChange }) {
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    getGroups().then((r) => setGroups(r.data)).catch(() => {});
    getTags().then((r) => setTags(r.data)).catch(() => {});
  }, []);

  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function clear() {
    onChange({ q: "", group_id: "", tag: "", is_favorite: "" });
  }

  const hasActiveFilters = filters.q || filters.group_id || filters.tag || filters.is_favorite;

  return (
    <div className="bg-white border border-[#eaecf3] rounded-xl p-4 shadow-[0_1px_3px_rgba(30,34,52,0.04)]">
      <div className="flex flex-wrap gap-3 items-end">

        {/* Search */}
        <div className="flex flex-col gap-1.5 flex-[2] min-w-44">
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#868da3]">Search</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aeb4c6] text-xs pointer-events-none">⌕</span>
            <input
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Search title, content, description..."
              className="w-full bg-[#f7f8fc] border border-[#e0e3ec] rounded-xl text-sm
                text-[#232735] placeholder:text-[#aeb4c6] pl-8 pr-3.5 py-2.5 outline-none
                focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12 focus:bg-white
                hover:border-[#c9cdda] transition-all duration-200"
            />
          </div>
        </div>

        {/* Group */}
        <FilterSelect label="Group" value={filters.group_id} onChange={(e) => set("group_id", e.target.value)}>
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </FilterSelect>

        {/* Tag */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-32">
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#868da3]">Tag</label>
          <input
            value={filters.tag}
            onChange={(e) => set("tag", e.target.value)}
            placeholder="Filter by tag..."
            list="tag-suggestions"
            className="w-full bg-[#f7f8fc] border border-[#e0e3ec] rounded-xl text-sm
              text-[#232735] placeholder:text-[#aeb4c6] px-3.5 py-2.5 outline-none
              focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12 focus:bg-white
              hover:border-[#c9cdda] transition-all duration-200"
          />
          <datalist id="tag-suggestions">
            {tags.map((t) => <option key={t.id} value={t.name} />)}
          </datalist>
        </div>

        {/* Favorites */}
        <FilterSelect label="Favorites" value={filters.is_favorite} onChange={(e) => set("is_favorite", e.target.value)}>
          <option value="">All prompts</option>
          <option value="true">★ Favorites only</option>
          <option value="false">☆ Non-favorites</option>
        </FilterSelect>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clear}
            className="flex-shrink-0 self-end flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs
              font-medium text-[#868da3] hover:text-red-500 border border-[#e0e3ec]
              hover:border-red-500/30 hover:bg-red-500/6 transition-all duration-200"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f0f1f6]">
          {filters.q && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#6c63ff]/8 border border-[#6c63ff]/20
              rounded-full text-xs text-[#6c63ff]">
              <span className="opacity-60">search:</span> {filters.q}
              <button onClick={() => set("q", "")} className="hover:text-red-500 transition-colors ml-0.5">×</button>
            </span>
          )}
          {filters.tag && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#6c63ff]/8 border border-[#6c63ff]/20
              rounded-full text-xs text-[#6c63ff]">
              <span className="opacity-60">#</span>{filters.tag}
              <button onClick={() => set("tag", "")} className="hover:text-red-500 transition-colors ml-0.5">×</button>
            </span>
          )}
          {filters.is_favorite === "true" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25
              rounded-full text-xs text-amber-600">
              ★ Favorites only
              <button onClick={() => set("is_favorite", "")} className="hover:text-red-500 transition-colors ml-0.5">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

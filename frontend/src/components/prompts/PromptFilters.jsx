import { useEffect, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { getGroups } from "../../api/groupApi.js";
import { getTags } from "../../api/tagApi.js";

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-32">
      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#868da3] dark:text-[#737a95]">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-[#f7f8fc] dark:bg-[#0f1118] border border-[#e0e3ec] dark:border-[#2d3047] rounded-xl text-sm
          text-[#232735] dark:text-[#e4e6f0] px-4 py-3 outline-none
          focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12
          focus:bg-white dark:focus:bg-[#161923]
          hover:border-[#c9cdda] dark:hover:border-[#3a3e58] transition-all duration-200 cursor-pointer appearance-none"
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
    <div className="bg-white dark:bg-[#161923] border border-[#eaecf3] dark:border-[#252838] rounded-xl p-5 shadow-[0_1px_3px_rgba(30,34,52,0.04)]">
      <div className="flex flex-wrap gap-3 items-end">

        <div className="flex flex-col gap-2 flex-[2] min-w-44">
          <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#868da3] dark:text-[#737a95]">Search</label>
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aeb4c6] dark:text-[#525872] pointer-events-none"
            />
            <input
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Search title, content, description..."
              className="w-full bg-[#f7f8fc] dark:bg-[#0f1118] border border-[#e0e3ec] dark:border-[#2d3047] rounded-xl text-sm
                text-[#232735] dark:text-[#e4e6f0] placeholder:text-[#aeb4c6] dark:placeholder:text-[#525872]
                pl-9 pr-4 py-3 outline-none
                focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12
                focus:bg-white dark:focus:bg-[#161923]
                hover:border-[#c9cdda] dark:hover:border-[#3a3e58] transition-all duration-200"
            />
          </div>
        </div>

        <FilterSelect label="Group" value={filters.group_id} onChange={(e) => set("group_id", e.target.value)}>
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </FilterSelect>

        <div className="flex flex-col gap-2 flex-1 min-w-32">
          <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#868da3] dark:text-[#737a95]">Tag</label>
          <input
            value={filters.tag}
            onChange={(e) => set("tag", e.target.value)}
            placeholder="Filter by tag..."
            list="tag-suggestions"
            className="w-full bg-[#f7f8fc] dark:bg-[#0f1118] border border-[#e0e3ec] dark:border-[#2d3047] rounded-xl text-sm
              text-[#232735] dark:text-[#e4e6f0] placeholder:text-[#aeb4c6] dark:placeholder:text-[#525872]
              px-4 py-3 outline-none
              focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12
              focus:bg-white dark:focus:bg-[#161923]
              hover:border-[#c9cdda] dark:hover:border-[#3a3e58] transition-all duration-200"
          />
          <datalist id="tag-suggestions">
            {tags.map((t) => <option key={t.id} value={t.name} />)}
          </datalist>
        </div>

        <FilterSelect label="Favorites" value={filters.is_favorite} onChange={(e) => set("is_favorite", e.target.value)}>
          <option value="">All prompts</option>
          <option value="true">Favorites only</option>
          <option value="false">Non-favorites</option>
        </FilterSelect>

        {hasActiveFilters && (
          <button
            onClick={clear}
            className="flex-shrink-0 self-end flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm
              font-medium text-[#868da3] dark:text-[#737a95] hover:text-red-500
              border border-[#e0e3ec] dark:border-[#2d3047]
              hover:border-red-500/30 hover:bg-red-500/6 transition-all duration-200"
          >
            <X size={13} weight="bold" /> Clear
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3.5 pt-3.5 border-t border-[#f0f1f6] dark:border-[#1d2030]">
          {filters.q && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6c63ff]/8 border border-[#6c63ff]/20
              rounded-full text-xs text-[#6c63ff]">
              <span className="opacity-60">search:</span> {filters.q}
              <button onClick={() => set("q", "")} className="hover:text-red-500 transition-colors ml-0.5">
                <X size={10} weight="bold" />
              </button>
            </span>
          )}
          {filters.tag && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6c63ff]/8 border border-[#6c63ff]/20
              rounded-full text-xs text-[#6c63ff]">
              <span className="opacity-60">#</span>{filters.tag}
              <button onClick={() => set("tag", "")} className="hover:text-red-500 transition-colors ml-0.5">
                <X size={10} weight="bold" />
              </button>
            </span>
          )}
          {filters.is_favorite === "true" && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25
              rounded-full text-xs text-amber-600">
              Favorites only
              <button onClick={() => set("is_favorite", "")} className="hover:text-red-500 transition-colors ml-0.5">
                <X size={10} weight="bold" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

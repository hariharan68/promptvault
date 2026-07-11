import { useEffect, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { getGroups } from "../../api/groupApi.js";
import { getTags } from "../../api/tagApi.js";

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-32">
      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280] dark:text-[#6B7280]">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847] rounded-xl text-sm
          text-[#111827] dark:text-[#F1F2F6] px-4 py-2.5 outline-none
          focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 focus:bg-white dark:focus:bg-[#252733]
          hover:border-[#9CA3AF] dark:hover:border-[#4A4D60] transition-all duration-200 cursor-pointer appearance-none"
      >
        {children}
      </select>
    </div>
  );
}

export default function PromptFilters({ filters, onChange }) {
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchInput, setSearchInput] = useState(filters.q);

  useEffect(() => {
    getGroups().then((r) => setGroups(r.data)).catch(() => {});
    getTags().then((r) => setTags(r.data)).catch(() => {});
  }, []);

  useEffect(() => setSearchInput(filters.q), [filters.q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.q) onChange({ ...filters, q: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function set(key, value) { onChange({ ...filters, [key]: value }); }
  function clear() { onChange({ q: "", group_id: "", tag: "", is_favorite: "" }); }

  const hasActiveFilters = filters.q || filters.group_id || filters.tag || filters.is_favorite;

  return (
    <div className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-xl p-5">
      <div className="flex flex-wrap gap-3 items-end">

        <div className="flex flex-col gap-1.5 flex-[2] min-w-44">
          <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280] dark:text-[#6B7280]">Search</label>
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#6B7280] pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search prompts..."
              className="w-full bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847] rounded-xl text-sm
                text-[#111827] dark:text-[#F1F2F6] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280]
                pl-9 pr-4 py-2.5 outline-none
                focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 focus:bg-white dark:focus:bg-[#252733]
                hover:border-[#9CA3AF] dark:hover:border-[#4A4D60] transition-all duration-200"
            />
          </div>
        </div>

        <FilterSelect label="Group" value={filters.group_id} onChange={(e) => set("group_id", e.target.value)}>
          <option value="">All groups</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </FilterSelect>

        <div className="flex flex-col gap-1.5 flex-1 min-w-32">
          <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280] dark:text-[#6B7280]">Tag</label>
          <input
            value={filters.tag}
            onChange={(e) => set("tag", e.target.value)}
            placeholder="Filter by tag..."
            list="tag-suggestions"
            className="w-full bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847] rounded-xl text-sm
              text-[#111827] dark:text-[#F1F2F6] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280]
              px-4 py-2.5 outline-none
              focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 focus:bg-white dark:focus:bg-[#252733]
              hover:border-[#9CA3AF] dark:hover:border-[#4A4D60] transition-all duration-200"
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
            className="flex-shrink-0 self-end flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm
              font-medium text-[#6B7280] dark:text-[#6B7280] hover:text-red-500
              border border-[#E5E7EB] dark:border-[#363847]
              hover:border-red-500/30 hover:bg-red-500/6 transition-all duration-200"
          >
            <X size={12} weight="bold" /> Clear
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3.5 pt-3.5 border-t border-[#E5E7EB] dark:border-[#363847]">
          {filters.q && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EEF3] dark:bg-[#3D2B3A]
              border border-[#E0D0DC] dark:border-[#5A3A54] rounded-full text-xs text-[#714B67] dark:text-[#C4A0BA]">
              <span className="opacity-60">search:</span> {filters.q}
              <button onClick={() => set("q", "")} className="hover:text-red-500 transition-colors ml-0.5"><X size={10} weight="bold" /></button>
            </span>
          )}
          {filters.tag && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EEF3] dark:bg-[#3D2B3A]
              border border-[#E0D0DC] dark:border-[#5A3A54] rounded-full text-xs text-[#714B67] dark:text-[#C4A0BA]">
              <span className="opacity-60">#</span>{filters.tag}
              <button onClick={() => set("tag", "")} className="hover:text-red-500 transition-colors ml-0.5"><X size={10} weight="bold" /></button>
            </span>
          )}
          {filters.is_favorite === "true" && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25
              rounded-full text-xs text-amber-600">
              Favorites only
              <button onClick={() => set("is_favorite", "")} className="hover:text-red-500 transition-colors ml-0.5"><X size={10} weight="bold" /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

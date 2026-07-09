export default function TagPill({ name, onClick }) {
  return (
    <span
      onClick={onClick}
      title={onClick ? `Filter by "${name}"` : undefined}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
        bg-[#6c63ff]/8 border border-[#6c63ff]/18 text-[#6c63ff]
        ${onClick
          ? "cursor-pointer hover:bg-[#6c63ff]/15 hover:border-[#6c63ff]/40 transition-all duration-150"
          : ""
        }`}
    >
      <span className="text-[8px] opacity-70">#</span>
      {name}
    </span>
  );
}

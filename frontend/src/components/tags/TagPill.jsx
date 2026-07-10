export default function TagPill({ name, onClick }) {
  return (
    <span
      onClick={onClick}
      title={onClick ? `Filter by "${name}"` : undefined}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
        bg-[#F3EEF3] border border-[#E0D0DC] text-[#714B67]
        dark:bg-[#3D2B3A] dark:border-[#5A3A54] dark:text-[#C4A0BA]
        ${onClick
          ? "cursor-pointer hover:bg-[#714B67]/15 hover:border-[#714B67]/40 transition-all duration-150"
          : ""
        }`}
    >
      <span className="text-[8px] opacity-60">#</span>
      {name}
    </span>
  );
}

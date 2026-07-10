export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  className = "",
  list,
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-semibold text-[#868da3] dark:text-[#737a95] uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        list={list}
        className={`w-full bg-[#f7f8fc] dark:bg-[#0f1118] border border-[#e0e3ec] dark:border-[#2d3047]
          rounded-xl text-[#232735] dark:text-[#e4e6f0]
          placeholder:text-[#aeb4c6] dark:placeholder:text-[#525872]
          px-4 py-3 text-sm outline-none
          focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12
          focus:bg-white dark:focus:bg-[#161923]
          hover:border-[#c9cdda] dark:hover:border-[#3a3e58] transition-all duration-200
          ${className}`}
      />
    </div>
  );
}

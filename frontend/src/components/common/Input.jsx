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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#868da3] uppercase tracking-widest">
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
        className={`w-full bg-[#f7f8fc] border border-[#e0e3ec] rounded-xl text-[#232735]
          placeholder:text-[#aeb4c6] px-3.5 py-2.5 text-sm outline-none
          focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12 focus:bg-white
          hover:border-[#c9cdda] transition-all duration-200
          ${className}`}
      />
    </div>
  );
}

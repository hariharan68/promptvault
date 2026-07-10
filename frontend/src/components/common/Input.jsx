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
        <label className="text-[11px] font-semibold text-[#6B7280] dark:text-[#6B7280] uppercase tracking-[0.12em]">
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
        className={`w-full bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847]
          rounded-xl text-[#111827] dark:text-[#F1F2F6]
          placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280]
          px-4 py-3 text-sm outline-none
          focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15 focus:bg-white dark:focus:bg-[#252733]
          hover:border-[#9CA3AF] dark:hover:border-[#4A4D60] transition-all duration-200
          ${className}`}
      />
    </div>
  );
}

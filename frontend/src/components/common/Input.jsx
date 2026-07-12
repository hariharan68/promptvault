export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  className = "",
  list,
  // Auth pages (Login/Register) are light-only surfaces (white panel), so their
  // inputs must stay light even when the app-wide dark theme is active. Pass
  // `light` there to drop the dark: variants that would otherwise leak in.
  light = false,
}) {
  const surface = light
    ? `bg-[#F3F4F6] border-[#E5E7EB] text-[#111827]
       placeholder:text-[#9CA3AF] focus:bg-white hover:border-[#9CA3AF]`
    : `bg-[#F3F4F6] dark:bg-[#2C2E3A] border-[#E5E7EB] dark:border-[#363847] text-[#111827] dark:text-[#F1F2F6]
       placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280]
       focus:bg-white dark:focus:bg-[#252733] hover:border-[#9CA3AF] dark:hover:border-[#4A4D60]`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.12em]">
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
        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none
          focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/15
          transition-all duration-200 ${surface} ${className}`}
      />
    </div>
  );
}

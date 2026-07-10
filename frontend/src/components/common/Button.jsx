const variants = {
  primary: `bg-[#714B67] hover:bg-[#5A3A52]
    text-white font-medium
    shadow-[0_4px_14px_-4px_rgba(113,75,103,0.4)]
    hover:shadow-[0_6px_18px_-4px_rgba(113,75,103,0.5)]
    active:scale-[0.98]`,

  accent: `bg-[#714B67] hover:bg-[#5A3A52]
    text-white font-medium
    shadow-[0_4px_14px_-4px_rgba(113,75,103,0.45)]
    hover:shadow-[0_6px_18px_-4px_rgba(113,75,103,0.55)]
    active:scale-[0.98]`,

  secondary: `bg-white dark:bg-[#252733] hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]
    text-[#111827] dark:text-[#F1F2F6] font-medium
    border border-[#E5E7EB] dark:border-[#363847] hover:border-[#714B67] dark:hover:border-[#714B67]
    active:scale-[0.98]`,

  ghost: `bg-transparent hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A]
    text-[#374151] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F1F2F6] font-medium
    border border-[#E5E7EB] dark:border-[#363847]
    active:scale-[0.98]`,

  danger: `bg-red-500/8 hover:bg-red-500/14 text-red-500 font-medium
    border border-red-500/25 hover:border-red-500/45
    active:scale-[0.98]`,
};

const sizes = {
  sm: "px-3.5 py-1.5 text-xs rounded-full",
  md: "px-4 py-2 text-sm rounded-full",
  lg: "px-5 py-2.5 text-sm rounded-full",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

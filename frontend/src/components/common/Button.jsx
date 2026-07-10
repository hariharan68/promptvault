const variants = {
  primary: `bg-gradient-to-r from-[#6c63ff] to-[#8b83ff]
    hover:from-[#5a52e0] hover:to-[#7a71f5]
    text-white font-semibold
    shadow-[0_8px_20px_-6px_rgba(108,99,255,0.5)]
    hover:shadow-[0_10px_24px_-6px_rgba(108,99,255,0.6)]
    active:scale-[0.98]`,

  secondary: `bg-white dark:bg-[#161923] hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a]
    text-[#232735] dark:text-[#e4e6f0] font-medium
    border border-[#e0e3ec] dark:border-[#2d3047] hover:border-[#6c63ff]/40
    active:scale-[0.98]`,

  ghost: `bg-white dark:bg-[#161923] hover:bg-[#f4f6fb] dark:hover:bg-[#1a1d2a]
    text-[#5b6178] dark:text-[#959baf] hover:text-[#232735] dark:hover:text-[#e4e6f0] font-medium
    border border-[#e0e3ec] dark:border-[#2d3047] hover:border-[#c9cdda] dark:hover:border-[#3a3e58]
    active:scale-[0.98]`,

  danger: `bg-[#ef4444]/8 hover:bg-[#ef4444]/14 text-[#ef4444] font-medium
    border border-[#ef4444]/25 hover:border-[#ef4444]/45
    active:scale-[0.98]`,
};

const sizes = {
  sm: "px-3.5 py-2 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-5 py-3 text-sm rounded-xl",
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

import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col items-center justify-center gap-5 text-center p-6">
      <div className="relative">
        <div className="absolute inset-0 bg-[#6c63ff]/10 rounded-full blur-3xl" />
        <div className="relative text-8xl font-black text-[#dfe3ee] tracking-tighter select-none">
          404
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-bold text-[#232735]">Page not found</h1>
        <p className="text-[#868da3] text-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
      </div>

      <Link
        to="/dashboard"
        className="bg-gradient-to-r from-[#6c63ff] to-[#8b83ff]
          hover:from-[#5a52e0] hover:to-[#7a71f5] text-white text-sm font-semibold
          px-6 py-2.5 rounded-xl transition-all duration-200
          shadow-[0_8px_20px_-6px_rgba(108,99,255,0.5)]
          hover:shadow-[0_10px_24px_-6px_rgba(108,99,255,0.6)]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

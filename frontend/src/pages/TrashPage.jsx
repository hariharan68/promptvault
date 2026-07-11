import { useEffect, useState } from "react";
import { Archive, ArrowCounterClockwise } from "@phosphor-icons/react";
import { getTrash, restorePrompt } from "../api/productApi.js";
import Button from "../components/common/Button.jsx";

export default function TrashPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    getTrash().then((res) => setPrompts(res.data.data ?? [])).catch(() => setError("Unable to load trash.")).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRestore(prompt) {
    await restorePrompt(prompt.id);
    setPrompts((items) => items.filter((item) => item.id !== prompt.id));
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] dark:text-[#C4A0BA]">Recovery</p>
        <h1 className="font-serif text-3xl text-[#111827] dark:text-[#F1F2F6]">Trash</h1>
        <p className="text-sm text-[#6B7280] mt-1">Restore deleted prompts before they are permanently removed.</p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!loading && prompts.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center text-[#6B7280]">
          <Archive size={32} className="mb-3 text-[#714B67]" />
          <p className="font-semibold">Trash is empty</p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#E5E7EB] dark:border-[#363847] bg-white dark:bg-[#252733] px-4 py-3">
            <div className="min-w-0"><p className="font-medium truncate text-[#111827] dark:text-[#F1F2F6]">{prompt.title}</p><p className="text-xs text-[#6B7280] truncate">Deleted {new Date(prompt.deleted_at).toLocaleString()}</p></div>
            <Button size="sm" variant="ghost" onClick={() => handleRestore(prompt)}><ArrowCounterClockwise size={14} /> Restore</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

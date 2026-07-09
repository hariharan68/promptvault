import { useEffect, useState } from "react";
import { getGroups } from "../../api/groupApi.js";
import Button from "../common/Button.jsx";
import Input from "../common/Input.jsx";

const EMPTY = { title: "", description: "", prompt_content: "", group_id: "", tag_names: "" };

export default function PromptEditor({ initial = null, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [groups, setGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getGroups().then((r) => setGroups(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title ?? "",
        description: initial.description ?? "",
        prompt_content: initial.prompt_content ?? "",
        group_id: initial.group_id ?? "",
        tag_names: initial.tags?.map((t) => t.name).join(", ") ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.prompt_content.trim()) { setError("Prompt content is required."); return; }
    setError("");
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim() || null,
        prompt_content: form.prompt_content.trim(),
        group_id: form.group_id || null,
        tag_names: form.tag_names.split(",").map((t) => t.trim()).filter(Boolean),
      });
    } catch (err) {
      setError(err.response?.data?.detail ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      <Input
        label="Title"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Give your prompt a clear, descriptive title"
        required
      />

      <Input
        label="Description"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Optional — what does this prompt do?"
      />

      {/* Prompt content */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#868da3]">
          Prompt Content
        </label>
        <textarea
          value={form.prompt_content}
          onChange={(e) => set("prompt_content", e.target.value)}
          placeholder="Write your prompt here..."
          required
          rows={8}
          className="w-full bg-[#f7f8fc] border border-[#e0e3ec] rounded-xl text-[#232735]
            placeholder:text-[#aeb4c6] px-4 py-3.5 text-sm outline-none resize-y
            focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12 focus:bg-white
            hover:border-[#c9cdda] transition-all duration-200 font-mono leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Group */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#868da3]">Group</label>
          <select
            value={form.group_id}
            onChange={(e) => set("group_id", e.target.value)}
            className="w-full bg-[#f7f8fc] border border-[#e0e3ec] rounded-xl text-sm text-[#232735]
              px-3.5 py-2.5 outline-none focus:border-[#6c63ff]/70 focus:ring-2 focus:ring-[#6c63ff]/12 focus:bg-white
              hover:border-[#c9cdda] transition-all duration-200 cursor-pointer"
          >
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <Input
          label="Tags (comma-separated)"
          value={form.tag_names}
          onChange={(e) => set("tag_names", e.target.value)}
          placeholder="python, writing, gpt-4"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2.5 text-sm text-red-500
          bg-red-500/6 border border-red-500/20 rounded-xl px-3.5 py-2.5">
          <span className="flex-shrink-0">⚠</span>
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : initial ? "Update Prompt" : "Create Prompt"}
        </Button>
      </div>
    </form>
  );
}

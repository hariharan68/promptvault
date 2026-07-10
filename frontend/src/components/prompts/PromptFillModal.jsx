import { useState, useMemo } from "react";
import { Copy, Check, ArrowRight } from "@phosphor-icons/react";
import Modal from "../common/Modal.jsx";
import Input from "../common/Input.jsx";

function extractVariables(content) {
  const matches = [...content.matchAll(/\{\{([^{}]+)\}\}/g)];
  const seen = new Set();
  const vars = [];
  for (const m of matches) {
    const name = m[1].trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      vars.push(name);
    }
  }
  return vars;
}

function buildPreview(content, values) {
  return content.replace(/\{\{([^{}]+)\}\}/g, (_, name) => {
    const key = name.trim();
    return values[key] || `{{${key}}}`;
  });
}

export default function PromptFillModal({ prompt, onClose, onCopy }) {
  const variables = useMemo(() => extractVariables(prompt.prompt_content), [prompt.prompt_content]);
  const [values, setValues] = useState(() => Object.fromEntries(variables.map((v) => [v, ""])));
  const [copied, setCopied] = useState(false);

  const preview = buildPreview(prompt.prompt_content, values);
  const allFilled = variables.every((v) => values[v]?.trim());

  function set(name, val) {
    setValues((prev) => ({ ...prev, [name]: val }));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      onCopy(prompt);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1200);
    } catch {
      onClose();
    }
  }

  return (
    <Modal title="Fill in variables" onClose={onClose} size="md">
      <div className="flex flex-col gap-5">

        {/* Variable inputs */}
        <div className="flex flex-col gap-3">
          {variables.map((v) => (
            <div key={v}>
              <Input
                label={v.replace(/_/g, " ")}
                value={values[v]}
                onChange={(e) => set(v, e.target.value)}
                placeholder={`Enter ${v.replace(/_/g, " ")}…`}
              />
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">Preview</p>
          <div className="relative bg-[#F3F4F6] dark:bg-[#2C2E3A] border border-[#E5E7EB] dark:border-[#363847] rounded-xl px-4 py-3.5 max-h-52 overflow-y-auto">
            <PreviewContent content={prompt.prompt_content} values={values} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-full font-medium text-[#374151] dark:text-[#9CA3AF]
              border border-[#E5E7EB] dark:border-[#363847]
              hover:bg-[#F3F4F6] dark:hover:bg-[#2C2E3A] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={!allFilled}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full font-medium transition-all
              ${copied
                ? "bg-emerald-500 text-white"
                : allFilled
                ? "bg-[#714B67] hover:bg-[#5A3A52] text-white shadow-[0_4px_14px_-4px_rgba(113,75,103,0.4)]"
                : "bg-[#F3F4F6] dark:bg-[#2C2E3A] text-[#ADB5BD] cursor-not-allowed"
              }`}
          >
            {copied
              ? <><Check size={13} weight="bold" /> Copied!</>
              : <><Copy size={13} /> Copy Filled Prompt <ArrowRight size={12} weight="bold" /></>
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PreviewContent({ content, values }) {
  const parts = content.split(/(\{\{[^{}]+\}\})/g);
  return (
    <pre className="text-xs text-[#374151] dark:text-[#9CA3AF] whitespace-pre-wrap break-words font-mono leading-relaxed">
      {parts.map((part, i) => {
        const match = part.match(/^\{\{([^{}]+)\}\}$/);
        if (!match) return part;
        const key = match[1].trim();
        const filled = values[key]?.trim();
        return filled
          ? <mark key={i} className="bg-[#714B67]/12 text-[#714B67] dark:text-[#C4A0BA] rounded px-0.5 not-italic">{filled}</mark>
          : <mark key={i} className="bg-[#F2A93E]/15 text-[#D4841A] rounded px-0.5 not-italic">{`{{${key}}}`}</mark>;
      })}
    </pre>
  );
}

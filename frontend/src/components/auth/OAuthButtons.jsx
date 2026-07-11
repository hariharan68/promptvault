import { GithubLogo, GoogleLogo } from "@phosphor-icons/react";
import { oauthStartUrl } from "../../api/authApi.js";

const providers = [
  { id: "google", label: "Continue with Google", Icon: GoogleLogo },
  { id: "github", label: "Continue with GitHub", Icon: GithubLogo },
];

export default function OAuthButtons() {
  function startOAuth(provider) {
    window.location.assign(oauthStartUrl(provider));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {providers.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => startOAuth(id)}
            className="h-10 rounded-full border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#374151]
              hover:bg-[#F9FAFB] hover:border-[#9CA3AF] transition-colors flex items-center justify-center gap-2"
            aria-label={label}
          >
            <Icon size={18} weight="bold" aria-hidden="true" />
            <span>{id === "google" ? "Google" : "GitHub"}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#E5E7EB]" />
        <span className="text-[11px] uppercase tracking-[0.12em] text-[#9CA3AF]">or use email</span>
        <span className="h-px flex-1 bg-[#E5E7EB]" />
      </div>
    </div>
  );
}

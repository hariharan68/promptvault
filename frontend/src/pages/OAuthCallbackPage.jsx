import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Warning } from "@phosphor-icons/react";
import { completeOAuthSession } from "../api/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const errorMessages = {
  authorization_cancelled: "Authorization was cancelled.",
  invalid_oauth_response: "The provider returned an incomplete login response.",
  invalid_oauth_state: "The login request expired or could not be verified. Please try again.",
  provider_not_configured: "This login provider is not configured yet.",
  provider_request_failed: "The provider could not verify your identity. Please try again.",
  token_exchange_failed: "The provider could not complete login. Please try again.",
  verified_email_required: "A verified email address is required to use social login.",
  account_inactive: "This PromptNest account is inactive.",
  account_link_failed: "Your social account could not be linked. Please contact support.",
};

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const providerError = searchParams.get("error");
  const [error, setError] = useState(
    providerError ? (errorMessages[providerError] || "Social login failed. Please try again.") : "",
  );

  useEffect(() => {
    if (providerError) return;
    let active = true;
    completeOAuthSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(data);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        if (active) setError("PromptNest could not start your session. Please try signing in again.");
      });
    return () => { active = false; };
  }, [navigate, providerError, setUser]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#714B67] text-white">
          <Lock size={18} weight="bold" />
        </div>
        {error ? (
          <>
            <Warning size={28} weight="fill" className="mx-auto mb-3 text-red-500" />
            <h1 className="font-serif text-xl text-[#111827]">Could not sign you in</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{error}</p>
            <Link to="/login" className="mt-6 inline-flex h-10 items-center rounded-full bg-[#714B67] px-5 text-sm font-medium text-white hover:bg-[#5A3A52]">
              Back to login
            </Link>
          </>
        ) : (
          <>
            <span className="mx-auto mb-4 block h-7 w-7 animate-spin rounded-full border-2 border-[#714B67]/25 border-t-[#714B67]" />
            <h1 className="font-serif text-xl text-[#111827]">Finishing sign in</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Securely creating your PromptNest session...</p>
          </>
        )}
      </div>
    </div>
  );
}

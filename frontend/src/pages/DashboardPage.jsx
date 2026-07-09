import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPrompts } from "../api/promptApi.js";
import { getGroups } from "../api/groupApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const statCards = [
  {
    icon: "◈",
    label: "Total Prompts",
    key: "total",
    to: "/prompts",
    gradient: "from-[#5b8def] to-[#7aa5f5]",
    shadow: "shadow-[0_14px_30px_-12px_rgba(91,141,239,0.6)]",
  },
  {
    icon: "★",
    label: "Favorites",
    key: "favorites",
    to: "/prompts?is_favorite=true",
    gradient: "from-[#f5a623] to-[#fbbf24]",
    shadow: "shadow-[0_14px_30px_-12px_rgba(245,166,35,0.55)]",
  },
  {
    icon: "⊞",
    label: "Groups",
    key: "groups",
    to: "/prompts",
    gradient: "from-[#2dc98a] to-[#4ade9f]",
    shadow: "shadow-[0_14px_30px_-12px_rgba(45,201,138,0.55)]",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, favorites: 0, groups: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPrompts(),
      getPrompts({ is_favorite: true }),
      getGroups(),
    ]).then(([all, favs, groups]) => {
      setStats({
        total: all.data.length,
        favorites: favs.data.length,
        groups: groups.data.length,
      });
      setRecent(all.data.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const isNew = !loading && stats.total === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">

      {/* Hero welcome */}
      <div>
        <p className="text-[#868da3] text-sm font-medium mb-1">{greeting}</p>
        <h1 className="text-3xl font-bold text-[#232735]">
          {user?.username ? `${user.username}'s Vault` : "Your Vault"}
        </h1>
        <p className="text-[#868da3] mt-1.5 text-sm">
          {isNew
            ? "Start by creating your first prompt."
            : `You have ${stats.total} prompt${stats.total !== 1 ? "s" : ""} saved.`}
        </p>
      </div>

      {/* Stats grid — colored gradient cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link key={card.key} to={card.to} className="group block">
            <div className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} ${card.shadow}
              rounded-2xl p-5 transition-all duration-300 cursor-pointer
              hover:-translate-y-0.5`}>
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl
                  bg-white/20 text-white text-base mb-4">
                  {card.icon}
                </div>
                <div className="text-3xl font-bold text-white mb-0.5">
                  {loading ? <span className="h-8 w-12 bg-white/25 rounded-lg block animate-pulse" /> : stats[card.key]}
                </div>
                <div className="text-xs text-white/85 font-medium">{card.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* New user CTA */}
      {isNew && (
        <div className="relative overflow-hidden bg-white border border-[#eaecf3] rounded-2xl p-6
          shadow-[0_1px_3px_rgba(30,34,52,0.04)]">
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#6c63ff]/8 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-bold text-[#232735] mb-1">Create your first prompt</p>
              <p className="text-sm text-[#868da3] leading-relaxed">
                Start building your personal AI prompt library.
                <br />
                Save, organize, and reuse your best prompts instantly.
              </p>
            </div>
            <button
              onClick={() => navigate("/prompts")}
              className="flex-shrink-0 bg-gradient-to-r from-[#6c63ff] to-[#8b83ff]
                hover:from-[#5a52e0] hover:to-[#7a71f5] text-white text-sm font-semibold
                px-5 py-2.5 rounded-xl transition-all duration-200
                shadow-[0_8px_20px_-6px_rgba(108,99,255,0.5)]
                hover:shadow-[0_10px_24px_-6px_rgba(108,99,255,0.6)]"
            >
              Get Started →
            </button>
          </div>
        </div>
      )}

      {/* Recent prompts */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-[#6c63ff] to-[#8b83ff] rounded-full" />
              <h2 className="font-bold text-[#232735] text-sm">Recent Prompts</h2>
            </div>
            <Link to="/prompts" className="text-xs text-[#868da3] hover:text-[#6c63ff] transition-colors font-medium">
              View all →
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {recent.map((p) => (
              <Link
                key={p.id}
                to="/prompts"
                className="group/row flex items-center justify-between bg-white border border-[#eaecf3]
                  rounded-xl px-4 py-3 hover:border-[#6c63ff]/30 hover:shadow-[0_6px_18px_-10px_rgba(108,99,255,0.3)]
                  transition-all duration-200 shadow-[0_1px_3px_rgba(30,34,52,0.04)]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`text-sm flex-shrink-0 transition-all ${
                    p.is_favorite ? "text-amber-400" : "text-[#d5d9e4]"
                  }`}>★</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#232735] truncate">
                      {p.title}
                    </p>
                    {p.description && (
                      <p className="text-xs text-[#868da3] truncate mt-0.5">{p.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {p.tags?.length > 0 && (
                    <div className="hidden sm:flex gap-1">
                      {p.tags.slice(0, 2).map((t) => (
                        <span key={t.id}
                          className="text-xs bg-[#6c63ff]/8 border border-[#6c63ff]/18
                            px-2 py-0.5 rounded-full text-[#6c63ff]">
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-[11px] text-[#aeb4c6] font-medium">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      {!isNew && (
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate("/prompts")}
            className="bg-gradient-to-r from-[#6c63ff] to-[#8b83ff] hover:from-[#5a52e0] hover:to-[#7a71f5]
              text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200
              shadow-[0_8px_20px_-6px_rgba(108,99,255,0.5)]"
          >
            Browse All Prompts
          </button>
          <Link
            to="/prompts?is_favorite=true"
            className="flex items-center gap-2 border border-[#e0e3ec] hover:border-[#6c63ff]/40
              text-[#5b6178] hover:text-[#6c63ff] text-sm font-medium
              px-5 py-2.5 rounded-xl transition-all duration-200 bg-white"
          >
            <span className="text-amber-400">★</span> View Favorites
          </Link>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Archive, Star, FolderSimple, ArrowRight } from "@phosphor-icons/react";
import { getPrompts } from "../api/promptApi.js";
import { getGroups } from "../api/groupApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const statCards = [
  {
    Icon: Archive,
    label: "Total Prompts",
    key: "total",
    to: "/prompts",
    gradient: "from-[#714B67] to-[#9B6E93]",
    shadow: "shadow-[0_14px_30px_-12px_rgba(113,75,103,0.5)]",
  },
  {
    Icon: Star,
    label: "Favorites",
    key: "favorites",
    to: "/prompts?is_favorite=true",
    gradient: "from-[#5A3A52] to-[#714B67]",
    shadow: "shadow-[0_14px_30px_-12px_rgba(90,58,82,0.5)]",
  },
  {
    Icon: FolderSimple,
    label: "Groups",
    key: "groups",
    to: "/groups",
    gradient: "from-[#4FA8E0] to-[#6EC2F5]",
    shadow: "shadow-[0_14px_30px_-12px_rgba(79,168,224,0.45)]",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, favorites: 0, groups: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPrompts(), getPrompts({ is_favorite: true }), getGroups()])
      .then(([all, favs, groups]) => {
        setStats({ total: all.data.length, favorites: favs.data.length, groups: groups.data.length });
        setRecent(all.data.slice(0, 5));
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const isNew = !loading && stats.total === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#714B67] dark:text-[#C4A0BA] mb-1.5">Your vault</p>
        <h1 className="font-serif text-3xl text-[#111827] dark:text-[#F1F2F6] leading-tight">
          {greeting}. {user?.username ? `Here's your vault, ${user.username}.` : "Here's what's stored."}
        </h1>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const { Icon } = card;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to={card.to} className="group block">
                <motion.div
                  className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} ${card.shadow}
                    rounded-xl p-5 cursor-pointer`}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 text-white mb-4">
                      <Icon size={18} weight="regular" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-0.5">
                      {loading
                        ? <span className="h-8 w-12 bg-white/25 rounded-lg block animate-pulse" />
                        : stats[card.key]}
                    </div>
                    <div className="text-xs text-white/85 font-medium">{card.label}</div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {isNew && (
        <div className="bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847] rounded-xl p-6">
          <p className="font-semibold text-[#111827] dark:text-[#F1F2F6] mb-1">Create your first prompt</p>
          <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
            Start building your personal AI prompt library.
          </p>
          <button
            onClick={() => navigate("/prompts")}
            className="inline-flex items-center gap-2 bg-[#714B67] hover:bg-[#5A3A52]
              text-white text-sm font-medium
              px-4 py-2 rounded-full transition-all duration-200"
          >
            Get Started <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Recent prompts */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#374151] dark:text-[#9CA3AF]">
              Recent Prompts
            </h2>
            <Link to="/prompts" className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#714B67] transition-colors font-medium">
              View all <ArrowRight size={11} />
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {recent.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05, ease: "easeOut" }}
              >
              <Link
                to="/prompts"
                className="flex items-center justify-between
                  bg-white dark:bg-[#252733] border border-[#E5E7EB] dark:border-[#363847]
                  rounded-xl px-4 py-3 hover:border-[#714B67] hover:shadow-[0_2px_8px_-2px_rgba(113,75,103,0.15)] transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Star
                    size={13}
                    weight={p.is_favorite ? "fill" : "regular"}
                    className={`flex-shrink-0 ${p.is_favorite ? "text-[#714B67]" : "text-[#D1D5DB] dark:text-[#363847]"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F1F2F6] truncate">{p.title}</p>
                    {p.description && (
                      <p className="text-xs text-[#6B7280] truncate mt-0.5">{p.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {p.tags?.length > 0 && (
                    <div className="hidden sm:flex gap-1">
                      {p.tags.slice(0, 2).map((t) => (
                        <span key={t.id}
                          className="text-xs bg-[#F3EEF3] dark:bg-[#3D2B3A] border border-[#E0D0DC] dark:border-[#5A3A54]
                            px-2 py-0.5 rounded-full text-[#714B67] dark:text-[#C4A0BA]">
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] font-medium">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!isNew && (
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate("/prompts")}
            className="inline-flex items-center gap-2 bg-[#714B67] hover:bg-[#5A3A52]
              text-white text-sm font-medium
              px-5 py-2.5 rounded-full transition-all duration-200"
          >
            Browse All Prompts
          </button>
          <Link
            to="/prompts?is_favorite=true"
            className="inline-flex items-center gap-2 border border-[#E5E7EB] dark:border-[#363847]
              hover:border-[#714B67] dark:hover:border-[#714B67]
              text-[#374151] dark:text-[#9CA3AF] hover:text-[#714B67] dark:hover:text-[#C4A0BA]
              text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-200
              bg-white dark:bg-[#252733]"
          >
            <Star size={13} weight="fill" className="text-[#714B67]" /> View Favorites
          </Link>
        </div>
      )}
    </div>
  );
}

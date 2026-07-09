import { useState } from "react";
import { Outlet } from "react-router-dom";
import GroupSidebar from "../components/groups/GroupSidebar.jsx";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f4f6fb] overflow-hidden">
      <GroupSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3
          bg-white border-b border-[#eaecf3]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-[#868da3] hover:text-[#232735] hover:bg-[#f4f6fb] transition-colors text-base"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#6c63ff] to-[#8b83ff] rounded-md flex items-center justify-center">
              <span className="text-white font-black text-xs">V</span>
            </div>
            <span className="font-bold text-[#232735] text-sm">PromptVault</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

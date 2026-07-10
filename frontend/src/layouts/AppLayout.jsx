import { useState } from "react";
import { Outlet } from "react-router-dom";
import GroupSidebar from "../components/groups/GroupSidebar.jsx";
import Navbar from "../components/common/Navbar.jsx";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FFFFFF] dark:bg-[#1A1B22] overflow-hidden">
      <GroupSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuOpen={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-5 md:p-7 bg-[#F3F4F6] dark:bg-[#1A1B22]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

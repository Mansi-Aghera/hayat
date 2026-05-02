// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile Menu Toggle (Only visible on mobile) */}
        <div className="md:hidden flex items-center p-4 bg-white border-b sticky top-0 z-40">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="ml-3 font-bold text-gray-800">Admin Panel</span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 px-4 pb-4 pt-0 sm:px-6 sm:pb-6 sm:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
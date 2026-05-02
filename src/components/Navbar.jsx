// src/components/Navbar.jsx
import { Menu } from "lucide-react";
import { getAuth } from "../services/auth.services";

export default function Navbar({ onMenuClick }) {
  const auth = getAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 truncate">
            Admin Panel
          </h2>
        </div>
      </div>
    </header>
  );
}
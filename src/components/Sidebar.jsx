// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  UserCheck,
  BedDouble,
  FlaskConical,
  Settings,
  User
} from "lucide-react";
import { clearAuth } from "../services/auth.services";

/* =========================
   ALL MENU DEFINITIONS
========================= */
const ALL_MENUS = [
  { name: "Dashboard", path: "/dashboard", icon: Home, roles: ["superadmin", "accountant", "subadmin"] },
  { name: "Home", path: "/home", icon: Users, roles: ["superadmin", "accountant", "subadmin"] },
    { name: "OPD", path: "/opd", icon: Users, roles: ["superadmin", "accountant", "subadmin"] },
  { name: "IPD", path: "/ipd", icon: Users, roles: ["superadmin", "accountant", "subadmin"] },
  { name: "Certificates", path: "/certificates", icon: Users, roles: ["superadmin"] },

  { name: "Doctors", path: "/doctor", icon: Users, roles: ["superadmin"] },

  { name: "Staff", path: "/staff", icon: UserCheck, roles: ["superadmin"] },
  { name: "Staff Transactions", path: "/staff-transactions", icon: Users, roles: ["superadmin"] },

  { name: "Beds", path: "/bed", icon: BedDouble, roles: ["superadmin"] },

  { name: "Services", path: "/service", icon: Users, roles: ["superadmin"] },
  { name: "Medicines", path: "/medicine", icon: Users, roles: ["superadmin"] },
  { name: "Reports", path: "/reports", icon: Users, roles: ["superadmin"] },

  { name: "Lab", path: "/lab", icon: FlaskConical, roles: ["superadmin", "subadmin", "lab"] },



  { name: "Settings", path: "/settings", icon: Settings, roles: ["superadmin", "accountant", "subadmin","lab"] },

];

export default function Sidebar({ open = false, onClose }) {
  const navigate = useNavigate();

  /* =========================
     GET USER ROLE
  ========================= */
  const role = localStorage.getItem("role") // lab | accountant | subadmin | superadmin

  /* =========================
     FILTER MENU BY ROLE
  ========================= */
  const menuItems = ALL_MENUS.filter(item =>
    item.roles.includes(role)
  );

  return (
    <>
      {/* Overlay (Mobile) */}
      <button
        type="button"
        className={`md:hidden fixed inset-0 bg-black/40 transition-opacity z-40 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Close menu"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`w-50 bg-indigo-800 text-white flex flex-col md:sticky md:top-0 md:h-screen md:translate-x-0 fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 print:hidden print-hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex flex-col items-center justify-center border-b border-indigo-700">
          <h1 className="text-lg font-bold capitalize">
            {role || "User"}
          </h1>
          <span className="text-xs text-indigo-300">Admin Panel</span>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                    isActive
                      ? "bg-indigo-900 shadow-lg"
                      : "hover:bg-indigo-700"
                  }`
                }
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={() => {
              clearAuth();
              navigate("/login", { replace: true });
              onClose?.();
            }}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

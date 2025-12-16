import { Link, useLocation } from "react-router-dom";
import { LogOut, Code } from "lucide-react";
import logo from "../../assets/logo.png";
import syriaLogo from "../../assets/syria_logo.svg";
import { checkPermission } from "../../utils/permissionHelper";
import { useState } from "react";
import Copyright from "../Copyright";

export default function DashboardSidebar({
  isOpen,
  onClose,
  onLogout,
  userInfo,
}) {
  const location = useLocation();
  const [showCopyright, setShowCopyright] = useState(false);

  const allMenuItems = [
    {
      label: " الموظفين",
      to: "/dashboard/employees",
      icon: "👥",
      permission: "employees.view",
    },

    {
      label: " الديوان",
      to: "/dashboard/dywan",
      icon: "📄",
      permission: "dywan.receive_files", // Check this permission key
    },
    {
      label: " DropDown Manager",
      to: "/dashboard/dropdown-manager",
      icon: "🔻",
      permission: "dropdowns.view",
    },
    {
      label: " الأرشيف",
      to: "/dashboard/archive",
      icon: "📦",
      permission: "documents.view",
    },
    {
      label: " الاشعارات",
      to: "/dashboard/notifications",
      icon: "🔔",
      // No permission needed, or basic user permission
    },
    {
      label: " الصفحة الرئيسية",
      to: "/dashboard/homepage-builder",
      icon: "🎨",
      permission: "homepage.edit_layout",
    },
    {
      label: " التقارير",
      to: "/dashboard/reports",
      icon: "📰",
      permission: "reports.view", // Assuming this key exists or similar
    },
    {
      label: " الشكاوى",
      to: "/dashboard/complaints",
      icon: "📢",
      permission: "complaints.view",
    },
    {
      label: " ادارة قاعدة البيانات",
      to: "/dashboard/upload",
      icon: "💾",
      permission: "employees.import", // Or similar admin permission
    },
    {
      label: " الاستعادة والنسخ الاحتياطي",
      to: "/dashboard/db-recovery",
      icon: "🛟",
      permission: "settings.backup",
    },
    {
      label: " الإعدادات",
      to: "/dashboard/settings",
      icon: "⚙️",
      permission: "settings.view",
    },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (!userInfo) return false;
    if (userInfo.role === "admin") return true;
    if (!item.permission) return true; // Always show if no permission required
    return checkPermission(item.permission, userInfo);
  });

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          left-0 top-0
          h-screen
          w-64
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md
          border-r border-white/10
          flex flex-col
          shadow-[0_0_40px_rgba(0,0,0,0.5)]
          z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:block"}
        `}
        dir="rtl"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gov-50 text-center flex flex-col items-center">
          <div className="flex items-center gap-2">
            <img
              src={syriaLogo}
              alt="Syria Logo"
              className="w-10 h-10 object-contain mr-1"
            />
          </div>
          <h1 className="text-lg font-semibold text-[#d4af37] drop-shadow-md">
            نظام إدارة الموارد البشرية
          </h1>
          <p className="text-xs text-[#d4af37]/70 mt-1">
            الأمانة العامة لمحافظة طرطوس
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.to}
              onClick={handleLinkClick}
              className={`
                block py-3 px-4 rounded-lg
                transition-all duration-200
                transform hover:translate-x-1 hover:scale-[1.02]
                font-medium text-sm
                ${isActive(item.to)
                  ? "bg-[#d4af37]/20 text-[#d4af37] shadow-md border-l-4 border-[#d4af37]"
                  : "text-gray-300 hover:bg-white/10 hover:text-[#d4af37]"
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </Link>
          ))}
        </nav>

        {/* Footer - Logout & Copyright */}
        <div className="border-t border-white/10 p-4 space-y-2">
          <button
            onClick={() => setShowCopyright(true)}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-[#d4af37] py-2 rounded-lg transition-all font-medium text-xs"
          >
            <Code className="w-3 h-3" />
            <span>حقوق التطوير</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white py-3 rounded-lg transition-all transform hover:scale-105 font-medium text-sm shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {showCopyright && <Copyright onClose={() => setShowCopyright(false)} />}
    </>
  );
}

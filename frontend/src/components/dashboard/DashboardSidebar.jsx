import { Link, useLocation } from "react-router-dom";
import { LogOut, Code } from "lucide-react";
import logo from "../../assets/logo.png";
import syriaLogo from "../../assets/syria_logo.svg";
import { checkPermission } from "../../utils/permissionHelper";
import { useState } from "react";
import Copyright from "../Copyright";

export default function DashboardSidebar({
  isOpen,
  isMinimized,
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
      permission: "dywan.view",
    },
    {
      label: " إدارة القوائم المنسدلة",
      to: "/dashboard/dropdown-manager",
      icon: "🔻",
      permission: "dropdowns.view",
    },
    {
      label: " الأرشيف",
      to: "/dashboard/archive",
      icon: "📦",
      permission: "archive.view",
    },
    {
      label: " الاشعارات",
      to: "/dashboard/notifications",
      icon: "🔔",
      // No permission needed, or basic user permission
    },
    {
      label: " الصلاحيات والمستخدمين",
      to: "/dashboard/homepage-builder",
      icon: "🔐",
      permission: "permissions.view",
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
      label: "  القانونية",
      to: "/dashboard/legal",
      icon: "⚖️",
      permission: "legal.view",
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
  console.log("menu items");
  console.log(menuItems);

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
          fixed
          right-0 top-0
          h-screen
          ${isMinimized ? "w-20" : "w-64"}
          bg-slate-900/95 backdrop-blur-md
          border-l border-slate-800
          flex flex-col
          shadow-[0_0_30px_rgba(0,0,0,0.55)]
          z-50
          transition-all duration-300 ease-in-out
          ${isOpen
            ? "translate-x-0"
            : "translate-x-full lg:translate-x-0"
          }
        `}
        dir="rtl"
      >
        {/* Header */}
        <div className={`p-4 border-b border-slate-800 bg-slate-900/90 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 ${isMinimized ? 'p-2' : 'p-6'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="flex items-center gap-2 mb-2">
            <img
              src={syriaLogo}
              alt="Syria Logo"
              className={`${isMinimized ? 'w-10 h-8' : 'w-16 h-10'} object-contain transition-all duration-300 drop-shadow-lg`}
            />
          </div>
          {!isMinimized && (
            <>
              <h1 className="text-lg font-semibold text-amber-400 drop-shadow-md whitespace-nowrap">
                نظام إدارة الموارد البشرية
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                الأمانة العامة لمحافظة طرطوس
              </p>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-2 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900 scrollbar-hide">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.to}
              onClick={handleLinkClick}
              title={isMinimized ? item.label : ""}
              className={`
                block py-3 px-4 rounded-lg
                transition-all duration-200
                transform hover:scale-[1.02]
                font-medium text-sm
                border border-transparent
                ${isActive(item.to)
                  ? "bg-amber-500/15 text-amber-300 shadow-lg shadow-amber-500/10 border-amber-500/40"
                  : "text-slate-200 hover:bg-slate-800 hover:text-amber-300 hover:border-slate-700"
                }
                ${isMinimized ? 'px-0 flex justify-center' : ''}
              `}
            >
              <span className={`flex items-center gap-2 ${isMinimized ? 'justify-center' : ''}`}>
                <span className="text-xl">{item.icon}</span>
                {!isMinimized && <span>{item.label}</span>}
              </span>
            </Link>
          ))}
        </nav>

        {/* Footer - Logout & Copyright */}
        <div className={`border-t border-slate-800 p-4 space-y-2 bg-slate-900/90 transition-all duration-300 ${isMinimized ? 'p-2' : 'p-4'}`}>
          <button
            onClick={() => setShowCopyright(true)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 py-2 rounded-lg transition-all font-medium text-xs border border-slate-700"
            title="حقوق التطوير"
          >
            <Code className="w-3 h-3" />
            {!isMinimized && <span>حقوق التطوير</span>}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white py-3 rounded-lg transition-all transform hover:scale-105 font-medium text-sm shadow-lg shadow-red-700/30"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
            {!isMinimized && <span>تسجيل الخروج</span>}
          </button>

          <div className="pt-2 text-center border-t border-slate-800/50 mt-2">
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
              النسخة 1.0.0
            </span>
          </div>
        </div>
      </aside>

      {showCopyright && <Copyright onClose={() => setShowCopyright(false)} />}
    </>
  );
}

import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function DashboardSidebar({ 
  isOpen, 
  onClose, 
  onLogout 
}) {
  const location = useLocation();

  const menuItems = [
    { 
      label: "📋 الموظفين", 
      to: "/dashboard/employees",
      icon: "👥"
    },
    { 
      label: "📤 ادارة قاعدة البيانات", 
      to: "/dashboard/upload",
      icon: "💾"
    },
    { 
      label: "📃 الديوان", 
      to: "/dashboard/dywan",
      icon: "📄"
    },
    { 
      label: "📃 القانونية", 
      to: "/dashboard/dywan",
      icon: "⚖️"
    },
    { 
      label: "📃 الشكاوى", 
      to: "/dashboard/dywan",
      icon: "📝"
    },
    { 
      label: "📃 DropDown Manager", 
      to: "/dashboard/dropdown-manager",
      icon: "⚙️"
    },
    { 
      label: "🖨️ الأرشيف", 
      to: "/dashboard",
      icon: "📦"
    },
    { 
      label: "🔔 الاشعارات", 
      to: "/dashboard/notifications",
      icon: "🔔"
    },
    { 
      label: "🎨 تخصيص الصفحة الرئيسية", 
      to: "/dashboard/homepage-builder",
      icon: "🎨"
    },
  ];

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
          bg-gradient-to-b from-gray-800 via-gray-800 to-gray-900
          border-r border-gray-700
          flex flex-col
          shadow-2xl
          z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:block'}
        `}
        dir="rtl"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-700 to-gray-800 text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">
            التنمية الإدارية
          </h1>
          <p className="text-sm text-gray-300 mt-1 font-medium">
            لوحة التحكم
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
                ${
                  isActive(item.to)
                    ? 'bg-gray-700 text-white shadow-lg border-l-4 border-teal-500'
                    : 'bg-gray-700/50 hover:bg-gray-600 text-gray-200 hover:text-white'
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

        {/* Footer - Logout */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white py-3 rounded-lg transition-all transform hover:scale-105 font-medium text-sm shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}


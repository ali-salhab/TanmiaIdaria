import { checkPermission } from "./permissionHelper.js";

export const homeSectionsConfig = [
  {
    category: "employees",
    requiredPermissions: ["employees.view"],
    label: "الموظفين",
    icon: "👥",
    color: "from-green-400 to-emerald-500",
    path: "/employees",
    description: "إدارة بيانات الموظفين والوثائق",
  },
  {
    category: "incidents",
    requiredPermissions: ["incidents.view"],
    label: "الوقوعات الوظيفية",
    icon: "⚠️",
    color: "from-red-400 to-rose-500",
    path: "/incidents",
    description: "ادارة الوقوعات  الوظيفية",
  },
  {
    category: "vacations",
    requiredPermissions: ["vacations.view"],
    label: "الإجازات",
    icon: "🏖️",
    color: "from-purple-400 to-pink-500",
    path: "/vacations",
    description: "إدارة طلبات الإجازات ",
  },
  {
    category: "users",
    requiredPermissions: ["users.view"],
    label: "المستخدمين",
    icon: "👤",
    color: "from-blue-400 to-sky-500",
    path: "/users",
    description: "إدارة حسابات المستخدمين والصلاحيات",
  },
  {
    category: "documents",
    requiredPermissions: ["documents.view"],
    label: "الوثائق",
    icon: "📄",
    color: "from-cyan-400 to-blue-500",
    path: "/documents",
    description: "إدارة الوثائق والملفات",
  },

  {
    category: "punishments",
    requiredPermissions: ["punishments.view"],
    label: "العقوبات الوظيفية ",
    icon: "⚖️",
    color: "from-gray-400 to-slate-500",
    path: "/punishments",
    description: "إدارة الجزاءات والعقوبات",
  },
  {
    category: "circulars",
    requiredPermissions: ["circulars.view"],
    label: "التعاميم من الادارة",
    icon: "📢",
    color: "from-amber-400 to-yellow-500",
    path: "/circulars",
    description: "تلقي  التعاميم الإدارية",
  },

  {
    category: "settings",
    requiredPermissions: ["settings.view"],
    label: "الإعدادات",
    icon: "⚙️",
    color: "from-slate-400 to-gray-500",
    path: "/dashboard/settings",
    description: "إدارة إعدادات النظام والتخصيص",
  },
];

export const getAvailableSections = (user) => {
  if (!user) return [];

  if (user.role === "admin") {
    return homeSectionsConfig;
  }

  return homeSectionsConfig.filter((section) => {
    // Sections with no required permissions are available to all users
    if (
      !section.requiredPermissions ||
      section.requiredPermissions.length === 0
    ) {
      return true;
    }

    // Check if user has any of the required permissions for this section
    return section.requiredPermissions.some((permission) =>
      checkPermission(permission, user)
    );
  });
};

export const getSectionPermissionStats = (user) => {
  if (!user) return null;

  const total = homeSectionsConfig.length;
  const available = getAvailableSections(user).length;

  return {
    total,
    available,
    percentage: Math.round((available / total) * 100),
  };
};

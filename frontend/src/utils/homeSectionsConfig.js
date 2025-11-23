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
    label: "الحوادث",
    icon: "⚠️",
    color: "from-red-400 to-rose-500",
    path: "/incidents",
    description: "تسجيل ومتابعة الحوادث",
  },
  {
    category: "vacations",
    requiredPermissions: ["vacations.view"],
    label: "الإجازات",
    icon: "🏖️",
    color: "from-purple-400 to-pink-500",
    path: "/vacations",
    description: "إدارة طلبات الإجازات والرخص",
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
    category: "fileshare",
    requiredPermissions: ["fileshare.view_inbox", "fileshare.send"],
    label: "مشاركة الملفات",
    icon: "📤",
    color: "from-indigo-400 to-purple-500",
    path: "/fileshare",
    description: "إرسال واستقبال الملفات",
  },
  {
    category: "salary",
    requiredPermissions: ["salary.view"],
    label: "الرواتب",
    icon: "💰",
    color: "from-yellow-400 to-orange-500",
    path: "/salary",
    description: "عرض ومتابعة الرواتب",
  },
  {
    category: "rewards",
    requiredPermissions: ["rewards.view"],
    label: "الحوافز",
    icon: "🎁",
    color: "from-pink-400 to-rose-500",
    path: "/rewards",
    description: "إدارة الحوافز والمكافآت",
  },
  {
    category: "punishments",
    requiredPermissions: ["punishments.view"],
    label: "الجزاءات",
    icon: "⚖️",
    color: "from-gray-400 to-slate-500",
    path: "/punishments",
    description: "إدارة الجزاءات والعقوبات",
  },
  {
    category: "circulars",
    requiredPermissions: ["circulars.view"],
    label: "التعاميم",
    icon: "📢",
    color: "from-amber-400 to-yellow-500",
    path: "/circulars",
    description: "نشر وإدارة التعاميم الإدارية",
  },
  {
    category: "permissions",
    requiredPermissions: ["permissions.view"],
    label: "إدارة الصلاحيات",
    icon: "🔐",
    color: "from-teal-400 to-cyan-500",
    path: "/permissions",
    description: "إدارة الصلاحيات ومجموعات الصلاحيات",
  },
  {
    category: "permission_groups",
    requiredPermissions: ["permission_groups.view"],
    label: "مجموعات الصلاحيات",
    icon: "👥",
    color: "from-violet-400 to-purple-500",
    path: "/permission-groups",
    description: "إدارة مجموعات الصلاحيات",
  },
  {
    category: "settings",
    requiredPermissions: ["settings.view"],
    label: "الإعدادات",
    icon: "⚙️",
    color: "from-slate-400 to-gray-500",
    path: "/settings",
    description: "إعدادات النظام والتكوين",
  },
  {
    category: "analytics",
    requiredPermissions: ["analytics.view"],
    label: "التحليلات",
    icon: "📊",
    color: "from-blue-500 to-indigo-600",
    path: "/analytics",
    description: "عرض تحليلات وإحصائيات النظام",
  },
  {
    category: "reports",
    requiredPermissions: ["reports.view"],
    label: "التقارير",
    icon: "📋",
    color: "from-emerald-500 to-teal-600",
    path: "/reports",
    description: "عرض وتصدير التقارير",
  },
  {
    category: "logs",
    requiredPermissions: ["logs.view"],
    label: "السجلات",
    icon: "📝",
    color: "from-orange-400 to-red-500",
    path: "/logs",
    description: "عرض سجلات العمليات والأنشطة",
  },
];

export const getAvailableSections = (user) => {
  if (!user) return [];
  console.log(user.permissions);

  if (user.role === "admin") {
    return homeSectionsConfig;
  }

  return homeSectionsConfig.filter((section) => {
    if (!user.permissions) return false;

    // Check if user has any of the required permissions for this section
    return section.requiredPermissions.some(permission =>
      user.permissions[permission] === true
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

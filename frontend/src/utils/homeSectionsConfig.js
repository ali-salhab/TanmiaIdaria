export const homeSectionsConfig = [
  {
    category: "employees",
    requiredPermissions: ["employees.view", "employees.edit", "employees.create", "employees.delete"],
    label: "الموظفين",
    icon: "👥",
    color: "from-green-400 to-emerald-500",
    path: "/employees",
    description: "إدارة بيانات الموظفين والوثائق",
  },
  {
    category: "incidents",
    requiredPermissions: ["incidents.view", "incidents.edit", "incidents.create", "incidents.delete"],
    label: "الحوادث",
    icon: "⚠️",
    color: "from-red-400 to-rose-500",
    path: "/incidents",
    description: "تسجيل ومتابعة الحوادث",
  },
  {
    category: "vacations",
    requiredPermissions: ["vacations.view", "vacations.edit", "vacations.create", "vacations.delete", "vacations.approve"],
    label: "الإجازات",
    icon: "🏖️",
    color: "from-purple-400 to-pink-500",
    path: "/vacations",
    description: "إدارة طلبات الإجازات والرخص",
  },
  {
    category: "users",
    requiredPermissions: ["users.view", "users.edit", "users.create", "users.delete"],
    label: "المستخدمين",
    icon: "👤",
    color: "from-blue-400 to-sky-500",
    path: "/users",
    description: "إدارة حسابات المستخدمين والصلاحيات",
  },
  {
    category: "documents",
    requiredPermissions: ["documents.view", "documents.edit", "documents.upload", "documents.delete"],
    label: "الوثائق",
    icon: "📄",
    color: "from-cyan-400 to-blue-500",
    path: "/documents",
    description: "إدارة الوثائق والملفات",
  },
  {
    category: "salary",
    requiredPermissions: ["salary.view", "salary.edit"],
    label: "الرواتب",
    icon: "💰",
    color: "from-yellow-400 to-orange-500",
    path: "/salary",
    description: "عرض ومتابعة الرواتب",
  },
  {
    category: "rewards",
    requiredPermissions: ["rewards.view", "rewards.edit", "rewards.create"],
    label: "الحوافز",
    icon: "🎁",
    color: "from-pink-400 to-rose-500",
    path: "/rewards",
    description: "إدارة الحوافز والمكافآت",
  },
  {
    category: "punishments",
    requiredPermissions: ["punishments.view", "punishments.edit", "punishments.create"],
    label: "الجزاءات",
    icon: "⚖️",
    color: "from-gray-400 to-slate-500",
    path: "/punishments",
    description: "إدارة الجزاءات والعقوبات",
  },
  {
    category: "circulars",
    requiredPermissions: ["circulars.view", "circulars.edit", "circulars.create", "circulars.publish"],
    label: "التعاميم",
    icon: "📢",
    color: "from-amber-400 to-yellow-500",
    path: "/circulars",
    description: "نشر وإدارة التعاميم الإدارية",
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

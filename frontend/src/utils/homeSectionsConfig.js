export const homeSectionsConfig = [
  {
    category: "employees",
    requiredPermission: "employees.view",
    label: "الموظفين",
    icon: "👥",
    color: "from-green-400 to-emerald-500",
    path: "/employees",
    description: "إدارة بيانات الموظفين والوثائق",
  },
  {
    category: "incidents",
    requiredPermission: "incidents.view",
    label: "الحوادث",
    icon: "⚠️",
    color: "from-red-400 to-rose-500",
    path: "/incidents",
    description: "تسجيل ومتابعة الحوادث",
  },
  {
    category: "vacations",
    requiredPermission: "vacations.view",
    label: "الإجازات",
    icon: "🏖️",
    color: "from-purple-400 to-pink-500",
    path: "/vacations",
    description: "إدارة طلبات الإجازات والرخص",
  },
  {
    category: "users",
    requiredPermission: "users.view",
    label: "المستخدمين",
    icon: "👤",
    color: "from-blue-400 to-sky-500",
    path: "/users",
    description: "إدارة حسابات المستخدمين والصلاحيات",
  },
  {
    category: "documents",
    requiredPermission: "documents.view",
    label: "الوثائق",
    icon: "📄",
    color: "from-cyan-400 to-blue-500",
    path: "/documents",
    description: "إدارة الوثائق والملفات",
  },
  {
    category: "salary",
    requiredPermission: "salary.view",
    label: "الرواتب",
    icon: "💰",
    color: "from-yellow-400 to-orange-500",
    path: "/salary",
    description: "عرض ومتابعة الرواتب",
  },
  {
    category: "rewards",
    requiredPermission: "rewards.view",
    label: "الحوافز",
    icon: "🎁",
    color: "from-pink-400 to-rose-500",
    path: "/rewards",
    description: "إدارة الحوافز والمكافآت",
  },
  {
    category: "punishments",
    requiredPermission: "punishments.view",
    label: "الجزاءات",
    icon: "⚖️",
    color: "from-gray-400 to-slate-500",
    path: "/punishments",
    description: "إدارة الجزاءات والعقوبات",
  },
  {
    category: "circulars",
    requiredPermission: "circulars.view",
    label: "التعاميم",
    icon: "📢",
    color: "from-amber-400 to-yellow-500",
    path: "/circulars",
    description: "نشر وإدارة التعاميم الإدارية",
  },
];

export const getAvailableSections = (user) => {
  if (!user) return [];
  
  if (user.role === "admin") {
    return homeSectionsConfig;
  }
  
  return homeSectionsConfig.filter((section) => {
    if (!user.permissions) return false;
    
    return user.permissions[section.requiredPermission] === true;
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

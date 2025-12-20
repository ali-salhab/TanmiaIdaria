import Permission from "../models/Permission.js";
import PermissionGroup from "../models/PermissionGroup.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { io } from "../server.js";

const ALL_SYSTEM_PERMISSIONS = [
  // الموظفين
  {
    key: "employees.view",
    label: "عرض الموظفين",
    category: "الموظفين",
    description: "القدرة على عرض قائمة الموظفين وتفاصيلهم",
  },
  {
    key: "employees.create",
    label: "إضافة موظف جديد",
    category: "الموظفين",
    description: "القدرة على إضافة موظفين جدد للنظام",
  },
  {
    key: "employees.edit",
    label: "تعديل بيانات موظف",
    category: "الموظفين",
    description: "القدرة على تعديل بيانات الموظفين الحاليين",
  },
  {
    key: "employees.delete",
    label: "حذف موظف",
    category: "الموظفين",
    description: "القدرة على حذف سجلات الموظفين",
  },
  {
    key: "employees.export",
    label: "تصدير بيانات الموظفين",
    category: "الموظفين",
    description: "القدرة على تصدير بيانات الموظفين إلى ملفات",
  },
  {
    key: "employees.import",
    label: "استيراد بيانات الموظفين",
    category: "الموظفين",
    description: "القدرة على استيراد بيانات الموظفين من ملفات",
  },
  {
    key: "employees.update_photo",
    label: "تحديث صورة الموظف",
    category: "الموظفين",
    description: "القدرة على تغيير صور الموظفين",
  },
  {
    key: "employees.view_personal_card",
    label: "عرض البطاقة الشخصية",
    category: "الموظفين",
    description: "القدرة على عرض البطاقة الشخصية للموظف",
  },

  // المستخدمين
  {
    key: "users.view",
    label: "عرض المستخدمين",
    category: "المستخدمين",
    description: "القدرة على عرض قائمة مستخدمي النظام",
  },
  {
    key: "users.create",
    label: "إنشاء مستخدم جديد",
    category: "المستخدمين",
    description: "القدرة على إنشاء حسابات مستخدمين جديدة",
  },
  {
    key: "users.edit",
    label: "تعديل مستخدم",
    category: "المستخدمين",
    description: "القدرة على تعديل بيانات حسابات المستخدمين",
  },
  {
    key: "users.delete",
    label: "حذف مستخدم",
    category: "المستخدمين",
    description: "القدرة على حذف حسابات المستخدمين",
  },
  {
    key: "users.manage_permissions",
    label: "إدارة صلاحيات المستخدمين",
    category: "المستخدمين",
    description: "القدرة على إدارة صلاحيات ومجموعات المستخدمين",
  },

  // الصلاحيات والمجموعات
  {
    key: "permissions.view",
    label: "عرض الصلاحيات",
    category: "الصلاحيات",
    description: "القدرة على عرض الصلاحيات والمجموعات",
  },
  {
    key: "permissions.create",
    label: "إنشاء صلاحيات",
    category: "الصلاحيات",
    description: "القدرة على إنشاء صلاحيات جديدة",
  },
  {
    key: "permissions.manage_groups",
    label: "إدارة المجموعات",
    category: "الصلاحيات",
    description: "القدرة على إنشاء وتعديل مجموعات الصلاحيات",
  },
  {
    key: "permissions.delete",
    label: "حذف الصلاحيات",
    category: "الصلاحيات",
    description: "القدرة على حذف الصلاحيات أو المجموعات",
  },
  {
    key: "permissions.assign",
    label: "تعيين الصلاحيات",
    category: "الصلاحيات",
    description: "القدرة على تعيين صلاحيات مباشرة للمستخدمين",
  },

  // الإجازات
  {
    key: "vacations.view",
    label: "عرض الإجازات",
    category: "الإجازات",
    description: "القدرة على عرض طلبات الإجازات",
  },
  {
    key: "vacations.create",
    label: "طلب إجازة",
    category: "الإجازات",
    description: "القدرة على تقديم طلبات إجازة جديدة",
  },
  {
    key: "vacations.edit",
    label: "تعديل طلب إجازة",
    category: "الإجازات",
    description: "القدرة على تعديل طلبات الإجازة",
  },
  {
    key: "vacations.delete",
    label: "حذف طلب إجازة",
    category: "الإجازات",
    description: "القدرة على حذف طلبات الإجازة",
  },
  {
    key: "vacations.generate_template",
    label: "إنشاء نموذج إجازة",
    category: "الإجازات",
    description: "القدرة على توليد نماذج الإجازات المطبوعة",
  },

  // الشكاوى
  {
    key: "complaints.view",
    label: "عرض الشكاوى",
    category: "الشكاوى",
    description: "القدرة على عرض قائمة الشكاوى",
  },
  {
    key: "complaints.create",
    label: "تقديم شكوى",
    category: "الشكاوى",
    description: "القدرة على تقديم شكاوى جديدة",
  },
  {
    key: "complaints.edit",
    label: "تعديل شكوى",
    category: "الشكاوى",
    description: "القدرة على تعديل بيانات الشكاوى",
  },
  {
    key: "complaints.delete",
    label: "حذف شكوى",
    category: "الشكاوى",
    description: "القدرة على حذف الشكاوى من النظام",
  },

  // الوقوعات
  {
    key: "incidents.view",
    label: "عرض الوقوعات",
    category: "الوقوعات",
    description: "القدرة على عرض سجل الوقوعات الوظيفية",
  },
  {
    key: "incidents.create",
    label: "تسجيل وقوعة",
    category: "الوقوعات",
    description: "القدرة على تسجيل وقوعات وظيفية جديدة",
  },
  {
    key: "incidents.edit",
    label: "تعديل وقوعة",
    category: "الوقوعات",
    description: "القدرة على تعديل بيانات الوقوعات",
  },
  {
    key: "incidents.delete",
    label: "حذف وقوعة",
    category: "الوقوعات",
    description: "القدرة على حذف سجلات الوقوعات",
  },
  {
    key: "incidents.generate_cv",
    label: "إنشاء سيرة ذاتية للوقوعات",
    category: "الوقوعات",
    description: "القدرة على توليد تقرير السيرة الذاتية للوقوعات",
  },

  // المكافآت
  {
    key: "rewards.view",
    label: "عرض المكافآت",
    category: "المكافآت",
    description: "القدرة على عرض سجل المكافآت",
  },
  {
    key: "rewards.create",
    label: "منح مكافأة",
    category: "المكافآت",
    description: "القدرة على إضافة مكافآت جديدة للموظفين",
  },
  {
    key: "rewards.delete",
    label: "حذف مكافأة",
    category: "المكافآت",
    description: "القدرة على حذف سجلات المكافآت",
  },

  // العقوبات
  {
    key: "penalties.view",
    label: "عرض العقوبات",
    category: "العقوبات",
    description: "القدرة على عرض سجل العقوبات",
  },
  {
    key: "penalties.create",
    label: "تسجيل عقوبة",
    category: "العقوبات",
    description: "القدرة على إضافة عقوبات جديدة للموظفين",
  },
  {
    key: "penalties.edit",
    label: "تعديل عقوبة",
    category: "العقوبات",
    description: "القدرة على تعديل بيانات العقوبات",
  },
  {
    key: "penalties.delete",
    label: "حذف عقوبة",
    category: "العقوبات",
    description: "القدرة على حذف سجلات العقوبات",
  },

  // التقارير
  {
    key: "reports.view",
    label: "عرض التقارير",
    category: "التقارير",
    description: "القدرة على عرض التقارير والإحصائيات",
  },
  {
    key: "reports.export",
    label: "تصدير التقارير",
    category: "التقارير",
    description: "القدرة على تصدير التقارير إلى ملفات خارجية",
  },
  {
    key: "reports.archive",
    label: "أرشفة التقارير",
    category: "التقارير",
    description: "القدرة على أرشفة التقارير القديمة",
  },
  {
    key: "reports.view_archived",
    label: "عرض التقارير المؤرشفة",
    category: "التقارير",
    description: "القدرة على عرض الأرشيف الخاص بالتقارير",
  },
  {
    key: "reports.delete",
    label: "حذف التقارير",
    category: "التقارير",
    description: "القدرة على حذف التقارير من النظام",
  },

  // الديوان والوثائق
  {
    key: "dywan.view",
    label: "عرض سجلات الديوان",
    category: "الديوان",
    description: "القدرة على عرض الوثائق في قسم الديوان",
  },
  {
    key: "dywan.create",
    label: "إضافة سجل للديوان",
    category: "الديوان",
    description: "القدرة على إضافة وثائق جديدة للديوان",
  },
  {
    key: "dywan.delete",
    label: "حذف سجل من الديوان",
    category: "الديوان",
    description: "القدرة على حذف وثائق من الديوان",
  },
  {
    key: "dywan.export",
    label: "تصدير سجلات الديوان",
    category: "الديوان",
    description: "القدرة على تصدير بيانات الديوان",
  },

  // التعاميم
  {
    key: "circulars.view",
    label: "عرض التعاميم",
    category: "التعاميم",
    description: "القدرة على عرض التعاميم الإدارية",
  },
  {
    key: "circulars.create",
    label: "إنشاء تعميم",
    category: "التعاميم",
    description: "القدرة على إنشاء تعاميم جديدة",
  },
  {
    key: "circulars.edit",
    label: "تعديل تعميم",
    category: "التعاميم",
    description: "القدرة على تعديل التعاميم الحالية",
  },
  {
    key: "circulars.delete",
    label: "حذف تعميم",
    category: "التعاميم",
    description: "القدرة على حذف التعاميم من النظام",
  },

  // الشؤون القانونية
  {
    key: "legal.access",
    label: "الوصول للشؤون القانونية",
    category: "القانونية",
    description: "القدرة على الوصول لقسم الشؤون القانونية",
  },
  {
    key: "legal.view_cases",
    label: "عرض القضايا القانونية",
    category: "القانونية",
    description: "القدرة على عرض تفاصيل القضايا القانونية",
  },
  {
    key: "legal.manage_cases",
    label: "إدارة القضايا القانونية",
    category: "القانونية",
    description: "القدرة على إدارة وتعديل القضايا القانونية",
  },
  {
    key: "legal.send_files",
    label: "إرسال ملفات قانونية",
    category: "القانونية",
    description: "القدرة على إرسال ملفات متعلقة بالقضايا",
  },
  {
    key: "legal.reply_text",
    label: "الرد النصي على القضايا",
    category: "القانونية",
    description: "القدرة على إضافة ردود نصية على القضايا",
  },
  {
    key: "legal.reply_files",
    label: "الرد بملفات على القضايا",
    category: "القانونية",
    description: "القدرة على إضافة مرفقات في الردود القانونية",
  },

  // مشاركة الملفات
  {
    key: "file_sharing.upload",
    label: "رفع ملفات للمشاركة",
    category: "مشاركة الملفات",
    description: "القدرة على رفع ملفات لمشاركتها مع الآخرين",
  },
  {
    key: "file_sharing.view_received",
    label: "عرض الملفات المستلمة",
    category: "مشاركة الملفات",
    description: "القدرة على عرض الملفات التي تم استلامها",
  },
  {
    key: "file_sharing.view_sent",
    label: "عرض الملفات المرسلة",
    category: "مشاركة الملفات",
    description: "القدرة على عرض الملفات التي تم إرسالها",
  },

  // الدردشة
  {
    key: "chat.access",
    label: "الوصول للدردشة",
    category: "الدردشة",
    description: "القدرة على استخدام نظام الدردشة",
  },
  {
    key: "chat.send",
    label: "إرسال رسائل",
    category: "الدردشة",
    description: "القدرة على إرسال رسائل في الدردشة",
  },
  {
    key: "chat.view_history",
    label: "عرض سجل الدردشة",
    category: "الدردشة",
    description: "القدرة على عرض الرسائل السابقة",
  },

  // إعدادات النظام
  {
    key: "settings.view",
    label: "عرض الإعدادات",
    category: "الإعدادات",
    description: "القدرة على عرض إعدادات النظام",
  },
  {
    key: "settings.edit_general",
    label: "تعديل الإعدادات العامة",
    category: "الإعدادات",
    description: "القدرة على تعديل الإعدادات العامة للنظام",
  },
  {
    key: "settings.manage_dropdowns",
    label: "إدارة القوائم المنسدلة",
    category: "الإعدادات",
    description: "القدرة على إدارة خيارات القوائم المنسدلة",
  },

  // الدورات
  {
    key: "courses.view",
    label: "عرض الدورات",
    category: "الدورات",
    description: "القدرة على عرض الدورات التدريبية",
  },
  {
    key: "courses.create",
    label: "إضافة دورة",
    category: "الدورات",
    description: "القدرة على إضافة دورات تدريبية جديدة",
  },
  {
    key: "courses.delete",
    label: "حذف دورة",
    category: "الدورات",
    description: "القدرة على حذف الدورات التدريبية",
  },

  // التحليلات
  {
    key: "analytics.view",
    label: "عرض التحليلات",
    category: "التحليلات",
    description: "القدرة على عرض لوحات التحليلات والإحصائيات",
  },
  {
    key: "analytics.export",
    label: "تصدير التحليلات",
    category: "التحليلات",
    description: "القدرة على تصدير بيانات التحليلات",
  },

  // الأرشيف
  {
    key: "archive.view",
    label: "عرض الأرشيف",
    category: "الأرشيف",
    description: "القدرة على عرض الملفات المؤرشفة",
  },
  {
    key: "archive.create",
    label: "إضافة للأرشيف",
    category: "الأرشيف",
    description: "القدرة على إضافة ملفات جديدة للأرشيف",
  },
  {
    key: "archive.edit",
    label: "تعديل في الأرشيف",
    category: "الأرشيف",
    description: "القدرة على تعديل بيانات الملفات المؤرشفة",
  },
  {
    key: "archive.delete",
    label: "حذف من الأرشيف",
    category: "الأرشيف",
    description: "القدرة على حذف ملفات من الأرشيف",
  },

  // القرارات
  {
    key: "decisions.view",
    label: "عرض القرارات",
    category: "القرارات",
    description: "القدرة على عرض القرارات الإدارية",
  },
  {
    key: "decisions.create",
    label: "إضافة قرار",
    category: "القرارات",
    description: "القدرة على إضافة قرارات جديدة",
  },
  {
    key: "decisions.edit",
    label: "تعديل قرار",
    category: "القرارات",
    description: "القدرة على تعديل القرارات الحالية",
  },
  {
    key: "decisions.delete",
    label: "حذف قرار",
    category: "القرارات",
    description: "القدرة على حذف القرارات من النظام",
  },
];

export const rebuildPermissions = async (req, res) => {
  try {
    console.log("🔄 Rebuilding permissions...");
    let createdCount = 0;
    let updatedCount = 0;

    for (const perm of ALL_SYSTEM_PERMISSIONS) {
      const existing = await Permission.findOne({ key: perm.key });
      if (existing) {
        existing.label = perm.label;
        existing.category = perm.category;
        existing.description = perm.description;
        await existing.save();
        updatedCount++;
      } else {
        await Permission.create(perm);
        createdCount++;
      }
    }

    res.json({
      message: "تم إعادة بناء الصلاحيات بنجاح باللغة العربية",
      details: { created: createdCount, updated: updatedCount },
    });
  } catch (error) {
    console.error("Error rebuilding permissions:", error);
    res.status(500).json({ message: error.message });
  }
};

export const giveAllPermissionsToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const allPermissions = await Permission.find();
    const permissionIds = allPermissions.map((p) => p._id);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.directPermissions = permissionIds;
    await user.save();

    // Send notification
    const notification = new Notification({
      userId: user._id,
      actionBy: req.user._id,
      actionByUsername: req.user.username,
      type: "permission_granted",
      title: "تحديث الصلاحيات",
      message: "تم منحك جميع صلاحيات النظام",
      section: "users",
      action: "update",
    });
    await notification.save();

    io.emit("notification", {
      userId: user._id,
      message: "تم منحك جميع صلاحيات النظام",
      type: "permission_change",
    });

    res.json({ message: "تم منح جميع الصلاحيات للمستخدم بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeAllPermissionsFromUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.directPermissions = [];
    user.permissionGroups = [];
    await user.save();

    // Send notification
    const notification = new Notification({
      userId: user._id,
      actionBy: req.user._id,
      actionByUsername: req.user.username,
      type: "permission_denied",
      title: "تحديث الصلاحيات",
      message: "تم سحب جميع صلاحياتك من النظام",
      section: "users",
      action: "update",
    });
    await notification.save();

    io.emit("notification", {
      userId: user._id,
      message: "تم سحب جميع صلاحياتك من النظام",
      type: "permission_change",
    });

    res.json({ message: "تم سحب جميع الصلاحيات من المستخدم بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, label: 1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPermission = async (req, res) => {
  try {
    const { key, label, description, category } = req.body;

    const existing = await Permission.findOne({ key });
    if (existing) {
      return res.status(400).json({ message: "Permission key already exists" });
    }

    const permission = new Permission({
      key,
      label,
      description,
      category,
    });

    await permission.save();
    res.status(201).json(permission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const groups = await PermissionGroup.find()
      .populate("permissions")
      .populate("members", "-password")
      .populate("createdBy", "-password");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const existing = await PermissionGroup.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Group name already exists" });
    }

    const group = new PermissionGroup({
      name,
      description,
      permissions: permissions || [],
      createdBy: req.user._id,
    });

    await group.save();
    await group.populate("permissions");
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const group = await PermissionGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (permissions) group.permissions = permissions;

    await group.save();
    await group.populate("permissions");
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    await PermissionGroup.findByIdAndDelete(id);
    await User.updateMany({}, { $pull: { permissionGroups: id } });

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addUserToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await PermissionGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    if (!user.permissionGroups.includes(groupId)) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { permissionGroups: groupId },
      });
    }

    await group.populate([
      { path: "permissions" },
      { path: "members", select: "-password" },
    ]);
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeUserFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
      return res.status(400).json({ message: "groupId and userId required" });
    }

    const group = await PermissionGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    group.members = group.members.filter(
      (id) => id.toString() !== userId.toString()
    );
    await group.save();

    await User.findByIdAndUpdate(userId, {
      $pull: { permissionGroups: groupId },
    });

    await group.populate([
      { path: "permissions" },
      { path: "members", select: "-password" },
    ]);

    res.json({ message: "User removed from group", group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("permissionGroups", "permissions")
      .populate("directPermissions");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allPermissions = {
      ...user.permissions,
    };

    const allPermissionIds = new Set();
    user.permissionGroups.forEach((group) => {
      group.permissions.forEach((perm) => {
        allPermissionIds.add(perm._id.toString());
      });
    });

    user.directPermissions.forEach((perm) => {
      allPermissionIds.add(perm._id.toString());
    });

    res.json({
      user,
      allPermissions,
      permissionIds: Array.from(allPermissionIds),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { directPermissions } = req.body;

    console.log("updateUserPermissions request:", { userId, body: req.body });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!Array.isArray(directPermissions)) {
      console.error("directPermissions is not an array:", directPermissions);
      return res.status(400).json({
        message: "directPermissions must be an array of permission IDs",
      });
    }

    await User.findByIdAndUpdate(userId, { directPermissions });

    // Re-fetch user to return populated data
    const updatedUser = await User.findById(userId)
      .populate("directPermissions")
      .populate({
        path: "permissionGroups",
        populate: { path: "permissions" },
      });

    // Emit permission update notification
    const permissionUpdateEvent = {
      userId,
      username: updatedUser.username,
      type: "direct_permissions_updated",
      timestamp: new Date(),
    };

    io.emit("permission_update", permissionUpdateEvent);

    const notificationEvent = {
      type: "permission_change",
      message: `تم تحديث صلاحياتك المباشرة`,
      userId,
      time: new Date(),
    };

    io.emit("notification", notificationEvent);

    // Send personal notification to the user
    const userSocketId = req.onlineUsers?.get(userId);
    if (userSocketId) {
      io.to(userSocketId).emit("personal_notification", notificationEvent);
    }

    res.json({
      message: "User direct permissions updated",
      permissions: updatedUser.permissions,
    });
  } catch (error) {
    console.error("updateUserPermissions error:", error);
    res.status(400).json({ message: error.message });
  }
};

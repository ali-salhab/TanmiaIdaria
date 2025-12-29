import User from "../models/User.js";
import PermissionGroup from "../models/PermissionGroup.js";

/**
 * Modern Permission Middleware
 * Checks if user has the required permission through direct permissions or groups
 * Admins automatically have all permissions
 */

const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          message: "غير مصرح: يجب تسجيل الدخول أولاً",
          error: "UNAUTHORIZED",
        });
      }

      const user = await User.findById(req.user._id)
        .populate({
          path: "permissionGroups",
          populate: {
            path: "permissions",
            select: "key label category",
          },
        })
        .populate("directPermissions", "key label category");

      if (!user) {
        return res.status(401).json({
          message: "المستخدم غير موجود",
          error: "USER_NOT_FOUND",
        });
      }

      // Admins have all permissions
      if (user.role === "admin") {
        return next();
      }

      // Check direct permissions first
      const hasDirectPermission = user.directPermissions?.some(
        (perm) => perm.key === permissionKey
      );

      if (hasDirectPermission) {
        return next();
      }

      // Check group permissions
      const hasGroupPermission = user.permissionGroups?.some((group) =>
        group.permissions?.some((perm) => perm.key === permissionKey)
      );

      if (hasGroupPermission) {
        return next();
      }

      // Permission denied
      return res.status(403).json({
        message: `الصلاحية مرفوضة: يتطلب صلاحية "${permissionKey}"`,
        error: "PERMISSION_DENIED",
        requiredPermission: permissionKey,
      });
    } catch (error) {
      console.error("❌ Permission check error:", error);
      return res.status(500).json({
        message: "خطأ في التحقق من الصلاحيات",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  };
};

/**
 * Check if user has ANY of the specified permissions
 * Useful for endpoints that can be accessed with multiple different permissions
 */
const hasAnyPermission = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          message: "غير مصرح: يجب تسجيل الدخول أولاً",
          error: "UNAUTHORIZED",
        });
      }

      const user = await User.findById(req.user._id)
        .populate({
          path: "permissionGroups",
          populate: {
            path: "permissions",
            select: "key label category",
          },
        })
        .populate("directPermissions", "key label category");

      if (!user) {
        return res.status(401).json({
          message: "المستخدم غير موجود",
          error: "USER_NOT_FOUND",
        });
      }

      // Admins have all permissions
      if (user.role === "admin") {
        return next();
      }

      // Check each permission
      for (const key of permissionKeys) {
        // Check direct permissions
        const hasDirectPerm = user.directPermissions?.some(
          (perm) => perm.key === key
        );

        if (hasDirectPerm) {
          return next();
        }

        // Check group permissions
        const hasGroupPerm = user.permissionGroups?.some((group) =>
          group.permissions?.some((perm) => perm.key === key)
        );

        if (hasGroupPerm) {
          return next();
        }
      }

      return res.status(403).json({
        message: "الصلاحية مرفوضة: لا توجد صلاحيات كافية",
        error: "PERMISSION_DENIED",
        requiredPermissions: permissionKeys,
      });
    } catch (error) {
      console.error("❌ Permission check error:", error);
      return res.status(500).json({
        message: "خطأ في التحقق من الصلاحيات",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  };
};

/**
 * Check if user has ALL of the specified permissions
 * Useful for endpoints requiring multiple permissions
 */
const hasAllPermissions = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          message: "غير مصرح: يجب تسجيل الدخول أولاً",
          error: "UNAUTHORIZED",
        });
      }

      const user = await User.findById(req.user._id)
        .populate({
          path: "permissionGroups",
          populate: {
            path: "permissions",
            select: "key label category",
          },
        })
        .populate("directPermissions", "key label category");

      if (!user) {
        return res.status(401).json({
          message: "المستخدم غير موجود",
          error: "USER_NOT_FOUND",
        });
      }

      // Admins have all permissions
      if (user.role === "admin") {
        return next();
      }

      const missingPermissions = [];

      // Check each required permission
      for (const key of permissionKeys) {
        const hasDirectPerm = user.directPermissions?.some(
          (perm) => perm.key === key
        );

        const hasGroupPerm = user.permissionGroups?.some((group) =>
          group.permissions?.some((perm) => perm.key === key)
        );

        if (!hasDirectPerm && !hasGroupPerm) {
          missingPermissions.push(key);
        }
      }

      if (missingPermissions.length > 0) {
        return res.status(403).json({
          message: "الصلاحية مرفوضة: صلاحيات مطلوبة مفقودة",
          error: "PERMISSION_DENIED",
          missingPermissions,
        });
      }

      return next();
    } catch (error) {
      console.error("❌ Permission check error:", error);
      return res.status(500).json({
        message: "خطأ في التحقق من الصلاحيات",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  };
};

/**
 * Get user's all permissions (for attaching to req.user)
 */
export const getUserPermissions = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate({
        path: "permissionGroups",
        populate: {
          path: "permissions",
          select: "key label category",
        },
      })
      .populate("directPermissions", "key label category");

    if (!user) return [];

    if (user.role === "admin") {
      return ["*"]; // Wildcard for admin
    }

    const permissionsSet = new Set();

    // Add direct permissions
    user.directPermissions?.forEach((perm) => {
      if (perm && perm.key) permissionsSet.add(perm.key);
    });

    // Add group permissions
    user.permissionGroups?.forEach((group) => {
      group.permissions?.forEach((perm) => {
        if (perm && perm.key) permissionsSet.add(perm.key);
      });
    });

    return Array.from(permissionsSet);
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
};

export default checkPermission;
export { hasAnyPermission, hasAllPermissions };

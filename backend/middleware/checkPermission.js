import User from "../models/User.js";

export const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id)
        .populate("permissionGroups")
        .populate("directPermissions");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role === "admin") {
        return next();
      }

      const directPerm = user.permissions?.[permissionKey];
      if (directPerm) {
        return next();
      }

      const hasGroupPermission = user.permissionGroups?.some((group) =>
        group.permissions?.some(
          (perm) => perm.key === permissionKey || perm._id?.toString() === permissionKey
        )
      );

      if (hasGroupPermission) {
        return next();
      }

      const hasDirectPermission = user.directPermissions?.some(
        (perm) => perm.key === permissionKey
      );

      if (hasDirectPermission) {
        return next();
      }

      return res.status(403).json({
        message: `فشل: الصلاحية المطلوبة: ${permissionKey}`,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

export const hasAnyPermission = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id)
        .populate("permissionGroups")
        .populate("directPermissions");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role === "admin") {
        return next();
      }

      for (const key of permissionKeys) {
        if (user.permissions?.[key]) {
          return next();
        }

        const hasGroupPerm = user.permissionGroups?.some((group) =>
          group.permissions?.some((perm) => perm.key === key)
        );

        if (hasGroupPerm) {
          return next();
        }

        const hasDirectPerm = user.directPermissions?.some(
          (perm) => perm.key === key
        );

        if (hasDirectPerm) {
          return next();
        }
      }

      return res.status(403).json({
        message: "فشل: لا توجد صلاحيات كافية",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

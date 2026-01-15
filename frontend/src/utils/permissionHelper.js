import {
  permissionDefinitions,
  getPermissionsByCategory,
} from "./permissionDefinitions.js";

// this function checks if the user has a specific permission

export const checkPermission = (permissionKey, user) => {
  console.log("check permissions function---------------->");

  console.log(permissionKey);
  console.log(user.permissions);
  // Input validation
  if (!user || !permissionKey) return false;

  // Admin users have all permissions
  if (user.role === "admin") return true;

  // Check direct permissions object (primary method)

  // in user docunemt we have permissions document for chenck user direct permissions
  if (user.permissions?.[permissionKey]) {
    return true;
  }

  // Check permission groups array (secondary method)
  if (user.permissionGroups && Array.isArray(user.permissionGroups)) {
    for (const group of user.permissionGroups) {
      if (group.permissions && Array.isArray(group.permissions)) {
        const hasPermission = group.permissions.some(
          (p) => p.key === permissionKey
        );
        if (hasPermission) {
          return true;
        }
      }
    }
  }

  // Check direct permissions array (legacy method)
  if (user.directPermissions && Array.isArray(user.directPermissions)) {
    for (const perm of user.directPermissions) {
      if (perm.key === permissionKey) {
        return true;
      }
    }
  }

  return false;
};

// Check if user has any permission for a specific category
export const checkCategoryPermission = (category, user) => {
  if (!user || !category) return false;
  if (user.role === "admin") return true;

  const categoryPermissions = getPermissionsByCategory(category);
  return categoryPermissions.some((perm) => checkPermission(perm.key, user));
};

// Get all permissions a user has for display
export const getUserPermissions = (user) => {
  if (!user) return [];
  if (user.role === "admin") return Object.values(permissionDefinitions);

  const userPerms = new Set(); // Use Set to automatically handle duplicates

  // Check direct permissions object (primary method)
  if (user.permissions) {
    Object.keys(user.permissions).forEach((key) => {
      if (user.permissions[key] && permissionDefinitions[key]) {
        userPerms.add(permissionDefinitions[key]);
      }
    });
  }

  // Check permission groups (secondary method)
  if (user.permissionGroups && Array.isArray(user.permissionGroups)) {
    user.permissionGroups.forEach((group) => {
      if (group.permissions && Array.isArray(group.permissions)) {
        group.permissions.forEach((perm) => {
          if (permissionDefinitions[perm.key]) {
            userPerms.add(permissionDefinitions[perm.key]);
          }
        });
      }
    });
  }

  // Check direct permissions array (legacy method)
  if (user.directPermissions && Array.isArray(user.directPermissions)) {
    user.directPermissions.forEach((perm) => {
      if (permissionDefinitions[perm.key]) {
        userPerms.add(permissionDefinitions[perm.key]);
      }
    });
  }

  return Array.from(userPerms);
};

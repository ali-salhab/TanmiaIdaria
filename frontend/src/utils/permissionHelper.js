import { permissionDefinitions, getPermissionsByCategory } from './permissionDefinitions.js';

export const checkPermission = (permissionKey, user) => {
  console.log("check permissions function -------------->");
  console.log(permissionKey);
  console.log(user);

  if (!user) return false;

  if (user.role === "admin") return true;

  if (user.permissions?.[permissionKey]) {
    return true;
  }

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
  if (!user) return false;
  if (user.role === "admin") return true;

  const categoryPermissions = getPermissionsByCategory(category);
  return categoryPermissions.some(perm => checkPermission(perm.key, user));
};

// Get all permissions a user has for display
export const getUserPermissions = (user) => {
  if (!user) return [];
  if (user.role === "admin") return Object.values(permissionDefinitions);

  const userPerms = [];

  // Check direct permissions object
  if (user.permissions) {
    Object.keys(user.permissions).forEach(key => {
      if (user.permissions[key] && permissionDefinitions[key]) {
        userPerms.push(permissionDefinitions[key]);
      }
    });
  }

  // Check permission groups
  if (user.permissionGroups && Array.isArray(user.permissionGroups)) {
    user.permissionGroups.forEach(group => {
      if (group.permissions && Array.isArray(group.permissions)) {
        group.permissions.forEach(perm => {
          if (permissionDefinitions[perm.key]) {
            userPerms.push(permissionDefinitions[perm.key]);
          }
        });
      }
    });
  }

  // Check direct permissions array
  if (user.directPermissions && Array.isArray(user.directPermissions)) {
    user.directPermissions.forEach(perm => {
      if (permissionDefinitions[perm.key]) {
        userPerms.push(permissionDefinitions[perm.key]);
      }
    });
  }

  // Remove duplicates
  return userPerms.filter((perm, index, self) =>
    index === self.findIndex(p => p.key === perm.key)
  );
};

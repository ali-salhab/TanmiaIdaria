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

# Permission System Fixes and Implementation

## Issues Fixed

### 1. **HomepageBuilder.jsx - Missing Component Reference**
**File**: `frontend/src/pages/HomepageBuilder.jsx`
- **Issue**: Component was referenced as `PermissionManagerComponent` but imported as `PermissionManager`
- **Fix**: Changed lines 438 and 602 to use the correct component name `PermissionManager`

### 2. **Backend Permission Routes - 404 Errors**
**File**: `backend/routes/permissions.js`
- **Issue**: Routes for `/groups/add-user` and `/groups/remove-user` were defined AFTER the parameterized route `/groups/:id`, causing Express to match them to the parameterized route instead
- **Fix**: Reordered routes so specific paths come before parameterized routes:
  - Moved `/groups/add-user` and `/groups/remove-user` BEFORE `/groups/:id`
  - Fixed incorrect path from `/permissions/user/:userId/permissions` to `/users/:userId/permissions`

### 3. **Auth Permissions Field Mismatch**
**File**: `backend/routes/auth.js`
- **Issue**: The `/me` endpoint was checking for `perm?.name` but the Permission model has `perm?.key` field
- **Fix**: Changed permission field references from `.name` to `.key` on lines 70 and 79

## New Features Implemented

### 1. **Dynamic Home Page Based on Permissions**
**Frontend - New File**: `frontend/src/utils/homeSectionsConfig.js`
- Created configuration mapping permissions to home page sections
- Available sections include:
  - Employees (`employees.view`)
  - Incidents (`incidents.view`)
  - Vacations (`vacations.view`)
  - Users (`users.view`)
  - Documents (`documents.view`)
  - Salary (`salary.view`)
  - Rewards (`rewards.view`)
  - Punishments (`punishments.view`)
  - Circulars (`circulars.view`)
  - Analytics (`analytics.view`)

**Frontend Update**: `frontend/src/pages/Home.jsx`
- Imported new `getAvailableSections` utility
- Replaced hardcoded permission list with dynamic configuration
- Now displays only sections user has permission to access
- Added descriptions to each section for better UX

### 2. **Permission System Architecture**

**How It Works:**
1. User logs in → `/auth/login`
2. Frontend stores JWT token
3. Frontend calls `/auth/me` on page load
4. Backend returns user object with:
   - User info (id, username, role)
   - Direct permissions (user-assigned)
   - Permission groups (group-assigned with their permissions)
   - Merged permissions object with all accessible permissions
5. Frontend uses `checkPermission()` utility to verify access
6. Home page dynamically generates sections based on user's actual permissions

**Backend Permission Merging Logic:**
- Admin users get all permissions automatically
- Regular users get permissions from:
  - Direct permissions assigned to their account
  - All permissions from their assigned permission groups
- All permissions are merged into a single object for quick lookup

## Permission Keys Available

Based on the `backend/permisionSeeder.js`:

```
Users: users.view, users.create, users.edit, users.delete, users.reset_password, users.assign_permissions, users.assign_groups

Employees: employees.view, employees.create, employees.edit, employees.delete, employees.export, employees.upload_document, employees.delete_document

Incidents: incidents.view, incidents.create, incidents.edit, incidents.delete, incidents.export

Vacations: vacations.view, vacations.create, vacations.edit, vacations.delete, vacations.approve, vacations.reject

Documents: documents.view, documents.upload, documents.download, documents.delete

FileShare: fileshare.send, fileshare.view_inbox, fileshare.read

Circulars: circulars.view, circulars.create, circulars.edit, circulars.delete, circulars.upload_files, circulars.delete_files, circulars.publish, circulars.unpublish

Salary: salary.view, salary.upload, salary.delete

Rewards: rewards.view, rewards.create, rewards.delete

Punishments: punishments.view, punishments.create, punishments.delete

... and more (see permisionSeeder.js for complete list)
```

## Testing the Permission System

### Test Admin User
- Login with admin account
- Should see all available sections on home page

### Test Limited User
1. Create a new user
2. Assign only "employees.view" permission
3. Login with this user
4. Should only see "الموظفين" (Employees) section

### Test Permission Groups
1. Create a permission group with selected permissions
2. Add user to the group
3. Verify user can only access sections for their group's permissions

## Files Modified

1. `backend/routes/permissions.js` - Fixed route ordering and paths
2. `backend/routes/auth.js` - Fixed permission field reference from `.name` to `.key`
3. `frontend/src/pages/HomepageBuilder.jsx` - Fixed component name references
4. `frontend/src/pages/Home.jsx` - Updated to use dynamic sections configuration

## Files Created

1. `frontend/src/utils/homeSectionsConfig.js` - Permission to UI section mapping

## Next Steps (Optional)

- Add permission-based action buttons (Edit, Delete, Create) on pages
- Implement dynamic sidebar navigation based on permissions
- Add permission grant/revoke notifications via Socket.io
- Create admin dashboard for permission management

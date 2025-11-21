# Permission System Developer Guide

## Overview

The permission system is a role-based access control (RBAC) system with support for both direct permissions and permission groups.

## Architecture

### Backend

**Flow:**
1. User logs in → `/api/auth/login`
2. Server creates JWT token
3. User calls `/api/auth/me` with token
4. Server returns user object with merged permissions

**User Object Structure:**
```javascript
{
  _id: "userId",
  username: "username",
  role: "admin|employee|viewer|user|hr|finance",
  permissions: {
    "employees.view": true,
    "incidents.create": true,
    // ... all merged permissions
  },
  permissionGroups: [
    {
      _id: "groupId",
      name: "GroupName",
      permissions: [
        { _id: "permId", key: "permission.key", ... },
        // ...
      ]
    }
  ],
  directPermissions: [
    { _id: "permId", key: "permission.key", ... }
  ]
}
```

**Key Files:**
- `backend/routes/auth.js` - Authentication and /me endpoint
- `backend/routes/permissions.js` - Permission management API
- `backend/models/User.js` - User schema with permissions
- `backend/models/Permission.js` - Permission schema
- `backend/models/PermissionGroup.js` - Permission group schema
- `backend/permisionSeeder.js` - Initial permission seeding

### Frontend

**Flow:**
1. User logs in → Token stored in localStorage
2. Home page loads → Calls `/api/auth/me`
3. User object stored in React state
4. Components check permissions using `checkPermission()` utility
5. UI dynamically renders based on available permissions

**Key Files:**
- `frontend/src/pages/Home.jsx` - Home page with dynamic sections
- `frontend/src/utils/permissionHelper.js` - Permission checking utility
- `frontend/src/utils/homeSectionsConfig.js` - Home page sections mapping

## Adding New Permissions

### Step 1: Add to Backend Seeder
Edit `backend/permisionSeeder.js`:
```javascript
const permissions = [
  // ... existing permissions
  "newfeature.view",
  "newfeature.create",
  "newfeature.edit",
  "newfeature.delete",
];
```

### Step 2: Add Routes with Permission Checks
Edit `backend/routes/yourFeature.js`:
```javascript
import { protect, authorize } from "../middleware/auth.js";
import { checkPermission } from "../middleware/checkPermission.js";

router.get("/", protect, checkPermission("newfeature.view"), handler);
router.post("/", protect, checkPermission("newfeature.create"), handler);
```

### Step 3: Add Frontend Section (Optional)
Edit `frontend/src/utils/homeSectionsConfig.js`:
```javascript
{
  category: "newfeature",
  requiredPermission: "newfeature.view",
  label: "الميزة الجديدة",
  icon: "🎯",
  color: "from-blue-400 to-sky-500",
  path: "/newfeature",
  description: "وصف الميزة الجديدة",
}
```

### Step 4: Add Permission Checks in Components
```javascript
import { checkPermission } from "../utils/permissionHelper";

function MyComponent({ user }) {
  if (!checkPermission("newfeature.view", user)) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      {checkPermission("newfeature.create", user) && (
        <button>Create New</button>
      )}
    </div>
  );
}
```

## API Endpoints

### Permission Management

**Get All Permissions**
```
GET /api/permissions
Authorization: Bearer <token>
```

**Create Permission**
```
POST /api/permissions
Authorization: Bearer <token>
Content-Type: application/json
{
  "key": "feature.action",
  "label": "Feature - Action",
  "description": "Optional description",
  "category": "feature"
}
```

**Get All Permission Groups**
```
GET /api/permissions/groups
Authorization: Bearer <token>
```

**Create Permission Group**
```
POST /api/permissions/groups
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "Group Name",
  "description": "Group description",
  "permissions": ["permission.key1", "permission.key2"]
}
```

**Add User to Group**
```
POST /api/permissions/groups/add-user
Authorization: Bearer <token>
Content-Type: application/json
{
  "userId": "userId",
  "groupId": "groupId"
}
```

**Remove User from Group**
```
POST /api/permissions/groups/remove-user
Authorization: Bearer <token>
Content-Type: application/json
{
  "userId": "userId",
  "groupId": "groupId"
}
```

**Get User Permissions**
```
GET /api/permissions/user/:userId/permissions
Authorization: Bearer <token>
```

## Permission Naming Convention

Use dot notation: `module.action`

**Modules:**
- `users` - User management
- `employees` - Employee data
- `incidents` - Incident tracking
- `vacations` - Vacation management
- `documents` - Document management
- `salary` - Salary management
- `rewards` - Rewards management
- `punishments` - Punishment management
- `circulars` - Circular announcements
- `analytics` - Analytics and reports
- `settings` - System settings
- `permissions` - Permission management

**Actions:**
- `view` - Can view/read data
- `create` - Can create new records
- `edit` - Can modify existing records
- `delete` - Can remove records
- `export` - Can export data
- `upload_document` - Can upload files
- `approve` - Can approve requests
- `publish` - Can publish content

**Examples:**
- `employees.view` - Can view employees
- `incidents.create` - Can create incidents
- `vacations.approve` - Can approve vacation requests
- `salary.export` - Can export salary data

## Permission Checking

### Frontend Utility

```javascript
import { checkPermission } from "../utils/permissionHelper";

// Check single permission
const canView = checkPermission("employees.view", user);
const canCreate = checkPermission("employees.create", user);

// Admin bypass
if (user.role === "admin") {
  // Admins have all permissions
}
```

### Backend Middleware

```javascript
import { checkPermission } from "../middleware/checkPermission.js";

// Check single permission
router.get("/:id", protect, checkPermission("employees.view"), handler);

// Check multiple permissions (any)
router.get("/:id", protect, checkPermission(["employees.view", "incidents.view"]), handler);
```

## Admin Dashboard Usage

1. Login as admin
2. Navigate to permission management section
3. Create or modify permission groups
4. Assign users to groups
5. Or assign individual permissions to users
6. Users see updated permissions immediately after login/refresh

## Troubleshooting

### User sees "Access Denied"
- Check if user has `view` permission for that module
- Check if user is in a permission group with required permissions
- Verify permission key matches exactly (case-sensitive)

### New permissions not showing
- Run permission seeder to create new permissions in database
- Restart backend server
- Clear frontend cache and refresh

### Admin panel shows 404 for permission routes
- Ensure route order is correct (specific routes before parameterized)
- Verify authentication middleware is applied
- Check that permission keys match between frontend and backend

## Testing Permission System

### Test Scenario 1: Basic Permission Check
```
1. Create user "john"
2. Assign "employees.view" permission
3. Login as john
4. Should see only "Employees" section on home
5. Should get 403 when trying to access other sections
```

### Test Scenario 2: Permission Groups
```
1. Create group "HR Staff" with permissions:
   - employees.view
   - employees.edit
   - vacations.view
   - vacations.approve
2. Add user "hr_manager" to "HR Staff" group
3. Login as hr_manager
4. Should see Employees and Vacations sections
5. Should be able to edit employees and approve vacations
```

### Test Scenario 3: Direct & Group Permissions
```
1. Add user to "Basic Staff" group (employees.view only)
2. Add direct permission "incidents.create" to same user
3. Login as that user
4. Should see both Employees (from group) and be able to create incidents
```

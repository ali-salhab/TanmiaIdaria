# Permission System - Complete Testing Guide

## Overview

This guide will help you test all permission system endpoints and features. We've provided both automated tests (via frontend component) and manual testing instructions.

---

## Quick Start Testing

### Option 1: Use Frontend Permission Tester (Recommended)

1. **Import the PermissionTester component** in any admin page:
   ```jsx
   import PermissionTester from "../components/PermissionTester";
   
   export default function AdminDashboard() {
     return (
       <div>
         <PermissionTester />
         {/* other components */}
       </div>
     );
   }
   ```

2. **Click "Run All Tests"** button
   - Automatically tests all endpoints
   - Creates test data, verifies operations, cleans up
   - Shows real-time results

---

## Manual Testing Checklist

### Prerequisites
- Ensure backend is running (`npm run dev`)
- Login as admin user
- Have multiple test users ready

### Test 1: Get All Permissions
```
Endpoint: GET /api/permissions
Expected: 200 OK with array of permissions
Test: Should see permissions like "employees.view", "incidents.create", etc.
```

**Browser Console:**
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/permissions', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

---

### Test 2: Create Permission Group
```
Endpoint: POST /api/permissions/groups
Expected: 201 Created with group object
Required: Admin token
```

**Browser Console:**
```javascript
const token = localStorage.getItem('token');
const permissions = ['perm_id_1', 'perm_id_2']; // Use real IDs from Test 1
fetch('http://localhost:3000/api/permissions/groups', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'HR Department',
    description: 'HR team permissions',
    permissions: permissions
  })
}).then(r => r.json()).then(console.log);
```

**Expected Response:**
```json
{
  "_id": "group123",
  "name": "HR Department",
  "description": "HR team permissions",
  "permissions": [...],
  ...
}
```

---

### Test 3: Add User to Group
```
Endpoint: POST /api/permissions/groups/add-user
Expected: 200 OK
Required: Admin token, existing group ID, existing user ID
```

**Browser Console:**
```javascript
const token = localStorage.getItem('token');
const groupId = 'group123'; // From Test 2
const userId = 'user456'; // Get from admin panel

fetch('http://localhost:3000/api/permissions/groups/add-user', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: userId,
    groupId: groupId
  })
}).then(r => r.json()).then(console.log);
```

---

### Test 4: Get User Permissions
```
Endpoint: GET /api/permissions/user/:userId/permissions
Expected: 200 OK with user permissions object
```

**Browser Console:**
```javascript
const token = localStorage.getItem('token');
const userId = 'user456';

fetch(`http://localhost:3000/api/permissions/user/${userId}/permissions`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

**Expected Response:**
```json
{
  "user": {
    "_id": "user456",
    "username": "john_doe",
    "directPermissions": [...],
    "permissionGroups": [...]
  },
  "permissionIds": ["perm1", "perm2", "perm3"]
}
```

---

### Test 5: Update Direct Permissions
```
Endpoint: PUT /api/permissions/users/:userId/permissions
Expected: 200 OK
Required: Admin token, array of permission IDs
```

**Browser Console:**
```javascript
const token = localStorage.getItem('token');
const userId = 'user456';
const permissionIds = ['perm1_id', 'perm2_id']; // Real permission IDs

fetch(`http://localhost:3000/api/permissions/users/${userId}/permissions`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    directPermissions: permissionIds
  })
}).then(r => r.json()).then(console.log);
```

---

### Test 6: Remove User from Group
```
Endpoint: POST /api/permissions/groups/remove-user
Expected: 200 OK
```

**Browser Console:**
```javascript
const token = localStorage.getItem('token');
const groupId = 'group123';
const userId = 'user456';

fetch('http://localhost:3000/api/permissions/groups/remove-user', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: userId,
    groupId: groupId
  })
}).then(r => r.json()).then(console.log);
```

---

### Test 7: Update Group
```
Endpoint: PUT /api/permissions/groups/:id
Expected: 200 OK
Required: Admin token
```

**Browser Console:**
```javascript
const token = localStorage.getItem('token');
const groupId = 'group123';
const permissionIds = ['perm1_id', 'perm2_id'];

fetch(`http://localhost:3000/api/permissions/groups/${groupId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Updated HR Team',
    description: 'Updated description',
    permissions: permissionIds
  })
}).then(r => r.json()).then(console.log);
```

---

### Test 8: Delete Group
```
Endpoint: DELETE /api/permissions/groups/:id
Expected: 200 OK
Required: Admin token
```

**Browser Console:**
```javascript
const token = localStorage.getItem('token');
const groupId = 'group123';

fetch(`http://localhost:3000/api/permissions/groups/${groupId}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

---

## Testing Real-World Scenarios

### Scenario 1: Create HR Team Group and Assign Users

**Steps:**
1. Get all permissions: `GET /api/permissions`
2. Filter for HR-related permissions (employees.view, vacations.approve, etc.)
3. Create group with those permissions: `POST /api/permissions/groups`
4. Get all users: `GET /api/users`
5. Add multiple users to group: `POST /api/permissions/groups/add-user` (repeat)
6. Verify each user has correct permissions: `GET /api/permissions/user/:userId/permissions`
7. Login as one of those users and verify they can access HR sections

---

### Scenario 2: Grant Direct Permissions to Individual User

**Steps:**
1. Get user's current permissions: `GET /api/permissions/user/:userId/permissions`
2. Get all permissions: `GET /api/permissions`
3. Select specific permissions (e.g., "incidents.create")
4. Update user with those permissions: `PUT /api/permissions/users/:userId/permissions`
5. Login as that user and verify new section appears

---

### Scenario 3: Test Permission Combinations

**Steps:**
1. Create user "TestUser"
2. Assign group "Basic Staff" (has "employees.view")
3. Add direct permission "incidents.create"
4. Get user permissions should show both:
   - From group: employees.view
   - Direct: incidents.create
5. Login as user and verify both sections accessible

---

## Common Issues & Troubleshooting

### Issue: 404 Not Found on Permission Endpoints

**Causes:**
- Wrong endpoint format
- Route prefix issue
- Backend not running

**Solution:**
```
Check: http://localhost:3000/api/permissions (not /api/permission)
Make sure backend is running on port 3000
Check server.js has: app.use("/api/permissions", permissionsRoutes);
```

---

### Issue: 401 Unauthorized

**Causes:**
- Missing token
- Invalid/expired token
- Token not in Authorization header

**Solution:**
```javascript
// Check token exists
console.log(localStorage.getItem('token'));

// Use correct format
headers: { Authorization: `Bearer YOUR_TOKEN_HERE` }

// Not: Authorization: YOUR_TOKEN_HERE
// Not: Authentication: Bearer ...
```

---

### Issue: 403 Forbidden (Admin Only)

**Causes:**
- User is not admin
- Using non-admin token

**Solution:**
- Login as admin user
- Admin users get all permissions automatically
- Check user.role === "admin" in backend response

---

### Issue: User Doesn't See New Permissions

**Causes:**
- User hasn't logged out/in
- Token doesn't have new permissions yet
- Frontend not checking permissions correctly

**Solution:**
```javascript
// User must login again to get fresh token with merged permissions
// OR check user object has:
user.permissions['employees.view'] === true
// OR check in groups:
user.permissionGroups[0].permissions.some(p => p.key === 'employees.view')
```

---

### Issue: Endpoint Returns Empty Array/Object

**Causes:**
- No data in database
- Query didn't match any records
- Wrong URL parameters

**Solution:**
1. Run permission seeder: `node backend/permisionSeeder.js`
2. Create test data manually
3. Double-check URL parameter values

---

## Database Cleanup

If tests create too much test data, clean up:

```javascript
// In MongoDB shell or compass
db.permissiongroups.deleteMany({ name: /Test Group/ })
db.users.updateMany({}, { $set: { directPermissions: [] } })
```

---

## Performance Tips

- **Lazy load permissions** instead of fetching all at once
- **Cache permission results** in Redux/Context
- **Use indexes** on user._id and permissiongroups._id
- **Batch user updates** instead of one-by-one

---

## Success Criteria

All tests pass if:
- ✅ Can create permission groups
- ✅ Can add/remove users from groups
- ✅ Can assign direct permissions to users
- ✅ User sees correct home page sections based on permissions
- ✅ Admins see all sections
- ✅ Regular users see only allowed sections
- ✅ No 404 errors on permission endpoints
- ✅ Permissions update immediately on login
- ✅ Group membership changes take effect

---

## Next Steps

After all tests pass:
1. Deploy to staging environment
2. Test with real users
3. Monitor for permission-related errors
4. Gather user feedback
5. Deploy to production

---

## Support

If tests fail with specific errors:
1. Check `API_ENDPOINTS_REFERENCE.md` for correct endpoint format
2. Review error response in browser DevTools
3. Check backend logs for detailed error message
4. Verify data exists in database
5. Ensure authentication middleware is working

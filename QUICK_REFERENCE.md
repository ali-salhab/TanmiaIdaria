# Permission System - Quick Reference Card

## 🚀 Quick Start

### Run Frontend Test
```javascript
// In browser console
import PermissionTester from "../components/PermissionTester";
// Add to any admin page and click "Run All Tests"
```

### Check Your Permissions (Browser Console)
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(data => {
  console.log('Permissions:', data.user.permissions);
});
```

---

## 📍 All API Endpoints

### Permissions
```
GET  /api/permissions
POST /api/permissions
```

### Groups
```
GET    /api/permissions/groups
POST   /api/permissions/groups
PUT    /api/permissions/groups/:id
DELETE /api/permissions/groups/:id
```

### Group Members
```
POST /api/permissions/groups/add-user
POST /api/permissions/groups/remove-user
```

### User Permissions
```
GET /api/permissions/user/:userId/permissions
PUT /api/permissions/users/:userId/permissions
```

---

## 🔧 Common Tasks

### Create a Permission Group
```bash
curl -X POST http://localhost:3000/api/permissions/groups \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HR Team",
    "description": "HR permissions",
    "permissions": ["perm_id_1", "perm_id_2"]
  }'
```

### Add User to Group
```bash
curl -X POST http://localhost:3000/api/permissions/groups/add-user \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "groupId": "group_id"
  }'
```

### Update User Direct Permissions
```bash
curl -X PUT http://localhost:3000/api/permissions/users/user_id/permissions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "directPermissions": ["perm_id_1", "perm_id_2"]
  }'
```

---

## ❌ Error Codes Explained

| Code | Issue | Solution |
|------|-------|----------|
| 404 | Endpoint not found | Check URL format: `/api/permissions/...` |
| 401 | No token/Invalid token | Login again or check token in localStorage |
| 403 | Admin access required | Login with admin account |
| 400 | Bad request | Check JSON body format |
| 500 | Server error | Check backend logs |

---

## ✅ Verification Steps

```bash
# 1. Backend running?
curl http://localhost:3000/api/health

# 2. Can access permissions?
curl http://localhost:3000/api/permissions \
  -H "Authorization: Bearer TOKEN"

# 3. Can create group?
POST /api/permissions/groups { name, permissions }

# 4. Can add user to group?
POST /api/permissions/groups/add-user { userId, groupId }

# 5. User sees permissions?
GET /api/auth/me (check user.permissions)

# 6. Home page shows sections?
Login as user, check home page has correct sections
```

---

## 📚 Documentation Files

- **API_ENDPOINTS_REFERENCE.md** - Full API docs
- **TESTING_GUIDE.md** - Complete testing instructions  
- **FINAL_FIXES_SUMMARY.md** - All changes made
- **PERMISSION_SYSTEM_GUIDE.md** - Developer guide

---

## 🐛 Debugging

### View User Permissions
```javascript
// In browser, logged in as a user
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(data => {
  console.table(data.user.permissions); // All permissions
  console.table(data.user.permissionGroups); // Their groups
  console.table(data.user.directPermissions); // Direct perms
});
```

### Check Home Page Sections
```javascript
// In home page component
console.log('Available sections:', allowedSections);
console.log('User:', user);
```

### Backend Logs
```bash
# Check server logs while making requests
# Look for permission merge logs
# Check for database errors
```

---

## 🎯 Testing Workflow

1. **Login as Admin**
   - See all sections on home

2. **Create Test Group**
   - POST /permissions/groups with specific permissions

3. **Create Test User**
   - POST /users with role "user"

4. **Add User to Group**
   - POST /permissions/groups/add-user

5. **Logout, Login as Test User**
   - Should see only allowed sections

6. **Test Direct Permission**
   - PUT /permissions/users/:id/permissions

7. **Verify Changes**
   - Sections appear/disappear
   - No console errors

---

## ⏱️ Caching & Refresh

- **Permissions cached** when user logs in
- **Changes take effect** on next login
- **Real-time updates** via Socket.io (future feature)
- **Clear localStorage** to force re-login

---

## 🔐 Security Notes

- Admin bypasses all permission checks
- Direct permissions override group restrictions (no current denials)
- Tokens expire (check JWT expiry)
- Always validate permissions on backend, not just frontend

---

## 📞 Common Issues

**Q: User doesn't see new section after permission grant**
A: User must logout and login again to get fresh token

**Q: 404 on permission endpoints**
A: Check route format is exactly `/api/permissions/...`

**Q: Can't add user to group**
A: Verify groupId and userId are valid (get from database)

**Q: Permission merging broken**
A: Check backend logs for errors during permission merge

**Q: Groups not saving**
A: Verify MongoDB connection and PermissionGroup schema

---

## 🎓 Learning Path

1. Read **FINAL_FIXES_SUMMARY.md** - Understand what was fixed
2. Read **PERMISSION_SYSTEM_GUIDE.md** - Learn system architecture
3. Read **API_ENDPOINTS_REFERENCE.md** - Learn endpoints
4. Follow **TESTING_GUIDE.md** - Test everything
5. Use **PermissionTester component** - Automate testing

---

## ✨ Files Modified

```
✅ backend/routes/permissions.js
✅ backend/routes/auth.js
✅ backend/controllers/permissionController.js
✅ frontend/src/pages/Home.jsx
✅ frontend/src/pages/HomepageBuilder.jsx
✅ frontend/src/pages/permissions/PermissionsManager.jsx

✨ frontend/src/components/PermissionTester.jsx (new)
✨ frontend/src/utils/homeSectionsConfig.js (new)
```

---

## 🚦 Status

- ✅ All endpoints working
- ✅ No 404 errors
- ✅ Permissions merging correctly
- ✅ Home page dynamic
- ✅ Testing framework ready
- ✅ Documentation complete
- ✅ Syntax checks passing
- ✅ Ready for use!


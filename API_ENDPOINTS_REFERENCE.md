# Permission System API Endpoints Reference

## Complete API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All endpoints (except `/auth/login` and `/auth/register`) require a JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Permissions Endpoints

### GET /permissions
**Get all available permissions**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:** `200 OK`
```json
[
  {
    "_id": "6911e839ad331867a0946704",
    "key": "employees.view",
    "label": "View Employees",
    "description": "Can view employee list",
    "category": "employees"
  },
  ...
]
```

---

### POST /permissions
**Create a new permission** (Admin only)

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "key": "newfeature.view",
  "label": "View New Feature",
  "description": "Can access new feature",
  "category": "newfeature"
}
```

**Response:** `201 Created`
```json
{
  "_id": "...",
  "key": "newfeature.view",
  "label": "View New Feature",
  ...
}
```

---

## Permission Groups Endpoints

### GET /permissions/groups
**Get all permission groups**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "_id": "group123",
    "name": "HR Staff",
    "description": "HR team permissions",
    "permissions": [
      { "_id": "...", "key": "employees.view", ... },
      { "_id": "...", "key": "vacations.approve", ... }
    ],
    "members": [
      { "_id": "user1", "username": "john_hr" }
    ],
    "createdBy": { "_id": "admin", "username": "admin" }
  },
  ...
]
```

---

### POST /permissions/groups
**Create a new permission group** (Admin only)

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Finance Team",
  "description": "Finance department permissions",
  "permissions": [
    "permission_id_1",
    "permission_id_2"
  ]
}
```

**Response:** `201 Created`
```json
{
  "_id": "group_new_id",
  "name": "Finance Team",
  "permissions": [...],
  ...
}
```

---

### PUT /permissions/groups/:id
**Update a permission group** (Admin only)

**URL Parameters:**
- `id` - Group ID

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "permissions": ["perm_id_1", "perm_id_2"]
}
```

**Response:** `200 OK`
```json
{
  "_id": "group_id",
  "name": "Updated Name",
  ...
}
```

---

### DELETE /permissions/groups/:id
**Delete a permission group** (Admin only)

**URL Parameters:**
- `id` - Group ID

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "message": "Group deleted successfully"
}
```

---

## Group Membership Endpoints

### POST /permissions/groups/add-user
**Add user to a permission group** (Admin only)

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "user_id_to_add",
  "groupId": "group_id"
}
```

**Response:** `200 OK`
```json
{
  "_id": "group_id",
  "name": "Group Name",
  "members": [...]
}
```

**Errors:**
- `404` - Group or User not found
- `400` - User already in group

---

### POST /permissions/groups/remove-user
**Remove user from a permission group** (Admin only)

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "user_id_to_remove",
  "groupId": "group_id"
}
```

**Response:** `200 OK`
```json
{
  "message": "User removed from group",
  "group": { ... }
}
```

---

## User Permissions Endpoints

### GET /permissions/user/:userId/permissions
**Get all permissions for a specific user** (including group permissions)

**URL Parameters:**
- `userId` - User ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "_id": "user_id",
    "username": "john_doe",
    "directPermissions": [
      { "_id": "perm1", "key": "employees.view", ... }
    ],
    "permissionGroups": [
      {
        "_id": "group1",
        "name": "HR Staff",
        "permissions": [...]
      }
    ]
  },
  "permissionIds": [
    "perm1_id",
    "perm2_id",
    "perm3_id"
  ]
}
```

---

### PUT /permissions/users/:userId/permissions
**Update direct permissions for a user** (Admin only)

**URL Parameters:**
- `userId` - User ID

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "directPermissions": [
    "permission_id_1",
    "permission_id_2",
    "permission_id_3"
  ]
}
```

**Response:** `200 OK`
```json
{
  "message": "User direct permissions updated",
  "permissions": { ... }
}
```

---

## Testing with cURL

### Test 1: Get All Permissions
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/permissions
```

### Test 2: Create Permission Group
```bash
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Group",
    "description": "Test group description",
    "permissions": ["perm_id_1", "perm_id_2"]
  }' \
  http://localhost:3000/api/permissions/groups
```

### Test 3: Add User to Group
```bash
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "groupId": "group_id"
  }' \
  http://localhost:3000/api/permissions/groups/add-user
```

### Test 4: Get User Permissions
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/permissions/user/user_id/permissions
```

### Test 5: Update User Direct Permissions
```bash
curl -X PUT \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "directPermissions": ["perm_id_1", "perm_id_2"]
  }' \
  http://localhost:3000/api/permissions/users/user_id/permissions
```

---

## Frontend Integration

### Using Axios
```javascript
import API from "../api/api"; // Your configured axios instance

// Get all permissions
const permsRes = await API.get("/permissions");

// Create group
const groupRes = await API.post("/permissions/groups", {
  name: "HR Team",
  description: "HR permissions",
  permissions: ["perm1", "perm2"]
});

// Add user to group
await API.post("/permissions/groups/add-user", {
  userId: "user123",
  groupId: "group456"
});

// Remove user from group
await API.post("/permissions/groups/remove-user", {
  userId: "user123",
  groupId: "group456"
});

// Get user permissions
const userPermsRes = await API.get(`/permissions/user/${userId}/permissions`);

// Update user direct permissions
await API.put(`/permissions/users/${userId}/permissions`, {
  directPermissions: ["perm1_id", "perm2_id"]
});
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "message": "directPermissions must be an array of permission IDs"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided" 
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error message details"
}
```

---

## Workflow Examples

### Example 1: Create Group and Add Users

1. **Get all permissions to choose which ones to add**
   ```
   GET /permissions
   ```

2. **Create a new group with selected permissions**
   ```
   POST /permissions/groups
   Body: { name, description, permissions: [perm_ids] }
   ```

3. **Add users to the group**
   ```
   POST /permissions/groups/add-user
   Body: { userId, groupId }
   ```
   (Repeat for each user)

4. **Verify user has correct permissions**
   ```
   GET /permissions/user/{userId}/permissions
   ```

### Example 2: Assign Direct Permissions to User

1. **Get user's current permissions**
   ```
   GET /permissions/user/{userId}/permissions
   ```

2. **Update direct permissions**
   ```
   PUT /permissions/users/{userId}/permissions
   Body: { directPermissions: [perm_id_1, perm_id_2, ...] }
   ```

3. **Verify permissions are updated**
   ```
   GET /permissions/user/{userId}/permissions
   ```

---

## Debugging Tips

- **Permission not appearing:** Check if permission key is exact match (case-sensitive)
- **User can't access feature:** Verify user has permission via GET /permissions/user/:userId/permissions
- **Group changes not reflected:** User needs to login again to get new token with merged permissions
- **404 on endpoints:** Verify route format is exactly `/api/permissions/...` not `/api/permission/...`
- **Authorization errors:** Ensure JWT token is in Authorization header with "Bearer " prefix

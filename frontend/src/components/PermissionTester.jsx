import React, { useState } from "react";
import API from "../api/api";
import { toast } from "react-hot-toast";

export default function PermissionTester() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const log = (endpoint, status, message, data = null) => {
    const result = {
      endpoint,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTestResults((prev) => [result, ...prev]);
    console.log(`[${endpoint}] ${status}: ${message}`, data);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const testAllEndpoints = async () => {
    setLoading(true);
    setTestResults([]);
    let testGroupId = null;
    let testUserId = null;

    try {
      log("🧪 ALL TESTS", "STARTED", "Beginning comprehensive permission endpoint tests...");

      // 1. Fetch Permissions
      log("GET /permissions", "RUNNING", "Fetching all permissions...");
      const permsRes = await API.get("/permissions");
      const permissions = permsRes.data || [];
      log("GET /permissions", "✓ SUCCESS", `Retrieved ${permissions.length} permissions`, {
        count: permissions.length,
        sample: permissions.slice(0, 2).map(p => ({ key: p.key, id: p._id })),
      });
      if (permissions.length === 0) {
        log("⚠️ WARNING", "NO_DATA", "No permissions found in database");
        return;
      }

      // 2. Fetch Users
      log("GET /users", "RUNNING", "Fetching all users...");
      const usersRes = await API.get("/users");
      const users = usersRes.data || [];
      log("GET /users", "✓ SUCCESS", `Retrieved ${users.length} users`, {
        users: users.map((u) => ({ id: u._id, username: u.username })),
      });

      if (users.length === 0) {
        log("⚠️ WARNING", "NO_DATA", "No users found");
        return;
      }

      testUserId = users[0]._id;

      // 3. Get User's Current Permissions
      log("GET /permissions/user/:userId/permissions", "RUNNING", `Getting permissions for ${users[0].username}...`);
      const userPermsRes = await API.get(`/permissions/user/${testUserId}/permissions`);
      log("GET /permissions/user/:userId/permissions", "✓ SUCCESS", "Got user permissions", {
        permissionIds: userPermsRes.data.permissionIds?.length || 0,
        directPermissions: userPermsRes.data.user?.directPermissions?.length || 0,
        permissionGroups: userPermsRes.data.user?.permissionGroups?.length || 0,
      });

      // 4. Create Permission Group
      log("POST /permissions/groups", "RUNNING", "Creating new test group...");
      const newGroupRes = await API.post("/permissions/groups", {
        name: `Test Group ${Date.now()}`,
        description: "Automated test permission group",
        permissions: permissions.slice(0, Math.min(3, permissions.length)).map((p) => p._id),
      });
      testGroupId = newGroupRes.data._id;
      log("POST /permissions/groups", "✓ SUCCESS", `Created group "${newGroupRes.data.name}"`, {
        id: testGroupId,
        permissionsCount: newGroupRes.data.permissions?.length || 0,
      });

      // 5. Fetch All Groups
      log("GET /permissions/groups", "RUNNING", "Fetching all permission groups...");
      const groupsRes = await API.get("/permissions/groups");
      const groups = groupsRes.data || [];
      log("GET /permissions/groups", "✓ SUCCESS", `Retrieved ${groups.length} groups`, {
        groups: groups.slice(0, 3).map((g) => ({ name: g.name, id: g._id })),
      });

      await sleep(500);

      // 6. Add User to Group
      log("POST /permissions/groups/add-user", "RUNNING", `Adding user to group...`);
      await API.post("/permissions/groups/add-user", {
        userId: testUserId,
        groupId: testGroupId,
      });
      log("POST /permissions/groups/add-user", "✓ SUCCESS", `${users[0].username} added to group`);

      await sleep(500);

      // 7. Verify User is in Group
      log("GET /permissions/user/:userId/permissions", "RUNNING", "Verifying group membership...");
      const verifyRes = await API.get(`/permissions/user/${testUserId}/permissions`);
      const groupCount = verifyRes.data.user?.permissionGroups?.length || 0;
      log("GET /permissions/user/:userId/permissions", "✓ SUCCESS", `User now has ${groupCount} group(s)`, {
        groupNames: verifyRes.data.user?.permissionGroups?.map(g => g.name),
      });

      // 8. Update Direct Permissions
      const selectedPerms = permissions.slice(0, 2).map(p => p._id);
      log("PUT /permissions/users/:userId/permissions", "RUNNING", "Updating direct permissions...");
      await API.put(`/permissions/users/${testUserId}/permissions`, {
        directPermissions: selectedPerms,
      });
      log("PUT /permissions/users/:userId/permissions", "✓ SUCCESS", `Updated ${selectedPerms.length} direct permissions`);

      await sleep(500);

      // 9. Verify Direct Permissions Updated
      log("GET /permissions/user/:userId/permissions", "RUNNING", "Verifying direct permissions...");
      const verifyPermsRes = await API.get(`/permissions/user/${testUserId}/permissions`);
      const directCount = verifyPermsRes.data.user?.directPermissions?.length || 0;
      log("GET /permissions/user/:userId/permissions", "✓ SUCCESS", `User now has ${directCount} direct permission(s)`);

      // 10. Update Group
      const updatedName = `Updated Group ${Date.now()}`;
      log("PUT /permissions/groups/:id", "RUNNING", "Updating group...");
      await API.put(`/permissions/groups/${testGroupId}`, {
        name: updatedName,
        description: "Updated via automated test",
        permissions: permissions.slice(0, 2).map(p => p._id),
      });
      log("PUT /permissions/groups/:id", "✓ SUCCESS", `Group renamed to "${updatedName}"`);

      // 11. Remove User from Group
      log("POST /permissions/groups/remove-user", "RUNNING", "Removing user from group...");
      await API.post("/permissions/groups/remove-user", {
        userId: testUserId,
        groupId: testGroupId,
      });
      log("POST /permissions/groups/remove-user", "✓ SUCCESS", `${users[0].username} removed from group`);

      // 12. Cleanup - Delete Test Group
      log("DELETE /permissions/groups/:id", "RUNNING", "Deleting test group...");
      await API.delete(`/permissions/groups/${testGroupId}`);
      log("DELETE /permissions/groups/:id", "✓ SUCCESS", "Test group deleted");

      log("🎉 ALL TESTS", "COMPLETED", "All endpoint tests completed successfully!");
      toast.success("✅ All tests completed successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      const errorStatus = err.response?.status;
      log("❌ ERROR", "FAILED", `${errorStatus}: ${errorMsg}`, {
        endpoint: err.config?.url,
        method: err.config?.method?.toUpperCase(),
        requestBody: err.config?.data,
        responseBody: err.response?.data,
      });
      toast.error(`❌ Test failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Permission Endpoints Tester</h2>
      <p className="text-gray-600 mb-4">
        Tests all permission management endpoints
      </p>

      <button
        onClick={testAllEndpoints}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Running Tests..." : "Run All Tests"}
      </button>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        {testResults.length === 0 ? (
          <p className="text-gray-500 italic">No test results yet...</p>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border-l-4 ${
                  result.status === "SUCCESS"
                    ? "bg-green-50 border-green-500 text-green-900"
                    : result.status === "START"
                    ? "bg-blue-50 border-blue-500 text-blue-900"
                    : "bg-red-50 border-red-500 text-red-900"
                }`}
              >
                <div className="font-mono text-sm">
                  <span className="font-bold">[{result.endpoint}]</span> {result.status}:{" "}
                  {result.message}
                </div>
                <div className="text-xs text-gray-600 mt-1">{result.timestamp}</div>
                {result.data && (
                  <details className="mt-2 cursor-pointer">
                    <summary className="text-xs font-semibold">Details</summary>
                    <pre className="text-xs bg-white p-2 mt-1 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

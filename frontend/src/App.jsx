import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/DashBoard";
import EmployeeList from "./pages/EmployeeList";
import EmployeeEdit from "./pages/EmployeeEdit";
import UploadExcel from "./pages/UploadExcel";
import PrivateRoute from "./routes/PrivateRoute";
import Unauthorized from "./pages/Unauthorized";
import EmployeeVacations from "./pages/EmployeeVacations";
import EmployeeRewards from "./pages/EmployeeRewards";
import EmployeeIncidents from "./pages/EmployeeIncidents";
import { Toaster } from "react-hot-toast";
import Notifications from "./pages/Notifications";
import AdminNotifications from "./pages/AdminNotifications";
import { SocketProvider } from "./context/SocketContext";
import { SettingsProvider } from "./context/SettingsContext";
import PermissionsManager from "./pages/permissions/PermissionsManager";
import Dywan from "./pages/Dywan";
import Archieve from "./pages/Archieve";
import HomepageBuilder from "./pages/HomepageBuilder";
import Onboarding from "./pages/Onboarding";
import UserProfile from "./pages/UserProfile";
import DropdownManager from "./pages/DropdownManager";
import FileSharing from "./pages/FileSharing";
import UserNotifications from "./pages/UserNotifications";
import Circulars from "./pages/Circulars";
import Settings from "./pages/Settings";
import EmployeePenalties from "./pages/EmployeePenalties";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import PermissionGroupsPage from "./pages/permissions/PermissionGroupsPage";
import PermissionManager from "./pages/permissions/PermissionsManager";
import PermissionsPage from "./pages/permissions/PermissionsPage";
import Reports from "./components/Reports";
import RequirePermission from "./components/RequirePermission";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  console.log("===============token role=====================");
  console.log(token, role);
  console.log("====================================");

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role))
    return <Navigate to="/unauthorized" replace />;

  return children;
}

function App() {
  const role = localStorage.getItem("role");

  return (
    <SettingsProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster position="top-left" reverseOrder={false} />
          <Routes>
            {/* <Route
              path="/dashboard/employees/:id/vacations"
              element={<EmployeeVacations />}
            />
            <Route
              path="/dashboard/employees/:id/rewards"
              element={<EmployeeRewards />}
            />
            <Route
              path="/dashboard/employees/:id/incidents"
              element={<EmployeeIncidents />}
            /> */}

            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Unified Dashboard for Admin and User */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              {/* Default route */}
              <Route
                index
                element={
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10">
                    <div className="text-6xl mb-4">👋</div>
                    <h2 className="text-2xl font-bold mb-2">
                      مرحباً بك في لوحة التحكم
                    </h2>
                    <p>يرجى اختيار قسم من القائمة الجانبية للبدء</p>
                  </div>
                }
              />

              {/* Employees */}
              <Route
                path="employees"
                element={
                  <RequirePermission permission="employees.view">
                    <EmployeeList />
                  </RequirePermission>
                }
              />
              <Route
                path="employees/:id"
                element={
                  <RequirePermission permission="employees.edit">
                    <EmployeeEdit />
                  </RequirePermission>
                }
              />

              {/* Dywan */}
              <Route
                path="dywan"
                element={
                  <RequirePermission permission="dywan.receive_files">
                    <Dywan />
                  </RequirePermission>
                }
              />

              {/* Archive / Documents */}
              <Route
                path="archive"
                element={
                  <RequirePermission permission="documents.view">
                    <Archieve />
                  </RequirePermission>
                }
              />

              {/* Notifications */}
              <Route path="notifications" element={<Notifications />} />
              <Route
                path="admin-notifications"
                element={<AdminNotifications />}
              />

              {/* Settings */}
              <Route
                path="settings"
                element={
                  <RequirePermission permission="settings.view">
                    <Settings />
                  </RequirePermission>
                }
              />

              {/* Reports */}
              <Route
                path="reports"
                element={
                  <RequirePermission permission="reports.view">
                    <Reports />
                  </RequirePermission>
                }
              />

              {/* Upload / Database */}
              <Route
                path="upload"
                element={
                  <RequirePermission permission="employees.import">
                    <UploadExcel />
                  </RequirePermission>
                }
              />

              {/* Homepage Builder */}
              <Route
                path="homepage-builder"
                element={
                  <RequirePermission permission="homepage.edit_layout">
                    <HomepageBuilder />
                  </RequirePermission>
                }
              />

              {/* Dropdown Manager */}
              <Route
                path="dropdown-manager"
                element={
                  <RequirePermission permission="dropdowns.view">
                    <DropdownManager />
                  </RequirePermission>
                }
              />

              {/* Permissions Manager */}
              <Route
                path="test"
                element={
                  <RequirePermission permission="permissions.view">
                    <PermissionsManager />
                  </RequirePermission>
                }
              />
            </Route>

            {/* Redirect old routes to dashboard */}
            <Route path="/home" element={<Navigate to="/dashboard" />} />
            <Route
              path="/user/dashboard"
              element={<Navigate to="/dashboard" />}
            />
            <Route
              path="/employees"
              element={<Navigate to="/dashboard/employees" />}
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </SettingsProvider>
  );
}

export default App;

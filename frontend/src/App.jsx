import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
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
import DbRecovery from "./pages/DbRecovery";
import EmployeePenalties from "./pages/EmployeePenalties";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import PermissionGroupsPage from "./pages/permissions/PermissionGroupsPage";
import PermissionManager from "./pages/permissions/PermissionsManager";
import PermissionsPage from "./pages/permissions/PermissionsPage";
import Reports from "./components/Reports";
import RequirePermission from "./components/RequirePermission";
import WelcomeMessage from "./components/WelcomeMessage";
import Complaints from "./pages/Complaints";

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

  function AuthLogoutListener() {
    const navigate = useNavigate();

    useEffect(() => {
      const handler = () => {
        navigate("/login", { replace: true });
      };
      window.addEventListener("auth:logout", handler);
      return () => window.removeEventListener("auth:logout", handler);
    }, [navigate]);

    return null;
  }

  return (
    <SettingsProvider>
      <SocketProvider>
        <BrowserRouter>
          <AuthLogoutListener />
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
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                    "user",
                    "employee",
                    "viewer",
                    "hr",
                    "finance",
                  ]}
                >
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              {/* Dashboard Home */}
              <Route index element={<WelcomeMessage />} />

              {/* Circulars */}
              <Route path="circulars" element={<Circulars />} />

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
              {/* Profile under dashboard so layout (sidebar/navbar) stays visible */}
              <Route path="profile" element={<UserProfile />} />

              {/* Dywan */}
              <Route
                path="dywan"
                element={
                  <RequirePermission permission="dywan.view">
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
              <Route path="notifications" element={<UserNotifications />} />
              <Route
                path="operations-notifications"
                element={
                  <RequirePermission permission="notifications.view_all">
                    <Notifications />
                  </RequirePermission>
                }
              />
              <Route
                path="admin-notifications"
                element={<AdminNotifications />}
              />

              {/* Settings (available to all authenticated users; per-endpoint permissions enforced on backend) */}
              <Route path="settings" element={<Settings />} />

              {/* Database Recovery / Backup */}
              <Route
                path="db-recovery"
                element={
                  <RequirePermission permission="settings.backup">
                    <DbRecovery />
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

              {/* Complaints */}
              <Route
                path="complaints"
                element={
                  <RequirePermission permission="complaints.view">
                    <Complaints />
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

            {/* Redirect legacy /profile to dashboard profile */}
            <Route
              path="/profile"
              element={<Navigate to="/dashboard/profile" replace />}
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

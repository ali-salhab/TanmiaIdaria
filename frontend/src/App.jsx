import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/DashBoard";
import EmployeeList from "./pages/EmployeeList";
import EmployeeEdit from "./pages/EmployeeEdit";
import UploadExcel from "./pages/UploadExcel";
import PrivateRoute from "./routes/PrivateRoute";
import ViewerHome from "./pages/ViewerHome";
import Home from "./pages/Home";
import Unauthorized from "./pages/Unauthorized";
import EmployeeVacations from "./pages/EmployeeVacations";
import EmployeeRewards from "./pages/EmployeeRewards";
import EmployeeIncidents from "./pages/EmployeeIncidents";
import { Toaster } from "react-hot-toast";
import Notifications from "./pages/Notifications";
import { SocketProvider } from "./context/SocketContext";
import PermissionsManager from "./pages/PermissionsManager";
import Dywan from "./pages/Dywan";
import HomepageBuilder from "./pages/HomepageBuilder";
import Onboarding from "./pages/Onboarding";
import ViewerEmployeeList from "./pages/ViewerEmployeeList";
import ViewerDocuments from "./pages/ViewerDocuments";
import ViewerSalary from "./pages/ViewerSalary";
import UserProfile from "./pages/UserProfile";
import DropdownManager from "./pages/DropdownManager";
import FileSharing from "./pages/FileSharing";
import UserNotifications from "./pages/UserNotifications";
import Circulars from "./pages/Circulars";

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
    <SocketProvider>
      <BrowserRouter>
        <Toaster position="top-left" reverseOrder={false} />
        <Routes>
          <Route path="/test" eleme={PermissionsManager} />
          <Route
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
          />

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

          {/* Admin dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route path="notifications" element={<Notifications />} />
            <Route path="dywan" element={<Dywan />} />
            <Route path="employees/:id" element={<EmployeeEdit />} />
            <Route index element={<EmployeeList />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="upload" element={<UploadExcel />} />
            <Route path="homepage-builder" element={<HomepageBuilder />} />
            <Route path="dropdown-manager" element={<DropdownManager />} />
            <Route path="  " element={<PermissionsManager />} />
          </Route>

          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <ViewerEmployeeList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <ViewerDocuments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/salary"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <ViewerSalary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/file-sharing"
            element={
              <ProtectedRoute>
                <FileSharing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <UserNotifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/circulars"
            element={
              <ProtectedRoute>
                <Circulars />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="*"
            element={
              <Navigate
                to={role === "admin" ? "/dashboard" : "/home"}
                replace
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
// import UserProfiles from "./pages/UserProfiles";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
// import Home from "./pages/Dashboard/Home";
import EmployeeManagementPage from "./pages/admin/employee/EmployeeManagementPage";
import EmployeeFormPage from "./pages/admin/employee/EmployeeFormPage";
import EmployeeShowPage from "./pages/admin/employee/EmployeeShowPage";
import AuthGuard from "./AuthGuard";
import RoleGuard from "./RoleGuard";
import Forbidden from "./pages/OtherPage/Forbidden";
import AttendancePage from "./pages/employee/AttendancePage";
import { DialogProvider } from "./components/ui/AppDialog";
import LeaveManagementPage from "./pages/admin/leave/LeaveManagementPage";
import LeaveRequestDetailPage from "./pages/admin/leave/LeaveRequestDetailPage";
import LeavePage from "./pages/employee/LeavePage";
import LeaveRequestFormPage from "./pages/employee/LeaveRequestFormPage";
import AttendanceManagementPage from "./pages/admin/attendance/AttendanceManagementPage";
import DashboardEmployee from "./pages/employee/DashboardEmployee";
import EmployeeImportPage from "./pages/admin/employee/EmployeeImportPage";
import PayrollManagementPage from "./pages/admin/payroll/PayrollManagementPage";
import PayrollDetailPage from "./pages/admin/payroll/PayrollDetailPage";
import PayrollBatchDetailPage from "./pages/admin/payroll/PayrollBatchDetailPage";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import ReimbursementManagementPage from "./pages/admin/reimbursement/ReimbursementManagementPage";
import ReimbursementPage from "./pages/employee/ReimbursementPage";
import EditProfilePage from "./pages/employee/EditProfilePage";
export default function App() {
  return (
    <>
      <DialogProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }>
              
            {/* Others Page */}
            <Route path="/profile" element={<EditProfilePage />} />
            <Route path="/" element={<Blank />} />
            <Route path="/blank" element={<Blank />} />
            {/* employee page */}
            <Route path="/employee" element={<DashboardEmployee />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leave" element={<LeavePage />} />
            <Route path="/leave/request" element={<LeaveRequestFormPage />} />
            <Route path="/reimbursement-employee" element={<ReimbursementPage />} />


            {/* admin page */}
            <Route
              index
              path="/dashboard-admin"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <DashboardAdmin />
                </RoleGuard>
              }
            />
            <Route
              path="/employee-management"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <EmployeeManagementPage />
                </RoleGuard>
              }
            />
          
            <Route
              path="/employee-management/:id"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <EmployeeShowPage />
                </RoleGuard>
              }
            />

            <Route
              path="/employee-management/create"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <EmployeeFormPage />
                </RoleGuard>
              }
            />

            <Route
              path="/employee-management/edit/:id"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <EmployeeFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="/employee-management/import"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <EmployeeImportPage />
                </RoleGuard>
              }
            />

            <Route
              path="/leave-management"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <LeaveManagementPage />
                </RoleGuard>
              }
            />
            <Route
              path="/leave-management/leave-request/:id"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <LeaveRequestDetailPage />
                </RoleGuard>
              }
            />
             <Route
              path="/attendance-management"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <AttendanceManagementPage />
                </RoleGuard>
              }
            />
             <Route
              path="/payroll"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <PayrollManagementPage />
                </RoleGuard>
              }
            />
             <Route
              path="/payroll-slip/:id"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <PayrollDetailPage />
                </RoleGuard>
              }
            />
             <Route
              path="/payroll-detail/:id"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <PayrollBatchDetailPage />
                </RoleGuard>
              }
            />
             <Route
              path="/reimbursement"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <ReimbursementManagementPage />
                </RoleGuard>
              }
            />
     
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </DialogProvider>
    </>
  );
}

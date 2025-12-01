import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import RoleRoute from '../auth/RoleRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Signup from '../pages/Signup';
import Forbidden from '../pages/Forbidden';
import Dashboard from '../pages/Dashboard';
import Projects from '../pages/Projects';
import ProjectView from '../pages/Projects/ProjectView';
import Documents from '../pages/Documents';
import DocumentsCompanyList from '../pages/DocumentsCompanyList';
import DocumentsLibrary from '../pages/DocumentsLibrary';
import Finance from '../pages/Finance';
import FinanceInvoices from '../pages/Finance/Invoices';
import HR from '../pages/HR';
import HRProjectWiseReport from '../pages/HR/ProjectWiseReport';
import Admin from '../pages/Admin';
import Analytics from '../pages/Analytics';
import Layout from '../components/Layout';
import DashboardKPIs from '../pages/Dashboard/KPIs';
import DashboardActivities from '../pages/Dashboard/RecentActivities';
import DashboardNotifications from '../pages/Dashboard/Notifications';
import FinanceExpenses from '../pages/Finance/Expenses';
import FinanceExpensePage from '../pages/Finance/Expense';
import FinanceGeneralExpensePage from '../pages/Finance/GeneralExpense';
import FinanceManpowerExpensePage from '../pages/Finance/ManpowerExpense';
import CompanyEmployeeSalaryExpensePage from '../pages/Finance/CompanyEmployeeSalaryExpense';
import ExternalLabourExpensePage from '../pages/Finance/ExternalLabourExpense';
import FinanceBudgets from '../pages/Finance/Budgets';
import FinanceProfitLoss from '../pages/Finance/ProfitLoss';
import FinanceReports from '../pages/Finance/Reports';
import FinanceInvoicesPreviewPage from '../pages/Finance/FinanceInvoicesPreview';
import FinanceExpenseInvoicePreviewPage from '../pages/Finance/FinanceExpenseInvoicePreview';
import FinanceGeneralExpensePreviewPage from '../pages/Finance/FinanceGeneralExpensePreview';
import FinanceCompanySalaryPreviewPage from '../pages/Finance/FinanceCompanySalaryPreview';
import FinanceExternalLabourPreviewPage from '../pages/Finance/FinanceExternalLabourPreview';
import HRAttendance from '../pages/HR/Attendance';
import HRAttendanceManpowerSupplier from '../pages/HR/ManpowerSupplier';
import HRAttendanceManpowerSupplierAddRecords from '../pages/HR/ManpowerSupplierAddRecords';
import HRAttendanceEntry from '../pages/HR/AttendanceEntry';
import HRAttendanceRecords from '../pages/HR/AttendanceRecords';
import HRAttendanceEmployeeMonthly from '../pages/HR/AttendanceEmployeeMonthly';
import HREmployees from '../pages/HR/Employees';
import HRPayroll from '../pages/HR/Payroll';
import HRPayrollDetails from '../pages/HR/PayrollDetails';
import { PermissionRoute } from '../auth/PermissionRoute';
import MaterialDelivery from '../pages/Projects/MaterialDelivery';
import AdminUsers from '../pages/Admin/Users';
import AdminRoles from '../pages/Admin/RolesPermissions';
import AdminLogs from '../pages/Admin/SystemLogs';
import AdminSettings from '../pages/Admin/AppSettings';
import AdminSync from '../pages/Admin/SyncStatus';
import AdminBackup from '../pages/Admin/Backup';
import AnalyticsFinancial from '../pages/Analytics/FinancialAnalytics';
import AnalyticsEmployee from '../pages/Analytics/EmployeeAnalytics';
import AnalyticsProject from '../pages/Analytics/ProjectPerformance';
import AnalyticsReports from '../pages/Analytics/BusinessReports';
import AnalyticsBuilder from '../pages/Analytics/ReportBuilder';
import UtilNotifications from '../pages/Utility/NotificationsCenter';
import UtilCalendar from '../pages/Utility/Calendar';
import UtilDocuments from '../pages/Utility/Documents';
import UtilHelp from '../pages/Utility/SupportHelp';
import UtilProfile from '../pages/Utility/ProfileSettings';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/403" element={<Forbidden />} />
        <Route element={<ProtectedRoute />}> 
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          {/* Projects (ADMIN, GM, PROJECT_MANAGER, ACCOUNTANT, MANAGER, Team Leader) */}
          <Route element={<RoleRoute allow={["ADMIN","GM","PROJECT_MANAGER","ACCOUNTANT", "MANAGER", "Team Leader", "Office Desk", "Recorder"]} />}> 
            <Route path="/projects" element={<Layout><Projects /></Layout>} />
            <Route path="/projects/view/:id" element={<Layout><ProjectView /></Layout>} />
            {/* Projects subpage: Material Delivery */}
            <Route path="/projects/:id/material-delivery" element={<Layout><MaterialDelivery /></Layout>} />
          </Route>
          {/* Documents (ADMIN, GM, ACCOUNTANT,MANAGER, Team Leader) */}
          <Route element={<RoleRoute allow={["ADMIN","GM","ACCOUNTANT","MANAGER", "Team Leader", "Office Desk", "Recorder"]} />}> 
            <Route path="/documents-main" element={<Layout><Documents /></Layout>} />
            <Route path="/documents-main/company-list" element={<Layout><DocumentsCompanyList /></Layout>} />
            <Route path="/documents-main/documents" element={<Layout><DocumentsLibrary /></Layout>} />
          </Route>
          {/* Finance (ADMIN, GM, FINANCE_MANAGER, ACCOUNTANT,MANAGER, Team Leader) */}
          <Route element={<RoleRoute allow={["ADMIN","GM","FINANCE_MANAGER","ACCOUNTANT","MANAGER", "Team Leader", "Office Desk", "Recorder"]} />}> 
            <Route path="/finance" element={<Layout><Finance /></Layout>} />
            <Route path="/finance/invoices" element={<Layout><FinanceInvoices /></Layout>} />
            {/* Finance subpages */}
            <Route path="/finance/expenses" element={<Layout><FinanceExpenses /></Layout>} />
            <Route path="/finance/expenses/expense" element={<Layout><FinanceExpensePage /></Layout>} />
            <Route path="/finance/expenses/general" element={<Layout><FinanceGeneralExpensePage /></Layout>} />
            <Route path="/finance/expenses/manpower" element={<Layout><FinanceManpowerExpensePage /></Layout>} />
            <Route path="/finance/expenses/company-employee-salary" element={<Layout><CompanyEmployeeSalaryExpensePage /></Layout>} />
            <Route path="/finance/expenses/manpower/external-labour-expense" element={<Layout><ExternalLabourExpensePage /></Layout>} />
            <Route path="/finance/budgets" element={<Layout><FinanceBudgets /></Layout>} />
            <Route path="/finance/profit-loss" element={<Layout><FinanceProfitLoss /></Layout>} />
            <Route path="/finance/reports" element={<Layout><FinanceReports /></Layout>} />
            {/* Finance read-only preview pages */}
            <Route path="/finance/preview/invoices" element={<Layout><FinanceInvoicesPreviewPage /></Layout>} />
            <Route path="/finance/preview/expense-invoice" element={<Layout><FinanceExpenseInvoicePreviewPage /></Layout>} />
            <Route path="/finance/preview/general-expense" element={<Layout><FinanceGeneralExpensePreviewPage /></Layout>} />
            <Route path="/finance/preview/company-employee-salary" element={<Layout><FinanceCompanySalaryPreviewPage /></Layout>} />
            <Route path="/finance/preview/external-labour-expense" element={<Layout><FinanceExternalLabourPreviewPage /></Layout>} />
          </Route>
          {/* HR (ADMIN, GM, HR_MANAGER, ACCOUNTANT,MANAGER, Team Leader) */}
          <Route element={<RoleRoute allow={["ADMIN","GM","HR_MANAGER","ACCOUNTANT","MANAGER", "Team Leader", "Office Desk", "Recorder"]} />}> 
            <Route
              path="/hr"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.View">
                    <HR />
                  </PermissionRoute>
                </Layout>
              )}
            />
            {/* HR subpages */}
            <Route
              path="/hr/attendance"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Attendance.View">
                    <HRAttendance />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/attendance/entry"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Attendance.Entry.View">
                    <HRAttendanceEntry />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/attendance/records"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Attendance.Records.View">
                    <HRAttendanceRecords />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/attendance/manpower-supplier"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Attendance.ManpowerSupplier.View">
                    <HRAttendanceManpowerSupplier />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/attendance/manpower-supplier/add-records"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Attendance.ManpowerSupplier.View">
                    <HRAttendanceManpowerSupplierAddRecords />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/attendance/employee/:employeeId"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Attendance.Records.View">
                    <HRAttendanceEmployeeMonthly />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/employees"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Employees.View">
                    <HREmployees />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/payroll"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Payroll.View">
                    <HRPayroll />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/payroll/:employeeId/:emiratesId"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.Payroll.Details.View">
                    <HRPayrollDetails />
                  </PermissionRoute>
                </Layout>
              )}
            />
            <Route
              path="/hr/project-wise-report"
              element={(
                <Layout>
                  <PermissionRoute permission="HR.View">
                    <HRProjectWiseReport />
                  </PermissionRoute>
                </Layout>
              )}
            />
          </Route>
          {/* Admin overview: ADMIN, GM, SUPERADMIN */}
          <Route element={<RoleRoute allow={["ADMIN","GM","SUPERADMIN", "Office Desk"]} />}> 
            <Route path="/admin" element={<Layout><Admin /></Layout>} />
          </Route>
          {/* Admin management subpages: ADMIN, SUPERADMIN only */}
          <Route element={<RoleRoute allow={["ADMIN","SUPERADMIN"]} />}> 
            <Route path="/admin/users" element={<Layout><AdminUsers /></Layout>} />
            <Route path="/admin/roles" element={<Layout><AdminRoles /></Layout>} />
            <Route path="/admin/logs" element={<Layout><AdminLogs /></Layout>} />
            <Route path="/admin/settings" element={<Layout><AdminSettings /></Layout>} />
            <Route path="/admin/sync" element={<Layout><AdminSync /></Layout>} />
            <Route path="/admin/backup" element={<Layout><AdminBackup /></Layout>} />
          </Route>
          {/* Analytics (ADMIN, GM, SUPERADMIN, Team Leader) */}
          <Route element={<RoleRoute allow={["ADMIN","GM","SUPERADMIN", "Team Leader", "Office Desk"]} />}> 
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
            <Route path="/analytics/overview" element={<Layout><Analytics /></Layout>} />
            {/* Analytics subpages */}
            <Route path="/analytics/financial" element={<Layout><AnalyticsFinancial /></Layout>} />
            <Route path="/analytics/employee" element={<Layout><AnalyticsEmployee /></Layout>} />
            <Route path="/analytics/projects" element={<Layout><AnalyticsProject /></Layout>} />
            <Route path="/analytics/reports" element={<Layout><AnalyticsReports /></Layout>} />
            <Route path="/analytics/builder" element={<Layout><AnalyticsBuilder /></Layout>} />
            <Route path="/analytics/custom" element={<Layout><AnalyticsBuilder /></Layout>} />
          </Route>
          {/** Dashboard subpages */}
          <Route path="/dashboard/kpis" element={<Layout><DashboardKPIs /></Layout>} />
          <Route path="/dashboard/activities" element={<Layout><DashboardActivities /></Layout>} />
          <Route path="/dashboard/notifications" element={<Layout><DashboardNotifications /></Layout>} />
          {/** Utility pages */}
          <Route path="/notifications" element={<Layout><UtilNotifications /></Layout>} />
          <Route path="/calendar" element={<Layout><UtilCalendar /></Layout>} />
          <Route path="/documents" element={<Layout><UtilDocuments /></Layout>} />
          <Route path="/help" element={<Layout><UtilHelp /></Layout>} />
          <Route path="/profile" element={<Layout><UtilProfile /></Layout>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

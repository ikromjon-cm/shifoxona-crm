import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import Layout from '@/components/layout/Layout'
import PharmacyLayout from '@/components/layout/PharmacyLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const MedicinesPage = lazy(() => import('@/pages/medicines/MedicinesPage'))
const CategoriesPage = lazy(() => import('@/pages/medicines/CategoriesPage'))
const SuppliersPage = lazy(() => import('@/pages/medicines/SuppliersPage'))
const PharmaciesPage = lazy(() => import('@/pages/pharmacies/PharmaciesPage'))
const PharmacyDetailPage = lazy(() => import('@/pages/pharmacies/PharmacyDetailPage'))
const PharmacyApprovalPage = lazy(() => import('@/pages/pharmacies/PharmacyApprovalPage'))
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'))
const IncomePage = lazy(() => import('@/pages/warehouse/IncomePage'))
const ExpensePage = lazy(() => import('@/pages/warehouse/ExpensePage'))
const MovementsPage = lazy(() => import('@/pages/warehouse/MovementsPage'))
const DeliveryPage = lazy(() => import('@/pages/warehouse/DeliveryPage'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'))
const AuditLogsPage = lazy(() => import('@/pages/audit-logs/AuditLogsPage'))
const UsersPage = lazy(() => import('@/pages/users/UsersPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const TasksPage = lazy(() => import('@/pages/tasks/TasksPage'))
const TaskDetailPage = lazy(() => import('@/pages/tasks/TaskDetailPage'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'))
const WarehouseBinsPage = lazy(() => import('@/pages/warehouse/WarehouseBinsPage'))
const PickOrdersPage = lazy(() => import('@/pages/warehouse/PickOrdersPage'))
const RolesPage = lazy(() => import('@/pages/rbac/RolesPage'))

const PharmacyRegisterPage = lazy(() => import('@/pages/pharmacy/PharmacyRegisterPage'))
const PharmacyLoginPage = lazy(() => import('@/pages/pharmacy/PharmacyLoginPage'))
const PharmacyDashboardPage = lazy(() => import('@/pages/pharmacy/PharmacyDashboardPage'))
const PharmacyCatalogPage = lazy(() => import('@/pages/pharmacy/PharmacyCatalogPage'))
const CartPage = lazy(() => import('@/pages/pharmacy/CartPage'))
const PharmacyOrderDetailPage = lazy(() => import('@/pages/pharmacy/PharmacyOrderDetailPage'))
const PharmacyNotificationsPage = lazy(() => import('@/pages/pharmacy/PharmacyNotificationsPage'))
const PharmacyProfilePage = lazy(() => import('@/pages/pharmacy/PharmacyProfilePage'))
const PharmacyOrdersPage = lazy(() => import('@/pages/pharmacy/PharmacyOrdersPage'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
              },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/pharmacy/register" element={<PharmacyRegisterPage />} />
              <Route path="/pharmacy/login" element={<PharmacyLoginPage />} />

              <Route
                path="/pharmacy"
                element={
                  <ProtectedRoute pharmacyOnly>
                    <PharmacyLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PharmacyDashboardPage />} />
                <Route path="catalog" element={<PharmacyCatalogPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="orders" element={<PharmacyOrdersPage />} />
                <Route path="orders/:id" element={<PharmacyOrderDetailPage />} />
                <Route path="notifications" element={<PharmacyNotificationsPage />} />
                <Route path="profile" element={<PharmacyProfilePage />} />
              </Route>

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="medicines" element={<MedicinesPage />} />
                <Route path="medicines/categories" element={<CategoriesPage />} />
                <Route path="medicines/suppliers" element={<SuppliersPage />} />
                <Route path="pharmacies" element={<PharmaciesPage />} />
                <Route path="pharmacies/:id" element={<PharmacyDetailPage />} />
                <Route path="pharmacies/approval" element={<PharmacyApprovalPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="warehouse/income" element={<IncomePage />} />
                <Route path="warehouse/expense" element={<ExpensePage />} />
                <Route path="warehouse/movements" element={<MovementsPage />} />
                <Route path="warehouse/delivery" element={<DeliveryPage />} />
                <Route path="warehouse/bins" element={<WarehouseBinsPage />} />
                <Route path="warehouse/pick-orders" element={<PickOrdersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="tasks/:id" element={<TaskDetailPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="roles" element={<RolesPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

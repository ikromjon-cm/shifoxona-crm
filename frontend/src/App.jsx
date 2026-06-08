import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import Layout from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import MedicinesPage from '@/pages/medicines/MedicinesPage'
import CategoriesPage from '@/pages/medicines/CategoriesPage'
import SuppliersPage from '@/pages/medicines/SuppliersPage'
import PharmaciesPage from '@/pages/pharmacies/PharmaciesPage'
import PharmacyDetailPage from '@/pages/pharmacies/PharmacyDetailPage'
import InventoryPage from '@/pages/inventory/InventoryPage'
import IncomePage from '@/pages/warehouse/IncomePage'
import ExpensePage from '@/pages/warehouse/ExpensePage'
import MovementsPage from '@/pages/warehouse/MovementsPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import AuditLogsPage from '@/pages/audit-logs/AuditLogsPage'
import UsersPage from '@/pages/users/UsersPage'
import SettingsPage from '@/pages/settings/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="medicines" element={<MedicinesPage />} />
              <Route path="medicines/categories" element={<CategoriesPage />} />
              <Route path="medicines/suppliers" element={<SuppliersPage />} />
              <Route path="pharmacies" element={<PharmaciesPage />} />
              <Route path="pharmacies/:id" element={<PharmacyDetailPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="warehouse/income" element={<IncomePage />} />
              <Route path="warehouse/expense" element={<ExpensePage />} />
              <Route path="warehouse/movements" element={<MovementsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute requireAdmin>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute requireAdmin>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/providers/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import Index from './pages/Index'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProfessionalArea from './pages/ProfessionalArea'
import PatientDetail from './pages/admin/PatientDetail'
import Patients from './pages/admin/Patients'
import ProfessionalDetail from './pages/admin/ProfessionalDetail'
import NotFound from './pages/NotFound'
import ClientAreaUnavailable from './pages/ClientAreaUnavailable'
import AccessDenied from './pages/AccessDenied'
import ProfessionalPatientDetail from './pages/professional/PatientDetail'
import NotificationsPage from './pages/professional/Notifications'
import AdminDashboard from './pages/AdminDashboard'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

console.log('App.tsx: Initializing application...')

const App = () => (
  <ErrorBoundary>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes - Use PublicLayout to isolate from authenticated header logic */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/cliente-indisponivel"
                element={<ClientAreaUnavailable />}
              />
              <Route path="/access-denied" element={<AccessDenied />} />
            </Route>

            {/* Protected Routes - Structure Refactoring */}
            {/* We wrap the Layout with ProtectedRoute to ensure authentication before any layout rendering */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Index Route - Controller for redirection */}
              <Route path="/" element={<Index />} />

              {/* Admin Routes - Strictly Admin Only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pacientes"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Patients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pacientes/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PatientDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/profissionais/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ProfessionalDetail />
                  </ProtectedRoute>
                }
              />

              {/* Professional Routes - Accessible by Professional and Admin */}
              <Route
                path="/profissional"
                element={
                  <ProtectedRoute allowedRoles={['professional', 'admin']}>
                    <ProfessionalArea />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profissional/pacientes/:id"
                element={
                  <ProtectedRoute allowedRoles={['professional', 'admin']}>
                    <ProfessionalPatientDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profissional/notifications"
                element={
                  <ProtectedRoute allowedRoles={['professional', 'admin']}>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
)

export default App

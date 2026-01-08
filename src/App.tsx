/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/providers/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/Layout'
import Index from './pages/Index'
import Login from './pages/Login'
import Register from './pages/Register'
import ProfessionalArea from './pages/ProfessionalArea'
import PatientDetail from './pages/admin/PatientDetail'
import Patients from './pages/admin/Patients'
import ProfessionalDetail from './pages/admin/ProfessionalDetail'
import NotFound from './pages/NotFound'
import ClientAreaUnavailable from './pages/ClientAreaUnavailable'
import AccessDenied from './pages/AccessDenied'
import ProfessionalPatientDetail from './pages/professional/PatientDetail'
import NotificationsPage from './pages/professional/Notifications'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            {/* Index Route - Accessible by Admin and Professional (redirects) */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['admin', 'professional']}>
                  <Index />
                </ProtectedRoute>
              }
            />

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/cliente-indisponivel"
              element={<ClientAreaUnavailable />}
            />
            <Route path="/access-denied" element={<AccessDenied />} />

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

            {/* Admin Routes - Strictly Admin Only */}
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App

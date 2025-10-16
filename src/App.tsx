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
import ProfessionalDetail from './pages/admin/ProfessionalDetail'
import NotFound from './pages/NotFound'
import ClientAreaUnavailable from './pages/ClientAreaUnavailable'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/cliente-indisponivel"
              element={<ClientAreaUnavailable />}
            />
            <Route
              path="/profissional"
              element={
                <ProtectedRoute>
                  <ProfessionalArea />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pacientes/:id"
              element={
                <ProtectedRoute>
                  <PatientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profissionais/:id"
              element={
                <ProtectedRoute>
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

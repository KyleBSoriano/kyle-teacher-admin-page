import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import EditClassPage from "./pages/EditClassPage";
import ClassesPage from "./pages/ClassesPage";
import CreateClassPage from "./pages/CreateClassPage";
import StudentsPage from "./pages/StudentsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminAppsPage from "./pages/admin/AdminAppsPage";
import AdminHelpPage from "./pages/admin/AdminHelpPage";
import SettingsPage from "./pages/SettingsPage";


import ConfirmAttendancePage from "./pages/ConfirmAttendancePage";
import StudentMobilePage from "./pages/StudentMobilePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { TutorialProvider } from "./context/TutorialContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import { TutorialOverlay } from "./components/tutorial/TutorialOverlay";
import HelpPage from "./pages/HelpPage";

const queryClient = new QueryClient();

// Protected route wrapper that requires authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  
  // Show loading while checking authentication (only on initial load when user is null)
  // Wait for loading to complete before making any redirect decisions
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#012D68] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#012D68]">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect to auth if we're done loading and not authenticated
  // This prevents redirecting during the auth check on page reload
  // The key is waiting for isLoading to be false before checking isAuthenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Admin route wrapper that requires admin role
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, role, user } = useAuthContext();
  
  // Show loading while checking authentication (only on initial load when user is null)
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#012D68] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#012D68]">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect if we're done loading and not authenticated
  // This prevents redirecting during the auth check on page reload
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Only check role after loading is complete
  if (!isLoading && role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  console.log('App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* COMPLETELY PUBLIC ROUTES - NO AUTH CONTEXT */}
            <Route path="/confirm-attendance/:classId" element={<ConfirmAttendancePage />} />
            <Route path="/student/:classId" element={<StudentMobilePage />} />
            
            {/* All other routes require auth context */}
            <Route path="/*" element={
              <AuthProvider>
                <ScheduleProvider>
                  <AppProvider>
                    <TutorialProvider>
                      <Routes>
                      {/* Auth route - for unauthenticated users */}
                      <Route path="/auth" element={<AuthPage />} />
                      
                      {/* Protected routes - require authentication */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <MainLayout><Outlet /></MainLayout>
                        </ProtectedRoute>
                      }>
                        <Route index element={<ClassesPage />} />
                        <Route path="classes" element={<Navigate to="/" replace />} />
                        <Route path="classes/new" element={<CreateClassPage />} />
                        <Route path="classes/:id/edit" element={<EditClassPage />} />
                        
                        <Route path="students" element={<StudentsPage />} />
                        
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="help" element={<HelpPage />} />
                      </Route>
                      
                      {/* Admin routes - require authentication AND admin role */}
                      <Route path="/admin" element={
                        <AdminRoute>
                          <AdminLayout><Outlet /></AdminLayout>
                        </AdminRoute>
                      }>
                        <Route index element={<AdminDashboard />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                        <Route path="schedule" element={<AdminSchedulePage />} />
                        <Route path="apps" element={<AdminAppsPage />} />
                        <Route path="students" element={<AdminStudentsPage />} />
                        <Route path="help" element={<AdminHelpPage />} />
                      </Route>
                      
                      {/* Catch all for main routes */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <TutorialOverlay />
                  </TutorialProvider>
                </AppProvider>
              </ScheduleProvider>
            </AuthProvider>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
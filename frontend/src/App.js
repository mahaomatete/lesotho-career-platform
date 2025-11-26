import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';

import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './styles/theme';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Pages
import Dashboard from './pages/common/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import InstituteDashboard from './pages/institute/InstituteDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import CompanyDashboard from './pages/company/CompanyDashboard';

// Admin Pages
import AdminInstitutions from './pages/admin/AdminInstitutions';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminStudents from './pages/admin/AdminStudents';
import AdminReports from './pages/admin/AdminReports';

// Institute Pages
import InstituteCourses from './pages/institute/InstituteCourses';
import InstituteApplications from './pages/institute/InstituteApplications';
import InstituteFaculties from './pages/institute/InstituteFaculties';
import InstituteStudents from './pages/institute/InstituteStudents';

// Student Pages
import StudentCourses from './pages/student/StudentCourses';
import StudentApplications from './pages/student/StudentApplications';
import StudentJobs from './pages/student/StudentJobs';
import StudentDocuments from './pages/student/StudentDocuments';

// Company Pages
import CompanyJobs from './pages/company/CompanyJobs';
import CompanyApplications from './pages/company/CompanyApplications';
import CompanyCandidates from './pages/company/CompanyCandidates';

// Common Pages
import Profile from './pages/common/Profile';

// Simple loading component
const AppLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
    <Typography variant="body1" sx={{ ml: 2 }}>
      Loading...
    </Typography>
  </Box>
);

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('🔄 AppContent rendering:', { 
    isAuthenticated, 
    user: user?.role,
    loading 
  });

  if (loading) {
    return <AppLoader />;
  }

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'institute':
        return <InstituteDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'company':
        return <CompanyDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Protected Routes with Layout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                {getDashboardComponent()}
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/institutions" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminInstitutions />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/companies" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminCompanies />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/students" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminStudents />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminReports />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Institute Routes */}
        <Route 
          path="/institute/courses" 
          element={
            <ProtectedRoute requiredRole="institute">
              <Layout>
                <InstituteCourses />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/institute/applications" 
          element={
            <ProtectedRoute requiredRole="institute">
              <Layout>
                <InstituteApplications />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/institute/faculties" 
          element={
            <ProtectedRoute requiredRole="institute">
              <Layout>
                <InstituteFaculties />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/institute/students" 
          element={
            <ProtectedRoute requiredRole="institute">
              <Layout>
                <InstituteStudents />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Student Routes */}
        <Route 
          path="/student/courses" 
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <StudentCourses />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/applications" 
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <StudentApplications />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/jobs" 
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <StudentJobs />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/documents" 
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <StudentDocuments />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Company Routes */}
        <Route 
          path="/company/jobs" 
          element={
            <ProtectedRoute requiredRole="company">
              <Layout>
                <CompanyJobs />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/company/applications" 
          element={
            <ProtectedRoute requiredRole="company">
              <Layout>
                <CompanyApplications />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/company/candidates" 
          element={
            <ProtectedRoute requiredRole="company">
              <Layout>
                <CompanyCandidates />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Common Routes */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  console.log('🎬 App component mounting...');

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
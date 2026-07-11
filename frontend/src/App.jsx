import { Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./components/common/Toast.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import DocsPage from "./pages/DocsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PromptsPage from "./pages/PromptsPage.jsx";
import GroupsPage from "./pages/GroupsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import TrashPage from "./pages/TrashPage.jsx";
import OAuthCallbackPage from "./pages/OAuthCallbackPage.jsx";

function HomeGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1A1B22]">
        <div className="w-5 h-5 border-2 border-[#714B67]/30 border-t-[#714B67] rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<HomeGate />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="prompts" element={<PromptsPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="trash" element={<TrashPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
    </MotionConfig>
  );
}

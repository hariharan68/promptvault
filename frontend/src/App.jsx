import { Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { MarketingThemeProvider } from "./context/MarketingThemeContext.jsx";
import { ToastProvider } from "./components/common/Toast.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import FeaturesPage from "./pages/FeaturesPage.jsx";
import CliPage from "./pages/CliPage.jsx";
import DocsPage from "./pages/DocsPage.jsx";
import HowItWorksPage from "./pages/HowItWorksPage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PromptsPage from "./pages/PromptsPage.jsx";
import GroupsPage from "./pages/GroupsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import TrashPage from "./pages/TrashPage.jsx";
import OAuthCallbackPage from "./pages/OAuthCallbackPage.jsx";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <MarketingThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/features" replace />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/cli" element={<CliPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/pricing" element={<PricingPage />} />
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
        </AuthProvider>
      </ToastProvider>
      </MarketingThemeProvider>
    </ThemeProvider>
    </MotionConfig>
  );
}

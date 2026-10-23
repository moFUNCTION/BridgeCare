import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import { useUser } from "@repo/react-appwrite";
import { useTranslation } from "react-i18next";
import { RiHeartPulseFill } from "react-icons/ri";

import { isVerificationSkipped } from "./lib/cookies";
import AuthLayout from "./Pages/Auth/Layout";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import ForgotPassword from "./Pages/Auth/ForgotPassword";
import VerifyEmail from "./Pages/Auth/VerifyEmail";
import Dashboard from "./Pages/Dashboard";
import PortalLayout from "./components/PortalLayout";
import UserProfile from "./Pages/Portal/UserProfile";
import UserSettings from "./Pages/Portal/UserSettings";
import PasswordSecurity from "./Pages/Portal/PasswordSecurity";
import AiChat from "./Pages/Portal/AiChat";
import AiReports from "./Pages/Portal/AiReports";
import MentalDetectorGames from "./Pages/Portal/MentalDetectorGames";
import OnlineEra from "./Pages/Portal/OnlineEra";
import CommunityPosts from "./Pages/Portal/CommunityPosts";
import CommunityViral from "./Pages/Portal/CommunityViral";
import CommunityNotifications from "./Pages/Portal/CommunityNotifications";
import TherapistsDirectory from "./Pages/Portal/TherapistsDirectory";
import LatestSessions from "./Pages/Portal/LatestSessions";
import Billing from "./Pages/Portal/Billing";

/**
 * Modern Loading Screen while evaluating user session
 */
const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Flex
      minH="100vh"
      w="100%"
      align="center"
      justify="center"
      bg="bg"
      color="fg"
      direction="column"
      gap="4"
    >
      <Flex
        alignItems="center"
        justifyContent="center"
        w="16"
        h="16"
        borderRadius="2xl"
        bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
        color="white"
        boxShadow="0 8px 24px rgba(234, 88, 12, 0.35)"
        animation="pulse 2s infinite"
      >
        <RiHeartPulseFill size={32} />
      </Flex>
      <VStack gap="2">
        <Text fontSize="lg" fontWeight="bold">
          {t("brand.name")}
        </Text>
        <Spinner size="sm" color="orange.500" />
      </VStack>
    </Flex>
  );
};

/**
 * Protected Route Wrapper
 * Requires user to be authenticated AND either have verified their email address
 * or explicitly skipped verification via cookie.
 * If authenticated but unverified and not skipped, redirects to `/auth/verify-email`.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useUser();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // If authenticated but email is unverified and not skipped via cookie, enforce verification
  if (user && !user.emailVerification && !isVerificationSkipped()) {
    return (
      <Navigate
        to={`/auth/verify-email?email=${encodeURIComponent(user.email || "")}&userId=${user.$id}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

/**
 * Guest Route Wrapper (for Login, Register, Forgot Password)
 * - If user is unauthenticated -> renders page
 * - If user is authenticated and unverified (and not skipped) -> redirects to `/auth/verify-email`
 * - If user is authenticated and verified (or skipped) -> redirects to `/` (Dashboard)
 */
interface GuestOnlyRouteProps {
  children: React.ReactNode;
}

const GuestOnlyRoute: React.FC<GuestOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useUser();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    if (user && !user.emailVerification && !isVerificationSkipped()) {
      return (
        <Navigate
          to={`/auth/verify-email?email=${encodeURIComponent(user.email || "")}&userId=${user.$id}`}
          replace
        />
      );
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * Verify Email Route Wrapper
 * - If user is authenticated and verified -> redirects to `/`
 * - If user is unauthenticated or authenticated-unverified -> permits access
 */
interface VerifyEmailRouteProps {
  children: React.ReactNode;
}

const VerifyEmailRoute: React.FC<VerifyEmailRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useUser();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && user?.emailVerification) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth/login" replace />} />
        <Route
          path="login"
          element={
            <GuestOnlyRoute>
              <Login />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="register"
          element={
            <GuestOnlyRoute>
              <Register />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="forget-password"
          element={
            <GuestOnlyRoute>
              <ForgotPassword />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="forgot-password"
          element={<Navigate to="/auth/forget-password" replace />}
        />
        <Route
          path="verify-email"
          element={
            <VerifyEmailRoute>
              <VerifyEmail />
            </VerifyEmailRoute>
          }
        />
      </Route>

      {/* Main Authenticated App */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* User Routes */}
        <Route path="user/profile" element={<UserProfile />} />
        <Route path="user/settings" element={<UserSettings />} />
        <Route path="user/security" element={<PasswordSecurity />} />

        {/* AI Therapist Routes */}
        <Route path="ai-therapist/chat" element={<AiChat />} />
        <Route path="ai-therapist/reports" element={<AiReports />} />

        {/* Games Routes */}
        <Route path="games/detector" element={<MentalDetectorGames />} />
        <Route path="games/era" element={<OnlineEra />} />

        {/* Community Routes */}
        <Route path="community/posts" element={<CommunityPosts />} />
        <Route path="community/viral" element={<CommunityViral />} />
        <Route path="community/notifications" element={<CommunityNotifications />} />

        {/* Sessions Routes */}
        <Route path="sessions/therapists" element={<TherapistsDirectory />} />
        <Route path="sessions/latest" element={<LatestSessions />} />
        <Route path="sessions/billing" element={<Billing />} />

        {/* Fallback child */}
        <Route path="*" element={<Dashboard />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

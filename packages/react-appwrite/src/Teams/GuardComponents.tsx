import React from "react";
import { useUser } from "../Auth/useUser";
import { useTeams } from "./useTeams";

export interface GuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export const RequireAuth: React.FC<GuardProps> = ({
  children,
  fallback = null,
  loadingFallback = null,
}) => {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const RequireGuest: React.FC<GuardProps> = ({
  children,
  fallback = null,
  loadingFallback = null,
}) => {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export interface HasRoleProps extends GuardProps {
  role: string;
}

export const HasRole: React.FC<HasRoleProps> = ({
  role,
  children,
  fallback = null,
  loadingFallback = null,
}) => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!user || !Array.isArray(user.labels) || !user.labels.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export interface HasTeamProps extends GuardProps {
  teamId: string;
  role?: string;
}

export const HasTeam: React.FC<HasTeamProps> = ({
  teamId,
  role,
  children,
  fallback = null,
  loadingFallback = null,
}) => {
  const { teams, loading } = useTeams();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  const team = teams.find((t) => t.$id === teamId);
  if (!team) {
    return <>{fallback}</>;
  }

  const teamRoles = (team as any).roles || [];
  if (role && Array.isArray(teamRoles) && teamRoles.length > 0 && !teamRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

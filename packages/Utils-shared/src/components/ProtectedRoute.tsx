import type React from "react";
import { ProgressCircle } from "@chakra-ui/react";
import { Navigate, useLocation } from "react-router-dom";

export interface ProtectedRouteProps {
  condition: boolean;
  navigate: { to: string; message?: string };
  children: React.ReactNode;
  isLoading?: boolean;
}

/**
 * Protects a route: shows loading spinner or redirects when condition is false.
 * Requires @chakra-ui/react and react-router-dom.
 */
export function ProtectedRoute({
  condition,
  navigate: { to, message },
  children,
  isLoading = false,
}: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();

  if (isLoading) {
    return (
      <ProgressCircle.Root
        colorPalette="blue"
        pos="fixed"
        top="50%"
        left="50%"
        css={{ translate: "-50% -50%" }}
        value={null}
      >
        <ProgressCircle.Circle css={{ "--thickness": "2px" }}>
          <ProgressCircle.Track />
          <ProgressCircle.Range />
        </ProgressCircle.Circle>
      </ProgressCircle.Root>
    );
  }

  if (condition) {
    return <>{children}</>;
  }

  // Prevent self-redirect loop if destination is identical to current path
  if (to === location.pathname) {
    return <>{children}</>;
  }

  return <Navigate to={to} state={{ message, from: location }} replace />;
}

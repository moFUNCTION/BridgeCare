import { useMemo } from "react";
import { useUser } from "../Auth/useUser";
import { useTeams } from "./useTeams";

export function usePermissions(documentPermissions: string[] = []) {
  const { user } = useUser();
  const { teams } = useTeams();

  const userRoles = useMemo(() => {
    const roles = new Set<string>();
    roles.add("any");

    if (user) {
      roles.add("users");
      roles.add(`user:${user.$id}`);
      roles.add(user.status ? "users/verified" : "users/unverified");

      // User labels
      if (Array.isArray(user.labels)) {
        user.labels.forEach((label) => roles.add(`label:${label}`));
      }

      // Teams and team roles
      if (Array.isArray(teams)) {
        teams.forEach((team) => {
          roles.add(`team:${team.$id}`);
          // Add default roles if present
          roles.add(`team:${team.$id}/owner`);
          roles.add(`team:${team.$id}/member`);
        });
      }
    } else {
      roles.add("guests");
    }

    return roles;
  }, [user, teams]);

  // Stabilize documentPermissions array to prevent re-creating function on every render
  const permsKey = useMemo(
    () => (Array.isArray(documentPermissions) ? documentPermissions.join(",") : ""),
    [documentPermissions]
  );

  const hasPermission = useMemo(() => {
    return (type: "read" | "write" | "create" | "update" | "delete", targetRole?: string) => {
      if (targetRole) {
        return userRoles.has(targetRole);
      }

      if (!documentPermissions || documentPermissions.length === 0) {
        return false;
      }

      // Check against documentPermissions
      return documentPermissions.some((perm) => {
        // Appwrite permission string format: 'read("any")', 'read('any')', etc.
        const match = perm.match(/^(\w+)\(["']([^"']+)["']\)$/);
        if (match) {
          const [_, permType, role] = match;
          if (permType === type || permType === "write") {
            return userRoles.has(role);
          }
        }
        return false;
      });
    };
  }, [userRoles, permsKey]);

  const canRead = useMemo(() => hasPermission("read"), [hasPermission]);
  const canCreate = useMemo(() => hasPermission("create"), [hasPermission]);
  const canUpdate = useMemo(() => hasPermission("update"), [hasPermission]);
  const canDelete = useMemo(() => hasPermission("delete"), [hasPermission]);

  return useMemo(
    () => ({
      userRoles,
      hasPermission,
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }),
    [userRoles, hasPermission, canRead, canCreate, canUpdate, canDelete]
  );
}

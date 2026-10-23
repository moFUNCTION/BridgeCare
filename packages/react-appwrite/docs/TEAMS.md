# Teams, RBAC & Permissions Module

The Teams module provides team collaboration, invitations, client-side Role-Based Access Control (RBAC), and declarative React route/view guard components.

---

## 1. `useTeams()`

Fetch and manage the teams the authenticated user belongs to.

### Returns

| Field | Type | Description |
|---|---|---|
| `teams` | `Models.Team[]` | List of teams user is a member of. |
| `total` | `number` | Total number of teams. |
| `loading` | `boolean` | `true` while fetching teams list. |
| `createTeam` | `(name, roles?, teamId?) => Promise<Team>` | Creates a new team. |
| `updateTeam` | `(teamId, name) => Promise<Team>` | Updates team name. |
| `deleteTeam` | `(teamId) => Promise<void>` | Deletes team. |
| `refetch` | `() => Promise<void>` | Re-fetches teams. |

### Example

```tsx
import React, { useState } from "react";
import { useTeams } from "@repo/react-appwrite";

export function TeamsManager() {
  const { teams, createTeam, deleteTeam, loading } = useTeams();
  const [newTeamName, setNewTeamName] = useState("");

  const handleCreate = async () => {
    if (!newTeamName) return;
    await createTeam(newTeamName);
    setNewTeamName("");
  };

  return (
    <div>
      <h3>My Teams</h3>
      <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
      <button onClick={handleCreate}>Create Team</button>

      {loading ? <p>Loading teams...</p> : (
        <ul>
          {teams.map((t) => (
            <li key={t.$id}>
              {t.name} (Members: {t.total})
              <button onClick={() => deleteTeam(t.$id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 2. `useTeamMembers(teamId)`

Manage members, invitations, and assigned roles inside a team.

### Methods

- `inviteMember(email, roles, redirectUrl, name?, userId?)`: Sends team membership invitation.
- `updateMembershipRoles(membershipId, roles)`: Updates user's roles inside team (e.g. `["owner", "editor"]`).
- `deleteMembership(membershipId)`: Removes member from team.

---

## 3. `usePermissions(documentPermissions?)`

Evaluates client-side Appwrite permissions strings (e.g. `read("any")`, `write("team:teamId/admin")`, `update("label:vip")`) against current user's labels and team memberships.

### Returns

```ts
interface UsePermissionsReturn {
  userRoles: Set<string>;
  hasPermission: (type: "read" | "write" | "create" | "update" | "delete", targetRole?: string) => boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}
```

---

## 4. Guard Components

Declarative access control components for protecting views and UI elements.

### `<RequireAuth>` & `<RequireGuest>`

```tsx
import { RequireAuth, RequireGuest } from "@repo/react-appwrite";

export function Navigation() {
  return (
    <nav>
      <RequireAuth fallback={<a href="/login">Log In</a>}>
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </RequireAuth>

      <RequireGuest>
        <a href="/register">Sign Up</a>
      </RequireGuest>
    </nav>
  );
}
```

### `<HasRole>`

Protects content based on user labels:

```tsx
import { HasRole } from "@repo/react-appwrite";

<HasRole role="admin" fallback={<p>Admins only.</p>}>
  <AdminControls />
</HasRole>
```

### `<HasTeam>`

Protects content based on team membership and role:

```tsx
import { HasTeam } from "@repo/react-appwrite";

<HasTeam teamId="engineering_team" role="lead" fallback={<p>Engineering leads only.</p>}>
  <DeployButton />
</HasTeam>
```

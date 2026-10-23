# Authentication, Account & Sessions Module

The Auth module provides reactive hooks for user identification, all Appwrite authentication mechanisms, Multi-Factor Authentication (MFA), multi-session switching, and profile settings.

---

## 1. `useUser<TPreferences>()`

Reactive hook returning current user authentication state with automatic session validation.

### Returns

| Field | Type | Description |
|---|---|---|
| `user` | `Models.User<TPreferences> \| null` | Authenticated user account object. |
| `profile` | `TPreferences \| null` | Custom preferences from `user.prefs`. |
| `isLoading` | `boolean` | `true` during initial session check or user fetching. |
| `isAuthenticated` | `boolean` | Convenience boolean flag (`!!user`). |
| `error` | `Error \| null` | Error during user fetch (ignoring standard 401 unauthenticated states). |
| `refresh` | `() => Promise<Models.User<TPreferences> \| null>` | Manually re-fetch current user from server. |
| `updatePrefs` | `(prefs: TPreferences) => Promise<Models.User<TPreferences>>` | Updates user preferences on Appwrite Auth and refreshes local state. |

### Example

```tsx
import React from "react";
import { useUser } from "@repo/react-appwrite";

interface UserPrefs {
  theme?: "light" | "dark";
  language?: string;
}

export function UserProfile() {
  const { user, profile, updatePrefs, isAuthenticated, isLoading } = useUser<UserPrefs>();

  if (isLoading) return <div>Checking session...</div>;
  if (!isAuthenticated) return <div>Please log in.</div>;

  return (
    <div>
      <h2>{user?.name}</h2>
      <p>Email: {user?.email}</p>
      <p>Theme: {profile?.theme || "dark"}</p>
      <button onClick={() => updatePrefs({ theme: "light" })}>
        Set Light Theme
      </button>
    </div>
  );
}
```

---

## 2. `useAuthActions()`

Reactive mutation methods for all Appwrite authentication flows.

### Methods

| Method | Parameters | Description |
|---|---|---|
| `loginWithEmail` | `(email, password)` | Authenticates with email and password, creates session. |
| `register` | `(email, password, name?, userId?)` | Creates an Appwrite auth account and establishes session. |
| `createUserWithEmail` | `(email, password, name?, userId?)` | Alias for `register`. |
| `loginWithOAuth` | `(provider, successUrl?, failureUrl?, scopes?)` | Initiates OAuth2 flow (Google, GitHub, Apple, etc.). |
| `loginWithMagicURL` | `(email, redirectUrl?, userId?)` | Sends a passwordless Magic URL token to the user's email. |
| `loginWithEmailOTP` | `(email, userId?)` | Sends a 6-digit one-time password to email. |
| `verifyEmailOTP` | `(userId, otp)` | Verifies OTP code and establishes an active session. |
| `loginWithPhone` | `(phone, userId?)` | Sends an SMS verification code to a phone number. |
| `verifyPhone` | `(userId, secret)` | Verifies SMS code and establishes an active session. |
| `loginWithAnonymous` | `()` | Creates a guest anonymous session. |
| `logout` | `(sessionId?: string)` | Deletes specified session (defaults to `"current"`). |
| `logoutAll` | `()` | Deletes all active sessions across all devices for this user. |

### Example

```tsx
import React, { useState } from "react";
import { useAuthActions, OAuthProvider } from "@repo/react-appwrite";

export function LoginForm() {
  const { loginWithEmail, loginWithOAuth, isPending, error } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      alert("Logged in successfully!");
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Logging in..." : "Log In"}
      </button>

      <button type="button" onClick={() => loginWithOAuth(OAuthProvider.Google)}>
        Continue with Google
      </button>

      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </form>
  );
}
```

---

## 3. `useMFA()`

Comprehensive Multi-Factor Authentication suite.

### Methods

- `getFactors()`: Fetches list of enrolled MFA factors.
- `enableMFA()` / `disableMFA()`: Enables or disables 2FA for the account.
- `createAuthenticator(type)`: Generates TOTP secret / QR code URI.
- `verifyAuthenticator(type, otp)`: Confirms and activates TOTP authenticator.
- `challengeMFA(factor)`: Initiates an MFA challenge.
- `completeChallenge(challengeId, otp)`: Resolves challenge with token.
- `createRecoveryCodes()` / `getRecoveryCodes()`: Generates and views backup emergency recovery codes.

---

## 4. `useAccountSwitcher()`

Facebook-style multi-identity switcher that maintains session secrets in `localStorage` and swaps accounts on the client without full page reloads.

### Methods & State

| Field | Type | Description |
|---|---|---|
| `savedAccounts` | `SavedAccount[]` | Array of stored accounts (`userId`, `name`, `email`, `sessionSecret`, `lastActive`). |
| `currentAccount` | `SavedAccount \| null` | Currently active account. |
| `switchAccount` | `(userId: string) => boolean` | Instantly sets active session secret on `Client`. |
| `addAccount` | `(account)` | Manually registers an account in the saved switcher list. |
| `removeAccount` | `(userId: string)` | Removes an account from the switcher list. |
| `clearAllAccounts` | `()` | Clears the switcher registry. |

---

## 5. `useAccountSettings()`

Manage user profile, credentials, and preferences.

### Methods

- `updateName(name: string)`
- `updateEmail(email: string, password: string)`
- `updatePassword(newPassword: string, oldPassword?: string)`
- `updatePhone(phone: string, password: string)`
- `updatePrefs<T>(prefs: T)`
- `getPrefs<T>()`

---

## 6. `<AuthProvider>` & `useAuth()`

Provides unified authentication context.

### Provider Setup

```tsx
import React from "react";
import { AppwriteProvider, AuthProvider } from "@repo/react-appwrite";

export function App() {
  return (
    <AppwriteProvider
      endpoint="https://cloud.appwrite.io/v1"
      project="your_project_id"
    >
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </AppwriteProvider>
  );
}
```

### Registration

```tsx
import React, { useState } from "react";
import { useAuth } from "@repo/react-appwrite";

export function RegisterForm() {
  const { register, isPending, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name);
      alert("Account created successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit" disabled={isPending}>Create Account</button>
      {error && <p>{error.message}</p>}
    </form>
  );
}
```

# Utilities: Presence, Avatars & Locale

The Utilities module provides realtime presence tracking over WebSockets, dynamic avatar and badge generation, and geographical/locale data fetching.

---

## 1. `usePresence(channel?)`

Realtime online/offline presence tracking and status broadcasting over Appwrite WebSockets.

### Returns

| Field | Type | Description |
|---|---|---|
| `onlineUsers` | `Record<string, UserPresence>` | Map of active user IDs to presence payloads (`userId`, `status`, `lastSeen`, `metadata`). |
| `isUserOnline` | `(userId: string) => boolean` | Checks if a user is currently online. |
| `getUserPresence` | `(userId: string) => UserPresence \| null` | Returns presence data for a user. |
| `updatePresence` | `(status?, metadata?) => void` | Broadcasts own presence status (`"online"`, `"away"`, `"offline"`). |

### Example

```tsx
import React from "react";
import { usePresence } from "@repo/react-appwrite";

export function ActiveUsersList() {
  const { onlineUsers, isUserOnline } = usePresence("chat_room_1");

  return (
    <div>
      <h3>Active Users ({Object.keys(onlineUsers).length})</h3>
      <ul>
        {Object.values(onlineUsers).map((u) => (
          <li key={u.userId}>
            User {u.userId} - <span style={{ color: u.status === "online" ? "green" : "gray" }}>{u.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 2. `useAvatars()`

Generates initials, QR codes, credit card icons, favicons, flags, and browser icons directly from the Appwrite Avatars API.

### Methods

| Method | Parameters | Description |
|---|---|---|
| `getInitials` | `(name?, width?, height?, background?)` | Generates initials avatar image URL from name. |
| `getQR` | `(text, size?, margin?, download?)` | Generates QR code image URL for a text or link. |
| `getCreditCard` | `(code, width?, height?, quality?)` | Generates payment provider logo (`"visa"`, `"mastercard"`, `"amex"`, etc.). |
| `getFavicon` | `(url)` | Fetches remote website favicon. |
| `getFlag` | `(countryCode, width?, height?, quality?)` | Generates country flag image URL by ISO-2 code (`"us"`, `"eg"`, `"de"`). |
| `getBrowser` | `(browserCode, width?, height?, quality?)` | Generates browser logo (`"chrome"`, `"firefox"`, `"safari"`). |

### Example

```tsx
import React from "react";
import { useAvatars } from "@repo/react-appwrite";

export function BadgeShowcase({ userName, websiteUrl }: { userName: string; websiteUrl: string }) {
  const { getInitials, getQR, getFavicon, getFlag } = useAvatars();

  return (
    <div>
      <img src={getInitials(userName, 100, 100)} alt={userName} />
      <img src={getFavicon(websiteUrl)} alt="Favicon" />
      <img src={getFlag("us", 40, 30)} alt="US Flag" />
      <img src={getQR("https://example.com", 200)} alt="QR Code" />
    </div>
  );
}
```

---

## 3. `useLocale()`

Fetches geographic and locale data for the current user.

### Returns & Methods

- `locale`: Current user locale object (`ip`, `countryCode`, `country`, `continentCode`, `continent`, `eu`, `currency`).
- `listCountries()`: List of all countries.
- `listEUCountries()`: List of European Union countries.
- `listCountriesPhones()`: List of international country calling codes.
- `listCurrencies()`: List of worldwide currencies.
- `listLanguages()`: List of supported languages.

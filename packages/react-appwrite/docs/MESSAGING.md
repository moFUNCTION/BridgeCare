# Messaging & Web Push Module

The Messaging module automates browser Web Push notification permission requests and registers device push targets with Appwrite Messaging.

---

## `useMessaging()`

### Returns

| Field | Type | Description |
|---|---|---|
| `isSupported` | `boolean` | `true` if browser supports the Web Notification API. |
| `permissionStatus` | `NotificationPermission` | Current permission state (`"default"`, `"granted"`, `"denied"`). |
| `isSubscribing` | `boolean` | `true` while requesting permission or registering target. |
| `error` | `Error \| null` | Error during permission request or target registration. |
| `requestPermission` | `() => Promise<NotificationPermission>` | Prompts browser notification permission dialog. |
| `registerPushTarget` | `(providerId, targetId?, identifier?) => Promise<Target>` | Requests permission and creates push target on user account. |

### Example

```tsx
import React from "react";
import { useMessaging } from "@repo/react-appwrite";

export function PushNotificationEnabler() {
  const { isSupported, permissionStatus, registerPushTarget, isSubscribing, error } =
    useMessaging();

  const handleEnablePush = async () => {
    try {
      await registerPushTarget("fcm_provider_id");
      alert("Push notifications enabled successfully!");
    } catch (err) {
      console.error("Failed to enable push", err);
    }
  };

  if (!isSupported) {
    return <p>Push notifications are not supported in your browser.</p>;
  }

  return (
    <div>
      <p>Notification status: {permissionStatus}</p>
      {permissionStatus !== "granted" && (
        <button onClick={handleEnablePush} disabled={isSubscribing}>
          {isSubscribing ? "Registering..." : "Enable Push Notifications"}
        </button>
      )}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </div>
  );
}
```

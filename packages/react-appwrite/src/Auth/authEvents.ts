import type { Models } from "appwrite";

export type AuthEventType =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "EMAIL_VERIFIED";

export interface AuthEventPayload {
  type: AuthEventType;
  user?: Models.User<any> | null;
  session?: Models.Session | null;
  timestamp: number;
}

export type AuthStateListener = (payload: AuthEventPayload) => void;

class AuthEventEmitter {
  private listeners: Set<AuthStateListener> = new Set();

  /**
   * Subscribe to global authentication state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit an authentication event to all active listeners.
   */
  emit(
    type: AuthEventType,
    data?: { user?: Models.User<any> | null; session?: Models.Session | null }
  ): void {
    const payload: AuthEventPayload = {
      type,
      user: data?.user,
      session: data?.session,
      timestamp: Date.now(),
    };
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error("[react-appwrite] Error in auth state listener:", err);
      }
    });
  }
}

export const authEvents = new AuthEventEmitter();

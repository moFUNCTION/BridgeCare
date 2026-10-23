import { useEffect, useRef } from "react";
import type { RealtimeResponseEvent } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";

export interface UseRealtimeSubscriptionOptions {
  enabled?: boolean;
}

/**
 * Universal realtime subscription hook for any Appwrite channel
 * (collections, documents, files, account, teams, memberships).
 * Automatically manages subscriptions and unmount cleanups to prevent memory leaks.
 *
 * @example
 * useRealtimeSubscription("files", (response) => {
 *   console.log("File event received:", response.events, response.payload);
 * });
 */
export function useRealtimeSubscription<T = unknown>(
  channels: string | string[],
  callback: (event: RealtimeResponseEvent<T>) => void,
  options: UseRealtimeSubscriptionOptions = {}
): void {
  const { client } = useAppwrite();
  const enabled = options.enabled !== false;
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const channelList = Array.isArray(channels) ? channels : [channels];
    if (channelList.length === 0) return;

    const unsubscribe = client.subscribe<T>(channelList, (response) => {
      callbackRef.current(response);
    });

    return () => {
      unsubscribe();
    };
  }, [client, enabled, Array.isArray(channels) ? channels.join(",") : channels]);
}

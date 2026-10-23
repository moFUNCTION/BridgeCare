import { useEffect } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import { resolveDbAndCollection } from "./helpers";
import type { RealtimeEventPayload } from "../types";

export function useRealtimeCollection<T = Record<string, any>>(
  collectionId: string,
  onEvent?: (event: RealtimeEventPayload<T>) => void
): void;
export function useRealtimeCollection<T = Record<string, any>>(
  databaseId: string,
  collectionId: string,
  onEvent?: (event: RealtimeEventPayload<T>) => void
): void;
export function useRealtimeCollection<T = Record<string, any>>(
  arg1: string,
  arg2?: string | ((event: RealtimeEventPayload<T>) => void),
  arg3?: (event: RealtimeEventPayload<T>) => void
): void {
  const { client, cacheFusion, config } = useAppwrite();
  const onEvent = typeof arg2 === "function" ? arg2 : arg3;
  const { databaseId, collectionId } = resolveDbAndCollection(
    config.databaseId,
    arg1,
    typeof arg2 === "string" ? arg2 : undefined
  );

  useEffect(() => {
    if (!databaseId || !collectionId) return;

    const channel = `databases.${databaseId}.collections.${collectionId}.documents`;
    const unsubscribe = client.subscribe(channel, (response) => {
      const payload: RealtimeEventPayload<T> = {
        events: response.events,
        channels: response.channels,
        timestamp: response.timestamp,
        payload: response.payload as T & Models.Document,
      };

      cacheFusion.handleRealtimeEvent<T>(payload);
      onEvent?.(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [client, databaseId, collectionId, cacheFusion, onEvent]);
}

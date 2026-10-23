import { useEffect } from "react";
import type { Models } from "appwrite";
import { useAppwrite } from "../Provider/useAppwrite";
import type { RealtimeEventPayload } from "../types";

export function useRealtimeDocument<T = Record<string, any>>(
  collectionId: string,
  documentId: string,
  onEvent?: (event: RealtimeEventPayload<T>) => void
): void;
export function useRealtimeDocument<T = Record<string, any>>(
  databaseId: string,
  collectionId: string,
  documentId: string,
  onEvent?: (event: RealtimeEventPayload<T>) => void
): void;
export function useRealtimeDocument<T = Record<string, any>>(
  arg1: string,
  arg2: string,
  arg3?: string | ((event: RealtimeEventPayload<T>) => void),
  arg4?: (event: RealtimeEventPayload<T>) => void
): void {
  const { client, cacheFusion, config } = useAppwrite();

  let databaseId: string;
  let collectionId: string;
  let documentId: string;
  let onEvent: ((event: RealtimeEventPayload<T>) => void) | undefined;

  if (typeof arg3 === "string") {
    databaseId = arg1;
    collectionId = arg2;
    documentId = arg3;
    onEvent = arg4;
  } else {
    if (!config.databaseId) {
      throw new Error(
        `[react-appwrite] Database ID was not provided and no default 'databaseId' was configured in <AppwriteProvider>.`
      );
    }
    databaseId = config.databaseId;
    collectionId = arg1;
    documentId = arg2;
    onEvent = typeof arg3 === "function" ? arg3 : undefined;
  }

  useEffect(() => {
    if (!databaseId || !collectionId || !documentId) return;

    const channel = `databases.${databaseId}.collections.${collectionId}.documents.${documentId}`;
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
  }, [client, databaseId, collectionId, documentId, cacheFusion, onEvent]);
}

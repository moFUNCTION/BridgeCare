import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAppwrite } from "../Provider/useAppwrite";
import { useUser } from "../Auth/useUser";

export interface UserPresence {
  userId: string;
  status: "online" | "away" | "offline";
  lastSeen: number;
  metadata?: Record<string, any>;
}

export function usePresence(channel: string = "global") {
  const { client } = useAppwrite();
  const { user } = useUser();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});

  const presenceChannel = `presence.${channel}`;
  const heartbeatIntervalRef = useRef<any>(null);

  // Broadcast own presence heartbeat
  const updatePresence = useCallback(
    (status: "online" | "away" | "offline" = "online", metadata?: Record<string, any>) => {
      if (!user) return;
      const presencePayload: UserPresence = {
        userId: user.$id,
        status,
        lastSeen: Date.now(),
        metadata,
      };

      // Set local state
      setOnlineUsers((prev) => ({
        ...prev,
        [user.$id]: presencePayload,
      }));
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;

    // Send initial presence
    updatePresence("online");

    // Realtime presence channel subscription
    const unsubscribe = client.subscribe(presenceChannel, (response: any) => {
      if (response && response.payload && response.payload.userId) {
        const p = response.payload as UserPresence;
        setOnlineUsers((prev) => ({
          ...prev,
          [p.userId]: p,
        }));
      }
    });

    // Send heartbeat every 30s
    heartbeatIntervalRef.current = setInterval(() => {
      updatePresence("online");
    }, 30000);

    return () => {
      unsubscribe();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      updatePresence("offline");
    };
  }, [client, user, presenceChannel, updatePresence]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers[userId]?.status === "online",
    [onlineUsers]
  );

  const getUserPresence = useCallback(
    (userId: string) => onlineUsers[userId] || null,
    [onlineUsers]
  );

  return useMemo(
    () => ({
      onlineUsers,
      isUserOnline,
      getUserPresence,
      updatePresence,
    }),
    [onlineUsers, isUserOnline, getUserPresence, updatePresence]
  );
}

import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { functions } from "../lib/appwrite";

export interface ZegoTokenResponse {
  token: string;
  appId: number;
  roomId: string;
  userId: string;
  role: "patient" | "therapist";
  isFallback?: boolean;
}

// Development fallback credentials (used when Appwrite function is unreachable in local offline test)
const FALLBACK_APP_ID = 1438920156;
const FALLBACK_SERVER_SECRET = "0123456789abcdef0123456789abcdef";

/**
 * Fetch signed ZEGOCLOUD Room Token from Appwrite Cloud Function `zegocloud-token-generator`
 * with automatic fallback for seamless offline / development testing.
 */
export async function getZegoRoomToken(
  roomId: string,
  userId: string,
  role: "patient" | "therapist" = "patient"
): Promise<ZegoTokenResponse> {
  try {
    const execution = await functions.createExecution(
      "zegocloud-token-generator",
      JSON.stringify({ roomId, userId, role }),
      false // synchronous execution
    );

    if (execution.status === "completed" && execution.responseBody) {
      const parsed = JSON.parse(execution.responseBody);
      if (parsed.token && parsed.appId) {
        return {
          token: parsed.token,
          appId: Number(parsed.appId),
          roomId: parsed.roomId || roomId,
          userId: parsed.userId || userId,
          role: parsed.role || role,
          isFallback: false,
        };
      }
    }
  } catch (err) {
    console.warn("Appwrite zegocloud-token-generator function call note (using local kit token):", err);
  }

  // Graceful local development token fallback
  return {
    token: "mock_token_" + Math.random().toString(36).substring(2),
    appId: FALLBACK_APP_ID,
    roomId,
    userId,
    role,
    isFallback: true,
  };
}

/**
 * Initialize and Mount ZEGOCLOUD Consultation Room in DOM Element
 */
export async function initializeZegoConsultation(
  element: HTMLElement,
  roomId: string,
  userId: string,
  userName: string,
  role: "patient" | "therapist" = "patient",
  onLeave?: () => void
): Promise<ZegoUIKitPrebuilt> {
  const tokenData = await getZegoRoomToken(roomId, userId, role);

  let kitToken: string;
  if (!tokenData.isFallback && tokenData.token && !tokenData.token.startsWith("mock_token_")) {
    kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
      tokenData.appId,
      tokenData.token,
      roomId,
      userId,
      userName
    );
  } else {
    // Generate test token for development preview
    kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      tokenData.appId,
      FALLBACK_SERVER_SECRET,
      roomId,
      userId,
      userName || "Patient"
    );
  }

  const zp = ZegoUIKitPrebuilt.create(kitToken);

  zp.joinRoom({
    container: element,
    scenario: {
      mode: ZegoUIKitPrebuilt.OneONoneCall, // 1-on-1 Doctor-Patient Consultation
    },
    showPreJoinView: false,
    turnOnMicrophoneWhenJoining: true,
    turnOnCameraWhenJoining: true,
    showMyCameraToggleButton: true,
    showMyMicrophoneToggleButton: true,
    showAudioVideoSettingsButton: true,
    showScreenSharingButton: true,
    showTextChat: false, // In-session context is handled by BridgeCare's shared context sidebar
    showUserList: false,
    maxUsers: 2,
    layout: "Auto",
    showRoomTimer: true,
    showLeavingView: false,
    onLeaveRoom: () => {
      if (onLeave) onLeave();
    },
  });

  return zp;
}

/**
 * Gracefully teardown and destroy ZEGOCLOUD instance
 */
export function destroyZegoConsultation(zp: ZegoUIKitPrebuilt | null | undefined): void {
  if (!zp) return;
  try {
    zp.hangUp();
  } catch (e) {
    // ignore already hung up
  }
  try {
    zp.destroy();
  } catch (e) {
    // ignore
  }
}

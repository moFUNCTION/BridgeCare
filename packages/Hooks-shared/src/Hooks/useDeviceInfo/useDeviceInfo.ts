import { useMemo } from "react";

export interface DeviceInfo {
  /** Device / browser name */
  name?: string;
  /** Operating system */
  os?: string;
}

function getDeviceInfo(): DeviceInfo {
  if (typeof navigator === "undefined") {
    return {};
  }

  const ua = navigator.userAgent;
  const platform = navigator.platform ?? "";
  const vendor = navigator.vendor ?? "";

  let os: string | undefined;
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) os = "Linux";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/CrOS/i.test(ua)) os = "Chrome OS";

  let name: string | undefined;
  if (/iPhone/i.test(ua)) name = "iPhone";
  else if (/iPad/i.test(ua)) name = "iPad";
  else if (/Android/i.test(ua))
    name = /Mobile/i.test(ua) ? "Android Phone" : "Android Tablet";
  else if (/Win/i.test(platform)) name = "Windows PC";
  else if (/Mac/i.test(platform)) name = "Mac";
  else if (/Linux/i.test(platform)) name = "Linux PC";

  return { name: name ?? platform, os };
}

export function useDeviceInfo(): DeviceInfo {
  return useMemo(getDeviceInfo, []);
}

/**
 * Cookie utilities for BridgeCare
 */

export function setCookie(name: string, value: string, days = 14): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function removeCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

export const SKIP_VERIFICATION_COOKIE = "bridgecare_skip_verify";

export function isVerificationSkipped(): boolean {
  return getCookie(SKIP_VERIFICATION_COOKIE) === "true";
}

export function setVerificationSkipped(skipped = true): void {
  if (skipped) {
    setCookie(SKIP_VERIFICATION_COOKIE, "true", 14);
  } else {
    removeCookie(SKIP_VERIFICATION_COOKIE);
  }
}

/**
 * Apply as `paddingBottom` on the main app shell so content stays above the fixed mobile tab bar.
 * Includes iOS safe-area inset.
 */
export const TABS_MENU_MOBILE_BOTTOM_OFFSET =
  "calc(6.25rem + env(safe-area-inset-bottom, 0px))";

/**
 * Use for fixed controls (e.g. FAB) so they sit above the mobile tab bar.
 */
export const TABS_MENU_MOBILE_FAB_OFFSET =
  "calc(6.25rem + env(safe-area-inset-bottom, 0px) + 0.5rem)";

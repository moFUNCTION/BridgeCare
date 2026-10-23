// =============================================================
// @repo/react-appwrite - Master Entry Point
// =============================================================

// 1. Core Types
export * from "./types";

// 2. Provider & Context
export * from "./Provider";

// 3. Authentication & Account
export * from "./Auth";

// 4. Databases & Realtime Query Engine
export * from "./Databases";

// 5. Storage & Media
export * from "./Storage";

// 6. Teams, RBAC & Permissions
export * from "./Teams";

// 7. Serverless Cloud Functions
export * from "./Functions";

// 8. Messaging & Web Push
export * from "./Messaging";

// 9. Utilities (Presence, Avatars, Locale)
export * from "./Utilities";

// 10. Direct Appwrite SDK Re-exports
export {
  ID,
  Query,
  Permission,
  Role,
  OAuthProvider,
  ImageGravity,
  ImageFormat,
  Flag,
  Browser,
  CreditCard,
  AuthenticatorType,
  ExecutionMethod,
  AppwriteException,
  type Models,
} from "appwrite";

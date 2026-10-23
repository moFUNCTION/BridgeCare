import type {
  Client,
  Account,
  Databases,
  Storage,
  Functions,
  Messaging,
  Teams,
  Avatars,
  Locale,
  Models,
} from "appwrite";

export interface AppwriteConfig {
  endpoint: string;
  project: string;
  databaseId?: string;
  headers?: Record<string, string>;
  onError?: (error: unknown, context: string) => void;
  storageKeyPrefix?: string;
  autoRestoreSession?: boolean;
}

export interface AppwriteContextValue {
  client: Client;
  account: Account;
  databases: Databases;
  storage: Storage;
  functions: Functions;
  messaging: Messaging;
  teams: Teams;
  avatars: Avatars;
  locale: Locale;
  cacheFusion: ICacheFusionStore;
  config: AppwriteConfig;
  isConnected: boolean;
  activeSessionSecret: string | null;
  setSessionSecret: (secret: string | null) => void;
  activeJWT: string | null;
  setJWT: (jwt: string | null) => void;
}

// -------------------------------------------------------------
// Declarative Query & Filter Types
// -------------------------------------------------------------

export type FilterOperatorValue<T = any> =
  | T
  | {
      $eq?: T;
      $ne?: T;
      $gt?: T;
      $gte?: T;
      $lt?: T;
      $lte?: T;
      $in?: T[];
      $nin?: T[];
      $between?: [T, T];
      $search?: string;
      $startsWith?: string;
      $endsWith?: string;
      $isNull?: boolean;
      $isNotNull?: boolean;
      $contains?: T | T[];
    };

export type WhereFilter<T = Record<string, any>> = {
  [K in keyof T]?: FilterOperatorValue<T[K]>;
} & {
  $or?: WhereFilter<T>[];
  $and?: WhereFilter<T>[];
} & Record<string, any>;

export interface SortOption<T = Record<string, any>> {
  field: keyof T | string;
  order?: "asc" | "desc";
}

export interface UseCollectionOptions<T = Record<string, any>> {
  where?: WhereFilter<T>;
  queries?: string[];
  sort?: SortOption<T>[] | Record<string, "asc" | "desc">;
  search?: string;
  searchField?: keyof T | string;
  searchDebounceMs?: number;
  select?: (keyof T | string)[];
  limit?: number;
  page?: number;
  sortField?: keyof T | string;
  sortOrder?: "asc" | "desc";
  cursor?: string;
  cursorType?: "before" | "after";
  realtime?: boolean;
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  onSuccess?: (documents: (T & Models.Document)[], total: number) => void;
  onError?: (error: Error) => void;
}

export interface UseInfiniteCollectionOptions<T = Record<string, any>>
  extends Omit<UseCollectionOptions<T>, "page"> {
  pageSize?: number;
}

export interface UseDocumentOptions<T = Record<string, any>> {
  select?: (keyof T | string)[];
  realtime?: boolean;
  enabled?: boolean;
  onSuccess?: (document: T & Models.Document) => void;
  onError?: (error: Error) => void;
}

export interface UseRelatedDocumentsOptions<T = Record<string, any>>
  extends Omit<UseCollectionOptions<T>, "where"> {
  relationshipAttribute: string;
}

// -------------------------------------------------------------
// Advanced Database Types (Pagination, Batch, Document Ops, Count, Search)
// -------------------------------------------------------------

export type PaginationMode = "cursor" | "offset" | "auto";

export interface UseCollectionWithPaginationOptions<T = Record<string, any>>
  extends Omit<UseCollectionOptions<T>, "page" | "cursor" | "cursorType"> {
  pageSize?: number;
  initialPage?: number;
  paginationMode?: PaginationMode;
}

export interface UseCollectionWithPaginationReturn<T = Record<string, any>> {
  data: (T & Models.Document)[];
  documents: (T & Models.Document)[];
  loading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setPageSize: (size: number) => void;
  resetPage: () => void;
  refetch: () => Promise<void>;
}

export interface BatchProgress {
  completed: number;
  total: number;
  percent: number;
}

export interface BatchOperationOptions {
  chunkSize?: number;
  concurrency?: number;
  continueOnError?: boolean;
  onProgress?: (progress: BatchProgress) => void;
}

export interface BatchResult<T = any> {
  succeeded: (T & Models.Document)[];
  succeededIds: string[];
  failed: Array<{ item: any; error: Error }>;
  totalProcessed: number;
}

export interface UseBatchOperationsReturn<T = Record<string, any>> {
  bulkCreate: (
    documents: Partial<T>[],
    options?: BatchOperationOptions & { permissions?: string[] }
  ) => Promise<BatchResult<T>>;
  bulkUpdate: (
    updates: Array<{ documentId: string; data: Partial<T>; permissions?: string[] }>,
    options?: BatchOperationOptions
  ) => Promise<BatchResult<T>>;
  bulkDelete: (
    documentIds: string[],
    options?: BatchOperationOptions
  ) => Promise<BatchResult<string>>;
  isLoading: boolean;
  progress: BatchProgress;
  error: Error | null;
  reset: () => void;
}

export interface UseDocumentOperationsReturn<T = Record<string, any>> {
  upsertDocument: (
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ) => Promise<T & Models.Document>;
  patchDocument: (
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ) => Promise<T & Models.Document>;
  incrementField: (
    documentId: string,
    field: keyof T | string,
    amount?: number
  ) => Promise<T & Models.Document>;
  decrementField: (
    documentId: string,
    field: keyof T | string,
    amount?: number
  ) => Promise<T & Models.Document>;
  arrayUnion: (
    documentId: string,
    field: keyof T | string,
    items: any | any[]
  ) => Promise<T & Models.Document>;
  arrayRemove: (
    documentId: string,
    field: keyof T | string,
    items: any | any[]
  ) => Promise<T & Models.Document>;
  softDelete: (
    documentId: string,
    softDeleteField?: string
  ) => Promise<T & Models.Document>;
  restore: (
    documentId: string,
    softDeleteField?: string
  ) => Promise<T & Models.Document>;
  isLoading: boolean;
  error: Error | null;
}

export interface UseCollectionCountOptions<T = Record<string, any>> {
  where?: WhereFilter<T>;
  queries?: string[];
  search?: string;
  searchField?: keyof T | string;
  realtime?: boolean;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export interface UseCollectionCountReturn {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseSearchDocumentsOptions<T = Record<string, any>> {
  searchFields: (keyof T | string)[];
  debounceMs?: number;
  minChars?: number;
  limit?: number;
  where?: WhereFilter<T>;
  sortField?: keyof T | string;
  sortOrder?: "asc" | "desc";
  select?: (keyof T | string)[];
  enabled?: boolean;
  storeRecent?: boolean;
  recentStorageKey?: string;
}

export interface UseSearchDocumentsReturn<T = Record<string, any>> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  results: (T & Models.Document)[];
  loading: boolean;
  error: Error | null;
  recentSearches: string[];
  clearRecentSearches: () => void;
  clearSearch: () => void;
  refetch: () => Promise<void>;
}

// -------------------------------------------------------------
// Realtime & Cache Fusion Types
// -------------------------------------------------------------

export type RealtimeAction = "create" | "update" | "delete";

export interface RealtimeEventPayload<T = any> {
  events: string[];
  channels: string[];
  timestamp: number | string;
  payload: T & Models.Document;
}

export interface ICacheFusionStore {
  getDocument<T = any>(databaseId: string, collectionId: string, documentId: string): (T & Models.Document) | undefined;
  setDocument<T = any>(databaseId: string, collectionId: string, document: T & Models.Document): void;
  removeDocument(databaseId: string, collectionId: string, documentId: string): void;
  
  getCollectionQuery<T = any>(queryKey: string): { documents: (T & Models.Document)[]; total: number } | undefined;
  setCollectionQuery<T = any>(queryKey: string, data: { documents: (T & Models.Document)[]; total: number }): void;
  
  handleRealtimeEvent<T = any>(event: RealtimeEventPayload<T>): void;
  subscribeToKey(key: string, listener: () => void): () => void;
  clear(): void;
}

// -------------------------------------------------------------
// Account Switcher Types
// -------------------------------------------------------------

export interface SavedAccount {
  userId: string;
  name: string;
  email: string;
  sessionSecret: string;
  provider?: string;
  avatarUrl?: string;
  lastActive: number;
}

// -------------------------------------------------------------
// Storage & Upload Types
// -------------------------------------------------------------

export interface UploadProgress {
  fileId: string;
  fileName: string;
  fileSize: number;
  bytesUploaded: number;
  percentage: number;
  status: "pending" | "uploading" | "paused" | "completed" | "error" | "aborted";
  error?: Error;
}

export interface UseUploadOptions {
  bucketId: string;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (file: Models.File) => void;
  onError?: (error: Error) => void;
  permissions?: string[];
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  gravity?: "center" | "top-left" | "top" | "top-right" | "left" | "right" | "bottom-left" | "bottom" | "bottom-right";
  quality?: number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  background?: string;
  output?: "jpg" | "jpeg" | "gif" | "png" | "webp" | "avif";
}

// -------------------------------------------------------------
// Functions & Executions Types
// -------------------------------------------------------------

export interface UseFunctionOptions {
  async?: boolean;
  xpath?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
  headers?: Record<string, string>;
  onSuccess?: (execution: Models.Execution) => void;
  onError?: (error: Error) => void;
}

// -------------------------------------------------------------
// Messaging & Notification Types
// -------------------------------------------------------------

export interface WebPushSubscriptionOptions {
  providerId: string;
  identifier?: string;
}

// -------------------------------------------------------------
// Auth & User Profile Document Types
// -------------------------------------------------------------

export interface UserDocumentBase {
  uid: string;
  userId: string;
  email?: string;
  displayName?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface RegisterOptions {
  userId?: string;
  autoSignIn?: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface UseAuthReturn<
  TPreferences extends Models.Preferences = Models.Preferences,
> {
  user: Models.User<TPreferences> | null;
  isLoading: boolean;
  isPending: boolean;
  error: Error | null;
  isAuthenticated: boolean;

  // Actions
  loginWithEmail: (email: string, password: string) => Promise<Models.Session>;
  loginWithOAuth: (
    provider: any,
    successUrl?: string,
    failureUrl?: string,
    scopes?: string[]
  ) => void;
  loginWithMagicURL: (
    email: string,
    redirectUrl?: string,
    userId?: string
  ) => Promise<Models.Token>;
  loginWithEmailOTP: (email: string, userId?: string) => Promise<Models.Token>;
  verifyEmailOTP: (userId: string, otp: string) => Promise<Models.Session>;
  loginWithPhone: (phone: string, userId?: string) => Promise<Models.Token>;
  verifyPhone: (userId: string, secret: string) => Promise<Models.Session>;
  loginWithAnonymous: () => Promise<Models.Session>;
  logout: (sessionId?: string) => Promise<void>;
  logoutAll: () => Promise<void>;

  // Registration & User creation
  register: (
    email: string,
    password: string,
    name?: string,
    userId?: string
  ) => Promise<Models.User<TPreferences>>;
  createUserWithEmail: (
    email: string,
    password: string,
    name?: string,
    userId?: string
  ) => Promise<Models.User<TPreferences>>;

  // Password Recovery & Email/Phone Verification
  createRecovery: (email: string, url: string) => Promise<Models.Token>;
  updateRecovery: (
    userId: string,
    secret: string,
    password: string
  ) => Promise<Models.Token>;
  createVerification: (url: string) => Promise<Models.Token>;
  updateVerification: (userId: string, secret: string) => Promise<Models.Token>;
  createPhoneVerification: () => Promise<Models.Token>;
  updatePhoneVerification: (
    userId: string,
    secret: string
  ) => Promise<Models.Token>;

  // Tokens, Identities & Security Logs
  createJWT: () => Promise<Models.Jwt>;
  listIdentities: (queries?: string[]) => Promise<Models.IdentityList>;
  deleteIdentity: (identityId: string) => Promise<{}>;
  listLogs: (queries?: string[]) => Promise<Models.LogList>;

  // User preferences & reload
  updatePrefs: (prefs: TPreferences) => Promise<Models.User<TPreferences>>;
  updateProfile: (data: any) => Promise<any>;
  profile?: any;
  refresh: () => Promise<Models.User<TPreferences> | null>;
}

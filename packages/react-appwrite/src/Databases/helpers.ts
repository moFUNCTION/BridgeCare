/**
 * Helper to resolve databaseId, collectionId, and options when hooks support both:
 * 1. (collectionId: string, options?: TOptions) -> uses defaultDatabaseId
 * 2. (databaseId: string, collectionId: string, options?: TOptions) -> explicit databaseId
 */
export function resolveDbAndCollection<TOptions = any>(
  defaultDatabaseId: string | undefined,
  arg1: string,
  arg2?: string | TOptions,
  arg3?: TOptions
): { databaseId: string; collectionId: string; options: TOptions } {
  if (typeof arg2 === "string") {
    // Called as (databaseId, collectionId, options)
    return {
      databaseId: arg1,
      collectionId: arg2,
      options: (arg3 || {}) as TOptions,
    };
  } else {
    // Called as (collectionId, options)
    if (!defaultDatabaseId) {
      throw new Error(
        `[react-appwrite] Database ID was not provided and no default 'databaseId' was configured in <AppwriteProvider>. ` +
          `Either provide databaseId in <AppwriteProvider config={{ databaseId: "..." }}> or pass it explicitly: useHook("databaseId", "${arg1}")`
      );
    }
    return {
      databaseId: defaultDatabaseId,
      collectionId: arg1,
      options: (arg2 || {}) as TOptions,
    };
  }
}

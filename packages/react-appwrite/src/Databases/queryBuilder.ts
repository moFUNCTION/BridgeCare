import { Query } from "appwrite";
import type { UseCollectionOptions, WhereFilter } from "../types";

/**
 * Recursively parses declarative WhereFilter into Appwrite query strings,
 * including nested logical $or and $and operators.
 */
export function parseWhereClause<T = Record<string, any>>(where: WhereFilter<T>): string[] {
  const queries: string[] = [];

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;

    // Handle $or: [ { ... }, { ... } ]
    if (key === "$or" && Array.isArray(value)) {
      const orBranches: string[] = [];
      for (const branch of value) {
        if (typeof branch === "object" && branch !== null) {
          const subQueries = parseWhereClause(branch);
          if (subQueries.length === 1) {
            orBranches.push(subQueries[0]);
          } else if (subQueries.length > 1) {
            orBranches.push(Query.and(subQueries));
          }
        }
      }
      if (orBranches.length > 0) {
        queries.push(Query.or(orBranches));
      }
      continue;
    }

    // Handle $and: [ { ... }, { ... } ]
    if (key === "$and" && Array.isArray(value)) {
      const andBranches: string[] = [];
      for (const branch of value) {
        if (typeof branch === "object" && branch !== null) {
          const subQueries = parseWhereClause(branch);
          andBranches.push(...subQueries);
        }
      }
      if (andBranches.length > 0) {
        queries.push(Query.and(andBranches));
      }
      continue;
    }

    if (value === null) {
      queries.push(Query.isNull(key));
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      // Handle operator objects
      const ops = value as Record<string, any>;
      for (const [op, opVal] of Object.entries(ops)) {
        if (opVal === undefined) continue;

        switch (op) {
          case "$eq":
            queries.push(Query.equal(key, opVal));
            break;
          case "$ne":
            queries.push(Query.notEqual(key, opVal));
            break;
          case "$gt":
            queries.push(Query.greaterThan(key, opVal));
            break;
          case "$gte":
            queries.push(Query.greaterThanEqual(key, opVal));
            break;
          case "$lt":
            queries.push(Query.lessThan(key, opVal));
            break;
          case "$lte":
            queries.push(Query.lessThanEqual(key, opVal));
            break;
          case "$between":
            if (Array.isArray(opVal) && opVal.length === 2) {
              queries.push(Query.between(key, opVal[0], opVal[1]));
            }
            break;
          case "$search":
            if (typeof opVal === "string" && opVal.trim()) {
              queries.push(Query.search(key, opVal.trim()));
            }
            break;
          case "$startsWith":
            if (typeof opVal === "string") {
              queries.push(Query.startsWith(key, opVal));
            }
            break;
          case "$endsWith":
            if (typeof opVal === "string") {
              queries.push(Query.endsWith(key, opVal));
            }
            break;
          case "$contains":
            queries.push(Query.contains(key, opVal));
            break;
          case "$isNull":
            if (opVal) queries.push(Query.isNull(key));
            else queries.push(Query.isNotNull(key));
            break;
          case "$isNotNull":
            if (opVal) queries.push(Query.isNotNull(key));
            else queries.push(Query.isNull(key));
            break;
          case "$in":
            if (Array.isArray(opVal)) {
              queries.push(Query.equal(key, opVal));
            }
            break;
          case "$nin":
            if (Array.isArray(opVal)) {
              queries.push(Query.notEqual(key, opVal));
            }
            break;
        }
      }
    } else {
      // Direct primitive value or array -> Query.equal
      queries.push(Query.equal(key, value));
    }
  }

  return queries;
}

/**
 * Builds an array of Appwrite Query strings from declarative UseCollectionOptions.
 */
export function buildQueries<T = Record<string, any>>(options: UseCollectionOptions<T>): string[] {
  const queries: string[] = [];

  // 1. Raw Queries Passthrough
  if (options.queries && Array.isArray(options.queries)) {
    for (const q of options.queries) {
      if (typeof q === "string" && q.trim()) {
        queries.push(q);
      } else if (q && typeof (q as any).toString === "function") {
        queries.push((q as any).toString());
      }
    }
  }

  // 2. Declarative where filter
  if (options.where && typeof options.where === "object") {
    queries.push(...parseWhereClause<T>(options.where));
  }

  // 3. Search & SearchField
  if (options.search && options.search.trim()) {
    const field = (options.searchField as string) || "$id";
    queries.push(Query.search(field, options.search.trim()));
  }

  // 4. Field selection (projection)
  if (options.select && Array.isArray(options.select) && options.select.length > 0) {
    queries.push(Query.select(options.select as string[]));
  }

  // 5. Multi-column or single-column Sorting
  if (options.sort) {
    if (Array.isArray(options.sort)) {
      for (const sortItem of options.sort) {
        if (sortItem.order === "desc") {
          queries.push(Query.orderDesc(sortItem.field as string));
        } else {
          queries.push(Query.orderAsc(sortItem.field as string));
        }
      }
    } else if (typeof options.sort === "object") {
      for (const [field, order] of Object.entries(options.sort)) {
        if (order === "desc") {
          queries.push(Query.orderDesc(field));
        } else {
          queries.push(Query.orderAsc(field));
        }
      }
    }
  } else if (options.sortField) {
    const field = options.sortField as string;
    if (options.sortOrder === "desc") {
      queries.push(Query.orderDesc(field));
    } else {
      queries.push(Query.orderAsc(field));
    }
  }

  // 6. Pagination (Limit & Offset or Cursors)
  const limit = options.limit !== undefined ? options.limit : 25;
  queries.push(Query.limit(limit));

  if (options.cursor) {
    if (options.cursorType === "before") {
      queries.push(Query.cursorBefore(options.cursor));
    } else {
      queries.push(Query.cursorAfter(options.cursor));
    }
  } else if (options.page && options.page > 1) {
    const offset = (options.page - 1) * limit;
    queries.push(Query.offset(offset));
  }

  return queries;
}

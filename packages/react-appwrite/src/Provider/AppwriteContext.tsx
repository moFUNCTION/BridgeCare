import { createContext } from "react";
import type { AppwriteContextValue } from "../types";

export const AppwriteContext = createContext<AppwriteContextValue | null>(null);

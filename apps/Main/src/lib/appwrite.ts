import { Client, Account, Functions, Databases, Avatars } from "appwrite";

export const APPWRITE_ENDPOINT =
  (import.meta.env.VITE_APPWRITE_ENDPOINT as string) || "https://fra.cloud.appwrite.io/v1";

export const APPWRITE_PROJECT_ID =
  (import.meta.env.VITE_APPWRITE_PROJECT_ID as string) || "6adaf3cd000458c04102";

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const functions = new Functions(client);
export const databases = new Databases(client);
export const avatars = new Avatars(client);

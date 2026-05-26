import { localAuth, type AuthUser, type AuthSession } from "./auth";
import { fromTable } from "./query";
import { localFunctions } from "./functions";
import { localStorageApi } from "./storage";
import type { TableName } from "./types";

export class FunctionsHttpError extends Error {
  context: { status: number; text: () => Promise<string> };
  constructor(message: string, status = 500, responseText = "") {
    super(message);
    this.name = "FunctionsHttpError";
    this.context = {
      status,
      text: async () => responseText,
    };
  }
}

export const supabase = {
  auth: localAuth,
  from: (table: string) => fromTable(table as TableName),
  functions: localFunctions,
  storage: localStorageApi,
  rpc: async (_name: string, _params?: Record<string, unknown>) => {
    return { data: null, error: { message: "RPC não disponível em modo local" } };
  },
} as const;

export type User = AuthUser;
export type Session = AuthSession;
export { resetDB } from "./store";

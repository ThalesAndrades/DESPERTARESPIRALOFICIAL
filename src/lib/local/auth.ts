import { getDB, mutate, setSession, clearSession, currentSession, uuid, nowISO } from "./store";
import type { AuthUserRow } from "./types";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  aud: "authenticated";
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "bearer";
  user: AuthUser;
}

type AuthEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY";

type AuthListener = (event: AuthEvent, session: AuthSession | null) => void;

const listeners = new Set<AuthListener>();

function toAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    user_metadata: row.user_metadata ?? {},
    app_metadata: {},
    aud: "authenticated",
    created_at: row.created_at,
  };
}

function findUser(predicate: (u: AuthUserRow) => boolean): AuthUserRow | undefined {
  return getDB().auth_users.find(predicate);
}

function makeSession(user: AuthUserRow): AuthSession {
  const sess = currentSession();
  return {
    access_token: sess?.access_token ?? `local-token-${user.id}`,
    refresh_token: sess?.refresh_token ?? `local-refresh-${user.id}`,
    expires_in: 3600,
    token_type: "bearer",
    user: toAuthUser(user),
  };
}

function emit(event: AuthEvent, session: AuthSession | null) {
  for (const fn of listeners) {
    try {
      fn(event, session);
    } catch {
      /* listener crashed — ignore */
    }
  }
}

function activeUser(): AuthUserRow | null {
  const sess = currentSession();
  if (!sess) return null;
  const user = findUser((u) => u.id === sess.user_id);
  return user ?? null;
}

export const localAuth = {
  async getSession(): Promise<{ data: { session: AuthSession | null }; error: null }> {
    const user = activeUser();
    return { data: { session: user ? makeSession(user) : null }, error: null };
  },

  async getUser(): Promise<{ data: { user: AuthUser | null }; error: null }> {
    const user = activeUser();
    return { data: { user: user ? toAuthUser(user) : null }, error: null };
  },

  onAuthStateChange(callback: AuthListener) {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe() {
            listeners.delete(callback);
          },
        },
      },
    };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const user = findUser(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!user) {
      return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
    }
    setSession(user.id);
    const session = makeSession(user);
    emit("SIGNED_IN", session);
    return { data: { user: toAuthUser(user), session }, error: null };
  },

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: Record<string, unknown> };
  }) {
    const existing = findUser((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return { data: { user: null, session: null }, error: { message: "User already registered" } };
    }
    const id = uuid();
    const row: AuthUserRow = {
      id,
      email: email.trim().toLowerCase(),
      password,
      full_name: (options?.data?.full_name as string) ?? null,
      created_at: nowISO(),
      user_metadata: options?.data ?? {},
    };
    mutate((db) => {
      db.auth_users.push(row);
      db.user_profiles.push({
        id,
        email: row.email,
        full_name: row.full_name,
        username: null,
        anonymous_name: "Convidada",
        role: "member",
        created_at: row.created_at,
      });
    });
    setSession(id);
    const session = makeSession(row);
    emit("SIGNED_IN", session);
    return { data: { user: toAuthUser(row), session }, error: null };
  },

  async signInWithOtp({ email, options }: { email: string; options?: { shouldCreateUser?: boolean } }) {
    // Locally we don't actually send any email — just record that an OTP was
    // "requested" so verifyOtp can accept any 6-digit code afterward.
    const exists = findUser((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!exists && options?.shouldCreateUser === false) {
      return { data: { user: null, session: null }, error: { message: "User not found" } };
    }
    if (!exists && options?.shouldCreateUser !== false) {
      // Create a pending user with no password
      const id = uuid();
      mutate((db) => {
        db.auth_users.push({
          id,
          email: email.trim().toLowerCase(),
          password: null,
          full_name: null,
          created_at: nowISO(),
          user_metadata: {},
        });
        db.user_profiles.push({
          id,
          email: email.trim().toLowerCase(),
          full_name: null,
          username: null,
          anonymous_name: "Convidada",
          role: "member",
          created_at: nowISO(),
        });
      });
    }
    if (import.meta.env?.DEV) {
      console.info(
        `[local-auth] OTP solicitado para ${email}. Use qualquer código de 6 dígitos (ex: 123456) para confirmar.`
      );
    }
    return { data: { user: null, session: null }, error: null };
  },

  async verifyOtp({ email, token, type: _type }: { email: string; token: string; type: string }) {
    if (!/^\d{4,8}$/.test(token)) {
      return { data: { user: null, session: null }, error: { message: "Código inválido" } };
    }
    const user = findUser((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { data: { user: null, session: null }, error: { message: "Usuária não encontrada" } };
    }
    setSession(user.id);
    const session = makeSession(user);
    emit("SIGNED_IN", session);
    return { data: { user: toAuthUser(user), session }, error: null };
  },

  async updateUser({ password, data }: { password?: string; data?: Record<string, unknown> }) {
    const user = activeUser();
    if (!user) {
      return { data: { user: null }, error: { message: "Não autenticada" } };
    }
    mutate((db) => {
      const u = db.auth_users.find((x) => x.id === user.id);
      if (!u) return;
      if (password) u.password = password;
      if (data) {
        u.user_metadata = { ...u.user_metadata, ...data };
        if (typeof data.full_name === "string") u.full_name = data.full_name;
      }
    });
    const updated = activeUser();
    const session = updated ? makeSession(updated) : null;
    emit("USER_UPDATED", session);
    return { data: { user: updated ? toAuthUser(updated) : null }, error: null };
  },

  async signInWithOAuth(_args: {
    provider: string;
    options?: {
      redirectTo?: string;
      queryParams?: Record<string, string>;
      skipBrowserRedirect?: boolean;
      scopes?: string;
    };
  }) {
    // Local mode: no OAuth provider — pretend we sent the user to the IdP.
    // Most pages call this and rely on a callback. We can't simulate that here,
    // so just log and return success.
    if (import.meta.env?.DEV) {
      console.info(
        "[local-auth] signInWithOAuth chamado. Sem provedor real local — use email/senha."
      );
    }
    return { data: { provider: _args.provider, url: null }, error: null };
  },

  async signOut(_options?: { scope?: "global" | "local" | "others" }) {
    clearSession();
    emit("SIGNED_OUT", null);
    return { error: null };
  },

  async resetPasswordForEmail(email: string, _options?: { redirectTo?: string }) {
    const exists = findUser((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!exists) {
      // Mirror Supabase: don't reveal if user exists. Always succeed.
      return { data: {}, error: null };
    }
    if (import.meta.env?.DEV) {
      console.info(`[local-auth] Reset de senha solicitado para ${email} (modo local — sem email real).`);
    }
    return { data: {}, error: null };
  },

  async refreshSession() {
    const user = activeUser();
    if (!user) return { data: { session: null }, error: null };
    return { data: { session: makeSession(user) }, error: null };
  },
};

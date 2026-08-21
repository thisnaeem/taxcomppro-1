import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;

export interface RequestPasswordResetParams {
  email: string;
  redirectTo?: string;
}

export interface ResetPasswordParams {
  newPassword: string;
  token: string;
}

export interface AuthResponse<T = unknown> {
  data?: T;
  error?: {
    message?: string;
    status?: number;
    code?: string;
  };
}

/**
 * Requests a password reset email to be sent to the user.
 */
export async function requestPasswordReset(
  params: RequestPasswordResetParams
): Promise<AuthResponse> {
  try {
    const client = authClient as unknown as {
      requestPasswordReset?: (p: RequestPasswordResetParams) => Promise<AuthResponse>;
      forgetPassword?: (p: RequestPasswordResetParams) => Promise<AuthResponse>;
    };

    if (typeof client.requestPasswordReset === "function") {
      return await client.requestPasswordReset(params);
    }
    if (typeof client.forgetPassword === "function") {
      return await client.forgetPassword(params);
    }

    // Direct fetch fallback
    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: { message: data.message || res.statusText, status: res.status } };
    }
    return { data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to request password reset";
    return { error: { message: errorMsg } };
  }
}

/**
 * Resets user password using the verification token.
 */
export async function resetPassword(
  params: ResetPasswordParams
): Promise<AuthResponse> {
  try {
    const client = authClient as unknown as {
      resetPassword?: (p: ResetPasswordParams) => Promise<AuthResponse>;
    };

    if (typeof client.resetPassword === "function") {
      return await client.resetPassword(params);
    }

    // Direct fetch fallback
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: { message: data.message || res.statusText, status: res.status } };
    }
    return { data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to reset password";
    return { error: { message: errorMsg } };
  }
}

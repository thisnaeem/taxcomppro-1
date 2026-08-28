import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    sendResetPassword: async ({ user, url, token }) => {
      const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name || "Member",
        resetUrl,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role:      { type: "string", required: false, defaultValue: "MEMBER", input: false },
      tier:      { type: "string", required: false, defaultValue: "FREE",   input: false },
      bio:       { type: "string", required: false, input: true  },
      headline:  { type: "string", required: false, input: true  },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: appUrl,
  trustedOrigins: [
    appUrl,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://localhost:3007",
    "http://localhost:3008",
    "http://localhost:3009",
    "http://localhost:3010",
    "https://www.taxcomppro.com",
    "https://taxcomppro.com",
    "https://proconnect.taxcomppro.com",
    "https://academy.taxcomppro.com",
    "https://30daylaunch.taxcomppro.com",
    "https://auditplaybook.taxcomppro.com",
    "https://irsfinedefense.taxcomppro.com",
    "https://schedulecrecon.taxcomppro.com",
    "https://credits.taxcomppro.com",
    "https://affiliate.taxcomppro.com",
    "https://ultimate.taxcomppro.com",
  ],
  advanced: {
    crossSubdomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production" ? ".taxcomppro.com" : undefined,
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? ".taxcomppro.com" : undefined,
    },
  },
});

export type Session = typeof auth.$Infer.Session;

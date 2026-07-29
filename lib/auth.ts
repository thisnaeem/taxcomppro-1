import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
    "https://www.taxcomppro.com",
    "https://taxcomppro.com",
  ],
});

export type Session = typeof auth.$Infer.Session;

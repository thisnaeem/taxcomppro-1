import { customSession } from "better-auth/plugins";
import { reconcileAcademyMembershipBonus } from "@/lib/academy-membership-bonus";
import { authOrigins, safeAuthReturn, sharedCookieOptions } from "@/lib/auth-navigation";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { ensureProfileSlug } from "@/lib/profileSlug";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendWelcomeEmail, notifyAdminNewSignup } from "@/lib/email";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  plugins: [customSession(async ({user,session}) => {
    await reconcileAcademyMembershipBonus(user.id);
    const fresh = await prisma.user.findUniqueOrThrow({where:{id:user.id},select:{tier:true,role:true,bio:true,headline:true,professionalTitle:true,phone:true}});
    return {user:{...user,...fresh},session};
  })],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureProfileSlug(user.id, user.name);
          try {
            await sendWelcomeEmail({ to: user.email, userName: user.name });
          } catch (emailErr) {
            console.error("[Auth Hook] Failed to send welcome email:", emailErr);
          }
          try {
            await notifyAdminNewSignup({
              id: user.id,
              email: user.email,
              name: user.name,
              role: (user as any).role || "MEMBER",
              tier: (user as any).tier || "FREE",
              phone: (user as any).phone,
              professionalTitle: (user as any).professionalTitle,
            });
          } catch (adminErr) {
            console.error("[Auth Hook] Failed to send admin signup notification:", adminErr);
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    sendResetPassword: async ({ user, url, token }) => {
      const resetUrl = new URL("/reset-password", appUrl);
      resetUrl.searchParams.set("token", token);
      const callback = new URL(url).searchParams.get("callbackURL");
      if (callback) {
        const destination = new URL(callback, appUrl);
        resetUrl.searchParams.set("next", safeAuthReturn(destination.searchParams.get("next")));
      }
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name || "Member",
        resetUrl: resetUrl.href,
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
      professionalTitle: { type: "string", required: false, input: true },
      phone:     { type: "string", required: false, input: true  },
      role:      { type: "string", required: false, defaultValue: "MEMBER", input: false },
      tier:      { type: "string", required: false, defaultValue: "FREE",   input: false },
      bio:       { type: "string", required: false, input: true  },
      headline:  { type: "string", required: false, input: true  },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: appUrl,
  trustedOrigins: [appUrl, ...authOrigins],
  advanced: sharedCookieOptions,
});

export type Session = typeof auth.$Infer.Session;
